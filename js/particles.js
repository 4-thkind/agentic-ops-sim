/**
 * particles.js — Ambient floating particles + stars on canvas.
 * Creates a subtle, living background.
 */

const ParticleSystem = (() => {
  let canvas, ctx;
  let particles = [];
  let stars = [];
  let animId;
  let running = false;

  const PARTICLE_COUNT = 40;
  const STAR_COUNT = 120;

  function init() {
    canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    createStars();
    createParticles();
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.6,
        r: 0.5 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.5,
        twinkleSpeed: 0.005 + Math.random() * 0.015,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  function createParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(makeParticle());
    }
  }

  function makeParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.1 - Math.random() * 0.4,
      r: 1 + Math.random() * 2,
      alpha: 0.1 + Math.random() * 0.3,
      color: Math.random() > 0.75 ? '255,56,92' : '255,255,255',
      life: 0,
      maxLife: 300 + Math.random() * 400
    };
  }

  function draw(time) {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    for (const s of stars) {
      const flicker = Math.sin(time * s.twinkleSpeed + s.twinklePhase);
      const a = s.alpha * (0.5 + 0.5 * flicker);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fill();
    }

    // Draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;

      const progress = p.life / p.maxLife;
      const alpha = p.alpha * (progress < 0.1 ? progress / 0.1 : progress > 0.8 ? (1 - progress) / 0.2 : 1);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${alpha})`;
      ctx.fill();

      if (p.life > p.maxLife || p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
        particles[i] = makeParticle();
        particles[i].y = canvas.height + 10;
      }
    }

    animId = requestAnimationFrame(draw);
  }

  function start() {
    if (running) return;
    running = true;
    animId = requestAnimationFrame(draw);
  }

  function stop() {
    running = false;
    if (animId) cancelAnimationFrame(animId);
  }

  return { init, start, stop };
})();
