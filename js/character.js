/**
 * character.js — The presenter's states.
 *
 * First slide: he walks on from the wings. After that he stays at the
 * screen; between slides his arm drops, then comes back up to present.
 */

const Character = (() => {
  let el;

  function init() {
    el = document.getElementById('character');
  }

  function walk() {
    if (!el) return;
    el.classList.remove('arrived', 'speaking');
    if (el.classList.contains('offstage')) {
      el.classList.add('walking');
      el.classList.remove('offstage');   // transition carries him on
    } else {
      el.classList.add('switching');
    }
  }

  function arrive() {
    if (!el) return;
    const walked = el.classList.contains('walking');
    el.classList.remove('walking', 'switching');
    if (walked) {
      el.classList.add('arrived');
      setTimeout(() => el.classList.remove('arrived'), 600);
    }
  }

  function setSpeaking(isSpeaking) {
    if (!el) return;
    el.classList.toggle('speaking', isSpeaking);
  }

  return { init, walk, arrive, setSpeaking };
})();
