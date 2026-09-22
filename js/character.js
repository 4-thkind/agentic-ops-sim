/**
 * character.js — Controls the AI agent character's state and animation.
 */

const Character = (() => {
  let el;

  function init() {
    el = document.getElementById('character');
  }

  function walk() {
    if (!el) return;
    el.classList.add('walking');
    el.classList.remove('arrived', 'speaking');
  }

  function arrive() {
    if (!el) return;
    el.classList.remove('walking');
    el.classList.add('arrived');
    // Remove bounce class after animation
    setTimeout(() => el.classList.remove('arrived'), 600);
  }

  function setSpeaking(isSpeaking) {
    if (!el) return;
    el.classList.toggle('speaking', isSpeaking);
  }

  return { init, walk, arrive, setSpeaking };
})();
