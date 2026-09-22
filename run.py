#!/usr/bin/env python3
"""
Crisis to Command - one-command launcher.

    python run.py

Installs what's missing, renders any narration not already cached, starts the
narration service and the static server, and opens the browser. Ctrl+C stops
everything.

    python run.py --no-voice     skip the narration service (browser voices)
    python run.py --port 8080    serve the site on another port
"""

import argparse
import atexit
import http.server
import socket
import socketserver
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SERVER = ROOT / "server"
TTS_PORT = 8000

REQUIRED = ["fastapi", "uvicorn", "edge_tts", "pydantic"]


def reap_with_parent(proc):
    """Tie a child process to this one so closing the terminal kills it too.

    Without this, a hard kill of the launcher skips the cleanup handler and
    leaves the narration service holding its port until it is killed by hand.
    On Windows that means a job object; elsewhere the child gets its own
    process group and atexit terminates it.
    """
    if sys.platform == "win32":
        try:
            import ctypes
            from ctypes import wintypes

            k32 = ctypes.WinDLL("kernel32", use_last_error=True)
            job = k32.CreateJobObjectW(None, None)
            if not job:
                return

            # JOBOBJECT_EXTENDED_LIMIT_INFORMATION, trimmed to the field we set.
            class Info(ctypes.Structure):
                _fields_ = [("raw", ctypes.c_byte * 144)]

            info = Info()
            # LimitFlags sits at offset 16; 0x2000 is KILL_ON_JOB_CLOSE.
            ctypes.memmove(ctypes.byref(info, 16),
                           ctypes.byref(wintypes.DWORD(0x2000)), 4)
            k32.SetInformationJobObject(job, 9, ctypes.byref(info),
                                        ctypes.sizeof(info))

            handle = k32.OpenProcess(0x1F0FFF, False, proc.pid)
            if handle:
                k32.AssignProcessToJobObject(job, handle)
                k32.CloseHandle(handle)

            # Keep the job handle alive for the life of the launcher.
            proc._job = job
        except Exception:
            pass  # cleanup still runs on a normal exit

    atexit.register(lambda: proc.poll() is None and proc.kill())


def say(msg, end="\n"):
    print(f"  {msg}", end=end, flush=True)


def free(port):
    with socket.socket() as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind(("127.0.0.1", port))
            return True
        except OSError:
            return False


def ensure_deps():
    missing = []
    for mod in REQUIRED:
        try:
            __import__(mod)
        except ImportError:
            missing.append(mod)

    if not missing:
        say("Dependencies ready")
        return True

    say(f"Installing {', '.join(missing)} ...")
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "-q", "-r",
         str(SERVER / "requirements.txt")],
    )
    if result.returncode != 0:
        say("Install failed - continuing with browser voices")
        return False

    say("Dependencies installed")
    return True


def prewarm():
    """Render any clips not already on disk. Safe to run every launch."""
    say("Preparing narration ", end="")
    proc = subprocess.run(
        [sys.executable, "prewarm.py"],
        cwd=SERVER, capture_output=True, text=True,
    )
    if proc.returncode != 0:
        print("\n")
        say("Narration prep failed - the site will use browser voices.")
        tail = (proc.stderr or proc.stdout).strip().splitlines()
        if tail:
            say(f"  {tail[-1]}")
        return False

    rendered = proc.stdout.count("rendered")
    cached = proc.stdout.count("cached")
    print(f"({rendered} rendered, {cached} already cached)")
    return True


def start_tts():
    """Launch the narration service and wait for it to answer /health."""
    if not free(TTS_PORT):
        say(f"Narration service already running on :{TTS_PORT}")
        return None

    proc = subprocess.Popen(
        [sys.executable, "tts.py"],
        cwd=SERVER,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    reap_with_parent(proc)

    for _ in range(40):  # up to ~10s
        if proc.poll() is not None:
            say("Narration service exited on startup - using browser voices")
            return None
        try:
            with urllib.request.urlopen(
                f"http://127.0.0.1:{TTS_PORT}/health", timeout=1
            ):
                say(f"Narration service on :{TTS_PORT}")
                return proc
        except (urllib.error.URLError, OSError):
            time.sleep(0.25)

    say("Narration service did not respond - using browser voices")
    proc.terminate()
    return None


def serve_site(first_port, tries=20):
    """Bind the first free port at or after first_port and start serving.

    The bind itself is the test - probing with a throwaway socket and binding
    afterwards races, and SO_REUSEADDR on Windows lets that second bind attach
    to a port another process is already serving.
    """
    handler = partial(QuietHandler, directory=str(ROOT))

    class Server(socketserver.ThreadingTCPServer):
        allow_reuse_address = False  # so a taken port fails loudly here
        daemon_threads = True

    last = None
    for port in range(first_port, first_port + tries):
        try:
            httpd = Server(("127.0.0.1", port), handler)
        except OSError as exc:
            last = exc
            continue
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
        return httpd, port

    raise SystemExit(
        f"  No free port in {first_port}-{first_port + tries - 1} ({last})"
    )


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass  # one request line per asset is noise, not information

    def end_headers(self):
        # Always serve fresh files - edits show up on reload during a demo.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    ap = argparse.ArgumentParser(description="Run the Crisis to Command simulation.")
    ap.add_argument("--port", type=int, default=5500, help="port for the site")
    ap.add_argument("--no-voice", action="store_true",
                    help="skip the neural narration service")
    ap.add_argument("--no-browser", action="store_true",
                    help="do not open a browser window")
    args = ap.parse_args()

    print("\n  Crisis to Command\n")

    tts = None
    if args.no_voice:
        say("Neural narration skipped - using browser voices")
    elif ensure_deps() and prewarm():
        tts = start_tts()

    httpd, port = serve_site(args.port)
    if port != args.port:
        say(f"Port {args.port} busy - using {port}")
    url = f"http://127.0.0.1:{port}/index.html"

    engine = "neural voices" if tts else "browser voices"
    print(f"\n  Ready at {url}  ({engine})")
    print("  Ctrl+C to stop\n")

    if not args.no_browser:
        webbrowser.open(url)

    try:
        while True:
            time.sleep(1)
            if tts and tts.poll() is not None:
                say("Narration service stopped - the page falls back on its own")
                tts = None
    except KeyboardInterrupt:
        print()
    finally:
        say("Shutting down")
        httpd.shutdown()
        if tts:
            tts.terminate()
            try:
                tts.wait(timeout=5)
            except subprocess.TimeoutExpired:
                tts.kill()
        say("Done\n")


if __name__ == "__main__":
    main()
