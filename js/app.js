/**
 * app.js — Main application bootstrap.
 * Initializes all modules and orchestrates the startup flow.
 */

(function() {
  'use strict';

  const loader   = document.getElementById('loader');
  const startBtn = document.getElementById('startBtn');
  const sim      = document.getElementById('sim');

  // 1. Init the simulation behind the intro
  Character.init();
  Navigation.init();

  // 2. Scale each slide so it fits without scrolling. Mobile scrolls instead,
  //    since shrinking text on a phone makes it unreadable.
  const TOP_BAND = 84, BOTTOM = 170, AIR = 16;
  function fitCards() {
    const mobile = window.innerWidth <= 744;
    const room = window.innerHeight - TOP_BAND - BOTTOM - AIR;
    document.querySelectorAll('.card').forEach(card => {
      if (mobile) { card.style.removeProperty('--fit'); return; }
      const fit = Math.min(1, room / card.offsetHeight);
      card.style.setProperty('--fit', fit.toFixed(3));
    });
  }
  fitCards();
  window.addEventListener('resize', fitCards);
  if (document.fonts) document.fonts.ready.then(fitCards);

  // 3. Hide loader after fonts/assets settle
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('done');
      setTimeout(() => loader.remove(), 700);
    }, 600);
  });

  // Also hide loader if load event already fired
  if (document.readyState === 'complete') {
    setTimeout(() => {
      loader.classList.add('done');
      setTimeout(() => loader.remove(), 700);
    }, 200);
  }

  // 4. Start button → exit intro → launch simulation
  startBtn.addEventListener('click', () => {
    startBtn.disabled = true;

    Intro.exit(() => {
      sim.removeAttribute('aria-hidden');
      sim.classList.add('active');

      // Navigate to first zone after a brief beat
      setTimeout(() => {
        Navigation.goTo(0);
      }, 400);
    });
  });
})();
