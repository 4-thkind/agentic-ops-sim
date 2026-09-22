"""
Pre-render every zone's narration into the cache.

Run this once before a presentation. The simulation then plays each clip
from disk with no synthesis delay, and survives a flaky network on the day.

    python prewarm.py
"""

import asyncio
import json
import re
from pathlib import Path

import edge_tts

from tts import DEFAULT_VOICE, SpeakRequest, _cache_path, _hz, _pct

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "js" / "data.js"


def load_zones():
    """Pull the speaker table and scripts straight out of data.js.

    Keeping this as the single source avoids the narration drifting between
    what the page shows and what the cache holds.
    """
    src = DATA.read_text(encoding="utf-8")

    speakers = {}
    for key, body in re.findall(r"(\w+):\s*\{([^}]*)\}", src[src.index("const SPEAKERS"):src.index("const ZONES")]):
        fields = dict(re.findall(r"(\w+):\s*'([^']*)'", body))
        nums = dict(re.findall(r"(rate|pitch):\s*([\d.]+)", body))
        speakers[key] = {
            "voice": fields.get("voice", DEFAULT_VOICE),
            "rate": float(nums.get("rate", 1.0)),
            "pitch": float(nums.get("pitch", 1.0)),
        }

    zones = []
    block = src[src.index("const ZONES"):]
    for zid, spk, text in re.findall(
        r"id:\s*'([^']+)',\s*speakerId:\s*'([^']+)',\s*narration:\s*`([^`]*)`", block
    ):
        zones.append((zid, spk, text.strip()))

    return speakers, zones


async def main():
    speakers, zones = load_zones()
    if not zones:
        raise SystemExit("No zones parsed from data.js — check the file format.")

    print(f"Rendering {len(zones)} narrations\n")

    for zid, spk, text in zones:
        s = speakers.get(spk, {"voice": DEFAULT_VOICE, "rate": 1.0, "pitch": 1.0})
        req = SpeakRequest(id=zid, text=text, voice=s["voice"],
                           rate=s["rate"], pitch=s["pitch"])
        path = _cache_path(req)

        if path.exists():
            print(f"  cached   {zid:<12} {s['voice']}")
            continue

        communicate = edge_tts.Communicate(
            text=text, voice=s["voice"],
            rate=_pct(s["rate"], 50), pitch=_hz(s["pitch"]),
        )
        tmp = path.with_suffix(".part")
        await communicate.save(str(tmp))
        tmp.replace(path)
        print(f"  rendered {zid:<12} {s['voice']:<28} {path.stat().st_size // 1024} KB")

    print("\nDone. Start the service with: python tts.py")


if __name__ == "__main__":
    asyncio.run(main())
