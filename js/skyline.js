/**
 * skyline.js — Procedurally generates a city skyline with lit windows.
 */

const Skyline = (() => {
  function generate() {
    const container = document.getElementById('skyline');
    if (!container) return;

    const totalWidth = window.innerWidth * ZONES.length;
    const buildingCount = Math.floor(totalWidth / 50);

    for (let i = 0; i < buildingCount; i++) {
      const bldg = document.createElement('div');
      bldg.className = 'bldg';

      const w = 20 + Math.random() * 40;
      const h = 40 + Math.random() * 200;

      bldg.style.width  = w + 'px';
      bldg.style.height = h + 'px';

      // Add random windows
      const cols = Math.floor(w / 14);
      const rows = Math.floor(h / 18);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() > 0.45) {
            const win = document.createElement('div');
            win.className = 'bldg-window';
            win.style.left = (6 + c * 14) + 'px';
            win.style.top  = (8 + r * 18) + 'px';
            win.style.opacity = (0.3 + Math.random() * 0.5).toString();
            bldg.appendChild(win);
          }
        }
      }

      container.appendChild(bldg);
    }
  }

  /** Parallax shift based on current zone */
  function parallax(zoneIndex) {
    const el = document.getElementById('skyline');
    if (!el) return;
    const shift = zoneIndex * window.innerWidth * 0.3;
    el.style.transform = `translateX(-${shift}px)`;
  }

  return { generate, parallax };
})();
