"""
Neural narration service for the Crisis to Command simulation.

Renders each zone's script with Edge-TTS (Microsoft neural voices — free,
no API key) and caches the MP3 on disk, so a zone is synthesised once and
replayed instantly for the rest of the demo.

Run:
    pip install -r requirements.txt
    python tts.py

The frontend probes /health and falls back to the browser's speech engine
if this service is not running, so the site never hard-depends on it.
"""

import asyncio
import hashlib
import os
from collections import defaultdict
from pathlib import Path

import edge_tts
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

CACHE = Path(__file__).parent / "cache"
CACHE.mkdir(exist_ok=True)

DEFAULT_VOICE = "en-US-JennyNeural"

# One lock per clip: concurrent requests for the same uncached clip would
# otherwise each render to the same temp path and clobber each other.
_locks: dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

app = FastAPI(title="Crisis to Command — Narration")

# The page is opened from file:// or a static host; allow any origin since
# this only ever serves generated narration audio on localhost.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SpeakRequest(BaseModel):
    id: str
    text: str
    voice: str | None = None
    rate: float = 1.0
    pitch: float = 1.0


def _pct(value: float, cap: float) -> str:
    """Edge-TTS takes relative offsets as signed percentages."""
    delta = max(-cap, min(cap, (value - 1.0) * 100))
    return f"{delta:+.0f}%"


def _hz(value: float) -> str:
    """Pitch multipliers from the speaker table map onto a +/-50Hz offset."""
    delta = max(-50, min(50, (value - 1.0) * 200))
    return f"{delta:+.0f}Hz"


def _cache_path(req: SpeakRequest) -> Path:
    # Key on everything that changes the audio, so edited copy re-renders.
    key = f"{req.id}|{req.voice}|{req.rate}|{req.pitch}|{req.text}"
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()[:20]
    return CACHE / f"{req.id}-{digest}.mp3"


@app.get("/health")
def health():
    return {"status": "ok", "engine": "edge-tts", "cached": len(list(CACHE.glob("*.mp3")))}


@app.post("/speak")
async def speak(req: SpeakRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is empty")

    path = _cache_path(req)

    if not path.exists():
        async with _locks[path.name]:
            # Another request may have finished it while we waited.
            if not path.exists():
                communicate = edge_tts.Communicate(
                    text=req.text,
                    voice=req.voice or DEFAULT_VOICE,
                    rate=_pct(req.rate, 50),
                    pitch=_hz(req.pitch),
                )
                # Unique temp name so parallel renders never share a file.
                tmp = path.with_suffix(f".{os.getpid()}.{id(req)}.part")
                try:
                    await communicate.save(str(tmp))
                    os.replace(tmp, path)  # atomic publish
                finally:
                    tmp.unlink(missing_ok=True)

    return FileResponse(path, media_type="audio/mpeg")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
