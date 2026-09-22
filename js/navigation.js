/**
 * navigation.js — Handles zone transitions, progress, speaker bar, input.
 */

const Navigation = (() => {
  let currentZone = -1;
  let transitioning = false;
  const totalZones = ZONES.length;

  // DOM refs (set in init)
  let world, progressFill, progressDots;
  let btnPrev, btnNext, btnVoice;
  let hudSpeaker, spkAvatar, spkName, spkRole, spkWave;
  let voiceIcon, voiceLabel, voiceEngine;
  let counterCurrent;

  function init() {
    world        = document.getElementById('world');
    progressFill = document.getElementById('progressFill');
    progressDots = document.getElementById('progressDots');
    btnPrev      = document.getElementById('btnPrev');
    btnNext      = document.getElementById('btnNext');
    btnVoice     = document.getElementById('btnVoice');
    hudSpeaker   = document.getElementById('hudSpeaker');
    spkAvatar    = document.getElementById('spkAvatar');
    spkName      = document.getElementById('spkName');
    spkRole      = document.getElementById('spkRole');
    spkWave      = document.getElementById('spkWave');
    voiceIcon    = document.getElementById('voiceIcon');
    voiceLabel   = document.getElementById('voiceLabel');
    voiceEngine  = document.getElementById('voiceEngine');
    counterCurrent = document.getElementById('counterCurrent');

    // Create progress dots
    for (let i = 0; i < totalZones; i++) {
      const dot = document.createElement('button');
      dot.className = 'pdot';
      dot.setAttribute('aria-label', `Go to zone ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      progressDots.appendChild(dot);
    }

    // Button listeners
    btnPrev.addEventListener('click', () => goTo(currentZone - 1));
    btnNext.addEventListener('click', () => goTo(currentZone + 1));
    btnVoice.addEventListener('click', toggleVoice);

    // Keyboard
    document.addEventListener('keydown', handleKey);

    // Touch swipe
    let touchX = 0;
    document.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    document.addEventListener('touchend', e => {
      if (currentZone < 0) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 70) {
        dx < 0 ? goTo(currentZone + 1) : goTo(currentZone - 1);
      }
    }, { passive: true });

    // Voice state callbacks
    VoiceEngine.onStateChange(
      () => { // onStart
        Character.setSpeaking(true);
        showSpeaker(currentZone, true);
      },
      () => { // onEnd
        Character.setSpeaking(false);
        showSpeaker(currentZone, false);
      }
    );
  }

  function goTo(idx) {
    if (idx < 0 || idx >= totalZones || idx === currentZone || transitioning) return;
    transitioning = true;

    VoiceEngine.stop();
    Character.walk();

    currentZone = idx;

    // Move world
    world.style.transform = `translateX(-${idx * 100}vw)`;

    // Skyline parallax
    Skyline.parallax(idx);

    // Update zone classes
    document.querySelectorAll('.zone').forEach((z, i) => {
      z.classList.toggle('active', i === idx);
    });

    // Update progress
    const pct = ((idx + 1) / totalZones) * 100;
    progressFill.style.width = pct + '%';
    document.querySelectorAll('.pdot').forEach((d, i) => {
      d.classList.toggle('active', i === idx);
      if (i < idx) d.classList.add('visited');
    });

    // Update buttons
    btnPrev.disabled = idx === 0;
    btnNext.disabled = idx === totalZones - 1;

    // Counter
    counterCurrent.textContent = idx + 1;

    // Show speaker immediately (idle state)
    if (VoiceEngine.isEnabled()) {
      showSpeaker(idx, false);
      hudSpeaker.classList.remove('hidden');
    }

    // Character arrives after world transition
    setTimeout(() => {
      Character.arrive();
      transitioning = false;

      // Start narration, and warm the next clip while this one plays
      if (VoiceEngine.isEnabled()) {
        VoiceEngine.speak(idx);
        VoiceEngine.prefetch(idx + 1);
        setTimeout(markEngine, 600);
      }
    }, 1200);
  }

  function showSpeaker(idx, active) {
    const zone = ZONES[idx];
    const speaker = SPEAKERS[zone.speakerId];
    spkAvatar.textContent = speaker.initials;
    spkName.textContent   = speaker.name;
    spkRole.textContent   = speaker.role;
    spkWave.className     = active ? 'speaker-wave' : 'speaker-wave idle';
    hudSpeaker.classList.remove('hidden');
  }

  const ICON_ON  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9a4 4 0 0 1 0 6"/><path d="M19.5 6.5a8 8 0 0 1 0 11"/></svg>';
  const ICON_OFF = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 10l4 4"/><path d="M21 10l-4 4"/></svg>';

  function toggleVoice() {
    const on = VoiceEngine.toggle();
    voiceIcon.innerHTML    = on ? ICON_ON : ICON_OFF;
    voiceLabel.textContent = on ? 'Voice on' : 'Voice off';
    btnVoice.classList.toggle('off', !on);
    if (!on) {
      hudSpeaker.classList.add('hidden');
      Character.setSpeaking(false);
    } else if (currentZone >= 0) {
      VoiceEngine.speak(currentZone);
    }
  }

  /** Label which engine is actually driving narration. */
  function markEngine() {
    if (!voiceEngine) return;
    const neural = VoiceEngine.usingNeural();
    voiceEngine.textContent = neural ? 'Neural' : 'System';
    voiceEngine.classList.toggle('neural', neural);
  }

  function handleKey(e) {
    if (currentZone < 0) return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      goTo(currentZone + 1);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(currentZone - 1);
    }
  }

  function getCurrent() { return currentZone; }

  return { init, goTo, getCurrent };
})();
