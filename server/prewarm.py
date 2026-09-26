"""
Pre-render every intro narration and workshop line into the cache.

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
    block = src[src.index("const ZONES"):src.index("const LINES")]
    for zid, spk, text in re.findall(
        r"id:\s*'([^']+)',\s*speakerId:\s*'([^']+)',\s*narration:\s*`([^`]*)`", block
    ):
        zones.append((zid, spk, text.strip()))

    # Every backtick string after LINES is a workshop line spoken by the
    # advisor. The page requests them with id 'agent', so render them the same.
    tail = src[src.index("const LINES"):]
    seen = set()
    for text in re.findall(r"`([^`]*)`", tail):
        text = text.strip()
        if text and text not in seen:
            seen.add(text)
            zones.append(("agent", "agent", text))

    return speakers, zones


async def render(sem, speakers, zid, spk, text):
    s = speakers.get(spk, {"voice": DEFAULT_VOICE, "rate": 1.0, "pitch": 1.0})
    req = SpeakRequest(id=zid, text=text, voice=s["voice"],
                       rate=s["rate"], pitch=s["pitch"])
    path = _cache_path(req)
    label = f"{zid:<9} {text[:48]}"

    if path.exists():
        print(f"  cached   {label}")
        return

    async with sem:
        communicate = edge_tts.Communicate(
            text=text, voice=s["voice"],
            rate=_pct(s["rate"], 50), pitch=_hz(s["pitch"]),
        )
        tmp = path.with_suffix(".part")
        await communicate.save(str(tmp))
        tmp.replace(path)
    print(f"  rendered {label}")


async def main():
    speakers, zones = load_zones()
    if not zones:
        raise SystemExit("No zones parsed from data.js — check the file format.")

    print(f"Rendering {len(zones)} clips\n")
    sem = asyncio.Semaphore(6)  # a few at once; Edge-TTS throttles bursts
    await asyncio.gather(*(render(sem, speakers, *z) for z in zones))

    print("\nDone. Start the service with: python tts.py")


if __name__ == "__main__":
    asyncio.run(main())
