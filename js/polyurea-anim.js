/* ============================================================
   SKY SHIELD DEFENSE — Polyurea Landing Hero
   Oil vessels at sea, drone strikes deflected by polyurea barrier
   ============================================================ */

(function polyureaScene() {
  'use strict';

  const canvas = document.getElementById('polyurea-canvas');
  if (!canvas) return;
  // Respect reduced motion + skip on small screens (perf on mobile ads traffic)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 900) {
    canvas.remove();
    return;
  }
  const ctx = canvas.getContext('2d');

  let W, H, HOR, t = 0;
  const stars = [], ships = [], drones = [], sparks = [];
  const GOLD = '200,168,75';

  /* ── Ships ── */
  function makeShip(i) {
    return {
      i,
      len: 0, x: 0, speed: 0,
      shield: 0,        // frames of visible barrier dome
      ripple: 0,        // expanding ring after an impact
      flash: 0,         // "PROTECTED" label timer
      init() {
        this.len = W * (0.16 + this.i * 0.03);
        this.speed = 0.14 + this.i * 0.05;
        this.x = W * (0.15 + this.i * 0.38);
      },
      get y() { return HOR + 16 + this.i * 26 + Math.sin(t * 0.012 + this.i * 2.4) * 2.2; },
      get cx() { return this.x + this.len * 0.5; },
      update() {
        this.x += this.speed;
        if (this.x > W + 60) this.x = -this.len - 80 - Math.random() * 300;
        if (this.shield > 0) this.shield--;
        if (this.ripple > 0) this.ripple++;
        if (this.ripple > 70) this.ripple = 0;
        if (this.flash > 0) this.flash--;
      },
      draw() {
        const L = this.len, x = this.x, y = this.y, hullH = L * 0.075;
        if (x + L < -20 || x > W + 20) return;
        ctx.save();

        // Reflection
        ctx.save();
        ctx.globalAlpha = 0.16;
        ctx.translate(0, y * 2 + hullH * 2.1);
        ctx.scale(1, -1);
        this.drawBody(x, y, L, hullH);
        ctx.restore();

        this.drawBody(x, y, L, hullH);

        // Polyurea barrier dome
        if (this.shield > 0) {
          const a = Math.min(1, this.shield / 30) * (0.55 + Math.sin(t * 0.25) * 0.1);
          const rx = L * 0.62, ry = L * 0.30;
          const g = ctx.createLinearGradient(this.cx, y - ry, this.cx, y + hullH);
          g.addColorStop(0, `rgba(${GOLD},${a})`);
          g.addColorStop(1, `rgba(${GOLD},${a * 0.25})`);
          ctx.beginPath();
          ctx.ellipse(this.cx, y + hullH * 0.6, rx, ry, 0, Math.PI, 0);
          ctx.strokeStyle = g;
          ctx.lineWidth = 2;
          ctx.shadowColor = `rgba(${GOLD},0.8)`;
          ctx.shadowBlur = 14;
          ctx.stroke();
          ctx.shadowBlur = 0;
          // Hex texture hint on the dome
          ctx.globalAlpha = a * 0.35;
          for (let k = 1; k <= 2; k++) {
            ctx.beginPath();
            ctx.ellipse(this.cx, y + hullH * 0.6, rx * (1 - k * 0.12), ry * (1 - k * 0.12), 0, Math.PI, 0);
            ctx.strokeStyle = `rgba(${GOLD},0.5)`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }

        // Impact ripple rings
        if (this.ripple > 0) {
          const p = this.ripple / 70;
          ctx.beginPath();
          ctx.ellipse(this.cx, this.y + hullH * 0.6, L * 0.62 * (1 + p * 0.5), L * 0.3 * (1 + p * 0.5), 0, Math.PI, 0);
          ctx.strokeStyle = `rgba(${GOLD},${0.5 * (1 - p)})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // PROTECTED label
        if (this.flash > 0) {
          const a = Math.min(1, this.flash / 40);
          const fs = Math.max(9, W * 0.008);
          ctx.fillStyle = `rgba(${GOLD},${a})`;
          ctx.font = `700 ${fs}px 'Courier New',monospace`;
          ctx.textAlign = 'center';
          ctx.fillText('PROTECTED — POLYUREA BARRIER', this.cx, y - L * 0.32);
        }
        ctx.restore();
      },
      drawBody(x, y, L, hullH) {
        // Hull (tanker profile, bow to the right)
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + L * 0.94, y);
        ctx.lineTo(x + L, y + hullH * 0.45);
        ctx.lineTo(x + L * 0.97, y + hullH);
        ctx.lineTo(x + L * 0.03, y + hullH);
        ctx.lineTo(x, y + hullH * 0.55);
        ctx.closePath();
        ctx.fillStyle = '#0c1a2c';
        ctx.fill();
        ctx.strokeStyle = 'rgba(120,160,205,0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Deck piping (tanker look)
        ctx.strokeStyle = 'rgba(90,130,170,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + L * 0.12, y - hullH * 0.18);
        ctx.lineTo(x + L * 0.78, y - hullH * 0.18);
        ctx.stroke();
        for (let k = 0; k < 5; k++) {
          const px = x + L * (0.16 + k * 0.14);
          ctx.beginPath();
          ctx.moveTo(px, y);
          ctx.lineTo(px, y - hullH * 0.34);
          ctx.stroke();
        }

        // Superstructure at stern (left)
        const sw = L * 0.11, sh = hullH * 1.5;
        ctx.fillStyle = '#12253c';
        ctx.fillRect(x + L * 0.045, y - sh, sw, sh);
        ctx.fillStyle = '#0c1a2c';
        ctx.fillRect(x + L * 0.065, y - sh - hullH * 0.4, sw * 0.35, hullH * 0.4);
        // Bridge windows
        ctx.fillStyle = 'rgba(120,190,255,0.5)';
        for (let k = 0; k < 3; k++) {
          ctx.fillRect(x + L * 0.055 + k * sw * 0.3, y - sh + sh * 0.15, sw * 0.18, sh * 0.1);
        }
        // Nav lights
        const blink = Math.sin(t * 0.09 + x * 0.05) > 0.2 ? 0.9 : 0.25;
        ctx.beginPath();
        ctx.arc(x + L * 0.075, y - sh - hullH * 0.5, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,80,80,${blink})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + L * 0.985, y + hullH * 0.2, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(90,220,140,${blink})`;
        ctx.fill();
      },
    };
  }

  /* ── Drones ── */
  function makeDrone() {
    const target = ships[Math.floor(Math.random() * ships.length)];
    return {
      target,
      x: Math.random() > 0.5 ? -40 : W + 40,
      y: H * (0.10 + Math.random() * 0.16),
      phase: 'approach',   // approach | aim | leave
      aimT: 0,
      missile: null,       // {x,y,vx,vy,trail:[]}
      done: false,
      update() {
        const tx = this.target.cx, hover = H * (0.16 + 0.08 * Math.abs(Math.sin(this.y)));
        if (this.phase === 'approach') {
          this.x += (tx - this.x) * 0.012;
          this.y += (hover - this.y) * 0.02;
          if (Math.abs(this.x - tx) < W * 0.05) { this.phase = 'aim'; this.aimT = 0; }
        } else if (this.phase === 'aim') {
          this.x += (tx - this.x) * 0.04;
          this.aimT++;
          if (this.aimT === 55) this.fire();
          if (this.aimT > 55 && !this.missile) this.phase = 'leave';
        } else if (this.phase === 'leave') {
          this.x += this.x > W / 2 ? 2.2 : -2.2;
          this.y -= 0.8;
          if (this.x < -60 || this.x > W + 60) this.done = true;
        }
        this.updateMissile();
      },
      fire() {
        this.missile = { x: this.x, y: this.y + 8, trail: [] };
      },
      updateMissile() {
        const m = this.missile;
        if (!m) return;
        const s = this.target;
        const ty = s.y + s.len * 0.02;
        const dx = s.cx - m.x, dy = ty - m.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        // Barrier boundary: dome around ship centre
        if (d < s.len * 0.34) {
          // Impact on the polyurea barrier — vessel unharmed
          s.shield = 110;
          s.ripple = 1;
          s.flash = 130;
          for (let k = 0; k < 14; k++) {
            const ang = -Math.PI * (0.15 + Math.random() * 0.7);
            const sp = 1.2 + Math.random() * 2.4;
            sparks.push({
              x: m.x, y: m.y,
              vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
              life: 34 + Math.random() * 22,
              gold: Math.random() > 0.45,
            });
          }
          this.missile = null;
          return;
        }
        const sp = 2.6;
        m.x += dx / d * sp;
        m.y += dy / d * sp;
        m.trail.push({ x: m.x, y: m.y });
        if (m.trail.length > 14) m.trail.shift();
      },
      draw() {
        const sc = Math.max(9, W * 0.009);
        // Targeting line while aiming
        if (this.phase === 'aim' && this.aimT < 55) {
          ctx.save();
          ctx.setLineDash([3, 5]);
          ctx.beginPath();
          ctx.moveTo(this.x, this.y + sc * 0.4);
          ctx.lineTo(this.target.cx, this.target.y);
          ctx.strokeStyle = `rgba(255,70,70,${0.14 + 0.1 * Math.sin(t * 0.3)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
        // Missile
        const m = this.missile;
        if (m) {
          for (let k = 1; k < m.trail.length; k++) {
            const p0 = m.trail[k - 1], p1 = m.trail[k];
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.strokeStyle = `rgba(255,140,60,${(k / m.trail.length) * 0.7})`;
            ctx.lineWidth = 1.4 * (k / m.trail.length);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(m.x, m.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,190,90,0.95)';
          ctx.fill();
        }
        // Drone body (hostile quad)
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.strokeStyle = 'rgba(255,95,95,0.9)';
        ctx.fillStyle = '#1c2733';
        ctx.lineWidth = 1.2;
        [[-1, -0.6], [1, -0.6], [1, 0.6], [-1, 0.6]].forEach(([ax, ay]) => {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(ax * sc, ay * sc);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(ax * sc, ay * sc, sc * 0.34, sc * 0.09, 0, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,120,120,0.55)';
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255,95,95,0.9)';
        });
        ctx.fillRect(-sc * 0.34, -sc * 0.24, sc * 0.68, sc * 0.48);
        ctx.strokeRect(-sc * 0.34, -sc * 0.24, sc * 0.68, sc * 0.48);
        const blink = Math.sin(t * 0.2 + this.y) > 0 ? 1 : 0.2;
        ctx.beginPath();
        ctx.arc(0, 0, sc * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,60,60,${blink})`;
        ctx.fill();
        ctx.restore();
      },
    };
  }

  /* ── Environment ── */
  function buildStars() {
    stars.length = 0;
    const n = Math.floor((W * HOR) / 11000);
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * HOR * 0.9,
        r: Math.random() * 1.1 + 0.2, a: Math.random() * 0.4 + 0.1,
        p: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, HOR);
    g.addColorStop(0, '#02060d');
    g.addColorStop(0.7, '#051222');
    g.addColorStop(1, '#0a1f38');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, HOR);
    stars.forEach(s => {
      const tw = Math.sin(s.p + t * 0.008) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,215,245,${s.a * tw})`;
      ctx.fill();
    });
    // Horizon glow
    const hg = ctx.createLinearGradient(0, HOR - H * 0.08, 0, HOR);
    hg.addColorStop(0, 'rgba(26,92,176,0)');
    hg.addColorStop(1, 'rgba(26,92,176,0.12)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, HOR - H * 0.08, W, H * 0.08);
  }

  function drawSea() {
    const g = ctx.createLinearGradient(0, HOR, 0, H);
    g.addColorStop(0, '#08182c');
    g.addColorStop(0.5, '#050f1e');
    g.addColorStop(1, '#030a14');
    ctx.fillStyle = g;
    ctx.fillRect(0, HOR, W, H - HOR);
    // Moving wave strokes
    ctx.lineWidth = 1;
    for (let r = 0; r < 9; r++) {
      const wy = HOR + 8 + r * ((H - HOR) / 9.5);
      const amp = 1.2 + r * 0.35, sp = t * (0.012 + r * 0.003);
      ctx.beginPath();
      for (let x = 0; x <= W; x += 26) {
        const yy = wy + Math.sin(x * 0.02 + sp + r * 1.7) * amp;
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.strokeStyle = `rgba(80,140,200,${0.05 + r * 0.008})`;
      ctx.stroke();
    }
  }

  function drawSparks() {
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx; s.y += s.vy; s.vy += 0.045; s.life--;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      const a = Math.min(1, s.life / 26);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.1, 0, Math.PI * 2);
      ctx.fillStyle = s.gold ? `rgba(${GOLD},${a})` : `rgba(255,170,80,${a})`;
      ctx.fill();
    }
  }

  function drawHUD() {
    const fs = Math.max(8, W * 0.0065);
    ctx.font = `${fs}px 'Courier New',monospace`;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(200,168,75,0.4)';
    ctx.fillText('POLYUREA BARRIER — ACTIVE', 16, H - 14);
  }

  /* ── Loop ── */
  let spawnTimer = 90;
  function frame() {
    ctx.clearRect(0, 0, W, H);
    drawSky();
    drawSea();
    ships.forEach(s => { s.update(); s.draw(); });
    for (let i = drones.length - 1; i >= 0; i--) {
      drones[i].update();
      drones[i].draw();
      if (drones[i].done) drones.splice(i, 1);
    }
    drawSparks();
    drawHUD();
    if (--spawnTimer <= 0 && drones.length < 2) {
      drones.push(makeDrone());
      spawnTimer = 240 + Math.random() * 200;
    }
    t++;
    requestAnimationFrame(frame);
  }

  function resize() {
    W = canvas.width = canvas.offsetWidth || 1200;
    H = canvas.height = canvas.offsetHeight || 560;
    HOR = H * 0.60;
    buildStars();
    ships.forEach(s => s.init());
  }

  for (let i = 0; i < 3; i++) ships.push(makeShip(i));
  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
})();
