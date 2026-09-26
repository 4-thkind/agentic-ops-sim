/**
 * character.js — The presenters on stage.
 *
 * One figure per speaker (.character[data-speaker]). When the speaker
 * changes, the current presenter turns and walks off to the left, then the
 * next one walks on. Same speaker between slides: the arm drops while the
 * deck advances, then comes back up to present.
 */

const Character = (() => {
  const figs = {};
  let current = null;

  function init() {
    document.querySelectorAll('.character').forEach(el => { figs[el.dataset.speaker] = el; });
  }

  function once(el, fn) {
    el.addEventListener('transitionend', function done(e) {
      if (e.target !== el || e.propertyName !== 'transform') return;
      el.removeEventListener('transitionend', done);
      fn();
    });
  }

  function enter(el) {
    el.classList.remove('exiting', 'arrived', 'switching');
    el.classList.add('walking');
    void el.offsetWidth;                 // commit the offstage position first
    el.classList.remove('offstage');     // transition carries her/him on
    once(el, () => {
      if (el !== current) return;
      el.classList.remove('walking');
      el.classList.add('arrived');
      setTimeout(() => el.classList.remove('arrived'), 600);
    });
  }

  function exit(el) {
    el.classList.remove('speaking', 'switching', 'arrived');
    el.classList.add('walking', 'exiting', 'offstage');
    once(el, () => el.classList.remove('walking', 'exiting'));
  }

  /** Called as a slide starts moving; speakerId is that slide's speaker. */
  function walk(speakerId) {
    const next = figs[speakerId] || current || figs.narrator;
    if (!next) return;
    if (next === current) {
      next.classList.add('switching');
      return;
    }
    const prev = current;
    current = next;
    if (prev) {
      exit(prev);
      setTimeout(() => { if (current === next) enter(next); }, 700);
    } else {
      enter(next);
    }
  }

  function arrive() {
    if (current) current.classList.remove('switching');
  }

  function setSpeaking(isSpeaking) {
    if (current) current.classList.toggle('speaking', isSpeaking);
  }

  return { init, walk, arrive, setSpeaking };
})();
