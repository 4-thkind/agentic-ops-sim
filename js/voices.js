/**
 * voices.js — Narration playback.
 *
 * Primary path: neural TTS rendered by the local Python service (Edge-TTS).
 * Audio is fetched once per zone and cached in memory.
 * Fallback path: the browser's SpeechSynthesis, used when the service is
 * unreachable — so the simulation still narrates with no backend running.
 */

const VoiceEngine = (() => {
  const API = window.TTS_ENDPOINT || 'http://127.0.0.1:8000';

  const synth = window.speechSynthesis;
  let voices = [];
  let enabled = true;
  let currentlyPlaying = false;
  let onStartCb = null;
  let onEndCb = null;

  let audio = null;              // active HTMLAudioElement
  let token = 0;                 // guards against races when zones change fast
  const clipCache = {};          // speaker|text -> object URL
  let serviceUp = null;          // null = untested, then boolean

  /* ── Neural service ── */

  async function probe() {
    if (serviceUp !== null) return serviceUp;
    try {
      const res = await fetch(API + '/health', { signal: AbortSignal.timeout(1500) });
      serviceUp = res.ok;
    } catch {
      serviceUp = false;
    }
    return serviceUp;
  }

  /* A line is { id, text, speakerId }. The id must match what prewarm.py
     sends — zone id for narration, 'agent' for workshop lines — so the
     service finds the pre-rendered clip. */
  function zoneLine(zoneIdx) {
    const zone = ZONES[zoneIdx];
    return { id: zone.id, text: zone.narration, speakerId: zone.speakerId };
  }

  async function fetchClip(line) {
    const key = line.speakerId + '|' + line.text;
    if (clipCache[key]) return clipCache[key];

    const speaker = SPEAKERS[line.speakerId];
    const res = await fetch(API + '/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: line.id,
        text: line.text,
        voice: speaker.voice,
        rate: speaker.rate,
        pitch: speaker.pitch
      })
    });
    if (!res.ok) throw new Error('tts ' + res.status);

    const url = URL.createObjectURL(await res.blob());
    clipCache[key] = url;
    return url;
  }

  /** Warm the cache for the next zone so transitions are gapless. */
  function prefetch(zoneIdx) {
    if (!enabled || zoneIdx < 0 || zoneIdx >= ZONES.length) return;
    const line = zoneLine(zoneIdx);
    probe().then(up => { if (up) fetchClip(line).catch(() => {}); });
  }

  /* ── Browser fallback ── */

  const femaleRe = /female|samantha|victoria|karen|moira|tessa|serena|fiona|zira|aria|jenny|sonia|neerja|libby|susan|hazel|kate|allison|ava|joanna|emma|natural/i;
  const maleRe   = /\bmale|daniel|alex|fred|arthur|oliver|david|guy|ryan|prabhat|george|mark|rishi|tom|aaron|thomas|james|brian/i;
  const voiceCache = {};

  function loadVoices() {
    if (!synth) return;
    voices = synth.getVoices().filter(v => /^en/i.test(v.lang));
    // Prefer the OS neural voices where the platform exposes them.
    voices.sort((a, b) => score(b) - score(a));
  }
  function score(v) {
    let n = 0;
    if (/natural|neural/i.test(v.name)) n += 3;
    if (/google/i.test(v.name)) n += 2;
    if (!v.localService) n += 1;
    return n;
  }

  if (synth) {
    loadVoices();
    synth.onvoiceschanged = loadVoices;
  }

  function pickVoice(speakerId) {
    if (voiceCache[speakerId]) return voiceCache[speakerId];
    if (!voices.length) loadVoices();

    const speaker = SPEAKERS[speakerId];
    if (!speaker) return voices[0] || null;

    const pool = speaker.gender === 'f'
      ? voices.filter(v => femaleRe.test(v.name))
      : voices.filter(v => maleRe.test(v.name) && !femaleRe.test(v.name));

    const list = pool.length ? pool : voices;
    const idx = Object.keys(SPEAKERS).indexOf(speakerId);
    const voice = list.length ? list[idx % list.length] : null;

    voiceCache[speakerId] = voice;
    return voice;
  }

  function speakFallback(line, done, started) {
    if (!synth) { done(); return; }

    const speaker = SPEAKERS[line.speakerId];
    const utter = new SpeechSynthesisUtterance(line.text);
    utter.rate  = speaker.rate || 1;
    utter.pitch = speaker.pitch || 1;

    const voice = pickVoice(line.speakerId);
    if (voice) { utter.voice = voice; utter.lang = voice.lang; }

    utter.onstart = started;
    utter.onend   = done;
    utter.onerror = done;
    synth.speak(utter);

    // speechSynthesis drops onend on some builds; bound it by word count.
    const words = line.text.split(/\s+/).length;
    setTimeout(done, Math.max(10000, words * 520));
  }

  /* ── Public ── */

  function speak(zoneIdx, callbacks) {
    return speakLine(zoneLine(zoneIdx), callbacks);
  }

  async function speakLine(line, { onStart, onEnd } = {}) {
    if (!enabled) { onEnd && onEnd(); return; }

    stop();
    const mine = ++token;

    let finished = false;
    const done = () => {
      if (finished || mine !== token) return;
      finished = true;
      currentlyPlaying = false;
      onEnd && onEnd();
      onEndCb && onEndCb();
    };
    const started = () => {
      if (mine !== token) return;
      currentlyPlaying = true;
      onStart && onStart();
      onStartCb && onStartCb();
    };

    if (await probe()) {
      try {
        const url = await fetchClip(line);
        if (mine !== token) return;          // superseded while fetching

        audio = new Audio(url);
        audio.onplaying = started;
        audio.onended   = done;
        audio.onerror   = () => speakFallback(line, done, started);
        await audio.play();
        return;
      } catch {
        // fall through to the browser voice
      }
    }
    if (mine === token) speakFallback(line, done, started);
  }

  function stop() {
    token++;
    if (audio) { audio.pause(); audio.onended = audio.onerror = null; audio = null; }
    if (synth) synth.cancel();
    currentlyPlaying = false;
  }

  function toggle() {
    enabled = !enabled;
    if (!enabled) stop();
    return enabled;
  }

  function isPlaying()   { return currentlyPlaying; }
  function isEnabled()   { return enabled; }
  function isAvailable() { return true; }
  function usingNeural() { return serviceUp === true; }

  function onStateChange(startCb, endCb) {
    onStartCb = startCb;
    onEndCb = endCb;
  }

  return { speak, speakLine, stop, toggle, prefetch, isPlaying, isEnabled,
           isAvailable, usingNeural, onStateChange };
})();
