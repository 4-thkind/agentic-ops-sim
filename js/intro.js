/**
 * intro.js — Transition from the intro screen into the simulation.
 */

const Intro = (() => {
  function exit(callback) {
    const intro = document.getElementById('intro');
    intro.classList.add('exiting');
    setTimeout(() => {
      intro.style.display = 'none';
      callback && callback();
    }, 900);
  }

  return { exit };
})();
