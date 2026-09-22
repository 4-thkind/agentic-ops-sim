"""Self-check for the data.js parser and the Edge-TTS parameter mapping.

    python test_prewarm.py

Guards the brittle part of prewarm.py: if data.js is reformatted and the
regexes stop matching, the cache would silently render nothing and the demo
would fall back to browser voices without anyone noticing.
"""

from prewarm import load_zones
from tts import _hz, _pct


def test_zones_parse():
    speakers, zones = load_zones()

    assert len(zones) == 8, f"expected 8 zones, parsed {len(zones)}"
    assert len(speakers) == 8, f"expected 8 speakers, parsed {len(speakers)}"

    ids = [z[0] for z in zones]
    assert ids == ["crisis", "diagnosis", "supply", "people",
                   "technology", "decision", "escalation", "future"], ids

    for zid, spk, text in zones:
        assert spk in speakers, f"{zid} references unknown speaker {spk}"
        assert len(text) > 200, f"{zid} narration looks truncated ({len(text)} chars)"
        assert "`" not in text, f"{zid} narration captured a stray backtick"

    for key, s in speakers.items():
        assert s["voice"].endswith("Neural"), f"{key} has a non-neural voice"
        assert 0.5 <= s["rate"] <= 1.5, f"{key} rate out of range"
        assert 0.5 <= s["pitch"] <= 1.5, f"{key} pitch out of range"

    # Every speaker should be distinct, or the cast stops sounding like a cast.
    voices = [s["voice"] for s in speakers.values()]
    assert len(set(voices)) == len(voices), "duplicate voices across speakers"


def test_parameter_formatting():
    assert _pct(1.0, 50) == "+0%"
    assert _pct(1.08, 50) == "+8%"
    assert _pct(0.88, 50) == "-12%"
    assert _pct(9.0, 50) == "+50%", "rate must clamp"

    assert _hz(1.0) == "+0Hz"
    assert _hz(0.82) == "-36Hz"
    assert _hz(9.0) == "+50Hz", "pitch must clamp"


if __name__ == "__main__":
    test_zones_parse()
    test_parameter_formatting()
    print("all checks passed")
