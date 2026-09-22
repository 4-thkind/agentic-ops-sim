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
  const clipCache = {};          // zone id -> object URL
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

  async function fetchClip(zoneIdx) {
    const zone = ZONES[zoneIdx];
    if (clipCache[zone.id]) return clipCache[zone.id];

    const speaker = SPEAKERS[zone.speakerId];
    const res = await fetch(API + '/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: zone.id,
        text: zone.narration,
        voice: speaker.voice,
        rate: speaker.rate,
        pitch: speaker.pitch
      })
    });
    if (!res.ok) throw new Error('tts ' + res.status);

    const url = URL.createObjectURL(await res.blob());
    clipCache[zone.id] = url;
    return url;
  }

  /** Warm the cache for the next zone so transitions are gapless. */
  function prefetch(zoneIdx) {
    if (!enabled || zoneIdx < 0 || zoneIdx >= ZONES.length) return;
    if (clipCache[ZONES[zoneIdx].id]) return;
    probe().then(up => { if (up) fetchClip(zoneIdx).catch(() => {}); });
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

  function speakFallback(zoneIdx, done, started) {
    if (!synth) { done(); return; }

    const zone = ZONES[zoneIdx];
    const speaker = SPEAKERS[zone.speakerId];
    const utter = new SpeechSynthesisUtterance(zone.narration);
    utter.rate  = speaker.rate || 1;
    utter.pitch = speaker.pitch || 1;

    const voice = pickVoice(zone.speakerId);
    if (voice) { utter.voice = voice; utter.lang = voice.lang; }

    utter.onstart = started;
    utter.onend   = done;
    utter.onerror = done;
    synth.speak(utter);

    // speechSynthesis drops onend on some builds; bound it by word count.
    const words = zone.narration.split(/\s+/).length;
    setTimeout(done, Math.max(10000, words * 520));
  }

  /* ── Public ── */

  async function speak(zoneIdx, { onStart, onEnd } = {}) {
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
        const url = await fetchClip(zoneIdx);
        if (mine !== token) return;          // zone changed while fetching

        audio = new Audio(url);
        audio.onplaying = started;
        audio.onended   = done;
        audio.onerror   = () => speakFallback(zoneIdx, done, started);
        await audio.play();
        prefetch(zoneIdx + 1);
        return;
      } catch {
        // fall through to the browser voice
      }
    }
    if (mine === token) speakFallback(zoneIdx, done, started);
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

  return { speak, stop, toggle, prefetch, isPlaying, isEnabled,
           isAvailable, usingNeural, onStateChange };
})();
