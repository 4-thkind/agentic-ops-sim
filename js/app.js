/**
 * app.js — Main application bootstrap.
 * Initializes all modules and orchestrates the startup flow.
 */

(function() {
  'use strict';

  const loader   = document.getElementById('loader');
  const startBtn = document.getElementById('startBtn');
  const sim      = document.getElementById('sim');

  // 1. Init intro canvas animation
  Intro.init();

  // 2. Init all simulation modules (hidden behind intro)
  ParticleSystem.init();
  Skyline.generate();
  Character.init();
  Navigation.init();

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

      // Start ambient systems
      ParticleSystem.start();

      // Navigate to first zone after a brief beat
      setTimeout(() => {
        Navigation.goTo(0);
      }, 400);
    });
  });
})();
