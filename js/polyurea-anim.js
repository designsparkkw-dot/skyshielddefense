/* ============================================================
   SKY SHIELD DEFENSE — Polyurea Landing Hero (v2, detailed)
   Oil vessels at sea, drone strikes deflected by polyurea barrier
   ============================================================ */

(function polyureaScene() {
  'use strict';

  const canvas = document.getElementById('polyurea-canvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.remove();
    return;
  }
  const ctx = canvas.getContext('2d');

  let W, H, HOR, t = 0;
  const stars = [], ships = [], drones = [], sparks = [], flashes = [];
  const GOLD = '200,168,75';

  /* ══════════ SHIPS ══════════ */
  function makeShip(i) {
    return {
      i,
      len: 0, x: 0, speed: 0,
      shield: 0, ripple: 0, flash: 0,
      init() {
        this.len = W * (0.21 + this.i * 0.045);
        this.speed = 0.16 + this.i * 0.055;
        this.x = W * (0.05 + this.i * 0.4);
      },
      get y() { return HOR + 20 + this.i * 34 + Math.sin(t * 0.012 + this.i * 2.4) * 2.6; },
      get cx() { return this.x + this.len * 0.5; },
      update() {
        this.x += this.speed;
        if (this.x > W + 80) this.x = -this.len - 100 - Math.random() * 300;
        if (this.shield > 0) this.shield--;
        if (this.ripple > 0) this.ripple++;
        if (this.ripple > 70) this.ripple = 0;
        if (this.flash > 0) this.flash--;
      },
      draw() {
        const L = this.len, x = this.x, y = this.y, hullH = L * 0.08;
        if (x + L < -30 || x > W + 30) return;

        // Wake trail behind the ship
        ctx.save();
        const wakeLen = L * 0.55;
        const wg = ctx.createLinearGradient(x - wakeLen, 0, x + L * 0.1, 0);
        wg.addColorStop(0, 'rgba(150,200,240,0)');
        wg.addColorStop(1, 'rgba(150,200,240,0.22)');
        ctx.strokeStyle = wg;
        ctx.lineWidth = 1.4;
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          for (let wx = x - wakeLen; wx < x + L * 0.08; wx += 14) {
            const spread = (x + L * 0.08 - wx) / wakeLen;
            const wy = y + hullH + 2 + k * 2.5 + Math.sin(wx * 0.09 + t * 0.09) * 1.4 * spread + spread * k * 3;
            wx === x - wakeLen ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
          }
          ctx.stroke();
        }
        ctx.restore();

        // Reflection
        ctx.save();
        ctx.globalAlpha = 0.20;
        ctx.translate(0, (y + hullH) * 2 + 3);
        ctx.scale(1, -0.85);
        this.drawBody(x, y, L, hullH, true);
        ctx.restore();

        this.drawBody(x, y, L, hullH, false);

        // Bow foam
        ctx.beginPath();
        ctx.arc(x + L + 2, y + hullH * 0.85, 2.2 + Math.sin(t * 0.2 + x) * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(190,225,255,0.5)';
        ctx.fill();

        // Polyurea barrier dome
        if (this.shield > 0) {
          const a = Math.min(1, this.shield / 25) * (0.8 + Math.sin(t * 0.25) * 0.15);
          const rx = L * 0.64, ry = L * 0.32;
          const cy = y + hullH * 0.6;
          // Faint gold fill inside the dome
          const fg = ctx.createRadialGradient(this.cx, cy, 0, this.cx, cy, rx);
          fg.addColorStop(0, `rgba(${GOLD},${a * 0.10})`);
          fg.addColorStop(1, `rgba(${GOLD},0)`);
          ctx.beginPath();
          ctx.ellipse(this.cx, cy, rx, ry, 0, Math.PI, 0);
          ctx.closePath();
          ctx.fillStyle = fg;
          ctx.fill();
          // Dome edge
          const g = ctx.createLinearGradient(this.cx, cy - ry, this.cx, cy);
          g.addColorStop(0, `rgba(${GOLD},${a})`);
          g.addColorStop(1, `rgba(${GOLD},${a * 0.35})`);
          ctx.beginPath();
          ctx.ellipse(this.cx, cy, rx, ry, 0, Math.PI, 0);
          ctx.strokeStyle = g;
          ctx.lineWidth = 2.6;
          ctx.shadowColor = `rgba(${GOLD},0.9)`;
          ctx.shadowBlur = 20;
          ctx.stroke();
          ctx.shadowBlur = 0;
          // Inner lattice arcs
          ctx.globalAlpha = a * 0.5;
          for (let k = 1; k <= 3; k++) {
            ctx.beginPath();
            ctx.ellipse(this.cx, cy, rx * (1 - k * 0.11), ry * (1 - k * 0.11), 0, Math.PI, 0);
            ctx.strokeStyle = `rgba(${GOLD},0.55)`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
          // Vertical ribs
          for (let k = -2; k <= 2; k++) {
            ctx.beginPath();
            ctx.moveTo(this.cx + k * rx * 0.3, cy);
            ctx.quadraticCurveTo(this.cx + k * rx * 0.33, cy - ry * 0.8, this.cx + k * rx * 0.18, cy - ry * (k === 0 ? 1 : 0.9));
            ctx.strokeStyle = `rgba(${GOLD},0.35)`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }

        // Impact ripple rings
        if (this.ripple > 0) {
          const p = this.ripple / 70;
          ctx.beginPath();
          ctx.ellipse(this.cx, y + hullH * 0.6, L * 0.64 * (1 + p * 0.5), L * 0.32 * (1 + p * 0.5), 0, Math.PI, 0);
          ctx.strokeStyle = `rgba(${GOLD},${0.6 * (1 - p)})`;
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }

        // PROTECTED label
        if (this.flash > 0) {
          const a = Math.min(1, this.flash / 40);
          const fs = Math.max(11, W * 0.0095);
          ctx.fillStyle = `rgba(${GOLD},${a})`;
          ctx.font = `700 ${fs}px 'Courier New',monospace`;
          ctx.textAlign = 'center';
          ctx.shadowColor = `rgba(${GOLD},0.7)`;
          ctx.shadowBlur = 10;
          ctx.fillText('PROTECTED — POLYUREA BARRIER', this.cx, y - L * 0.34);
          ctx.shadowBlur = 0;
        }
      },
      drawBody(x, y, L, hullH, isReflection) {
        // Hull — tanker profile, bow to the right
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + L * 0.94, y);
        ctx.lineTo(x + L, y + hullH * 0.45);
        ctx.lineTo(x + L * 0.97, y + hullH);
        ctx.lineTo(x + L * 0.03, y + hullH);
        ctx.lineTo(x, y + hullH * 0.55);
        ctx.closePath();
        const hullGrad = ctx.createLinearGradient(0, y, 0, y + hullH);
        hullGrad.addColorStop(0, '#152c47');
        hullGrad.addColorStop(0.55, '#0d1d33');
        hullGrad.addColorStop(1, '#081524');
        ctx.fillStyle = hullGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(140,180,225,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Waterline band
        ctx.fillStyle = 'rgba(180,60,50,0.55)';
        ctx.fillRect(x + L * 0.02, y + hullH * 0.86, L * 0.95, hullH * 0.12);

        // Hull plating seams
        ctx.strokeStyle = 'rgba(120,160,200,0.14)';
        ctx.lineWidth = 0.6;
        for (let k = 1; k < 5; k++) {
          const px = x + L * (k / 5);
          ctx.beginPath();
          ctx.moveTo(px, y + hullH * 0.1);
          ctx.lineTo(px, y + hullH * 0.85);
          ctx.stroke();
        }

        // Main deck line + raised pipeline trunk
        ctx.strokeStyle = 'rgba(110,150,195,0.55)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(x + L * 0.13, y - hullH * 0.20);
        ctx.lineTo(x + L * 0.80, y - hullH * 0.20);
        ctx.stroke();
        // Pipe verticals + manifold risers
        for (let k = 0; k < 7; k++) {
          const px = x + L * (0.15 + k * 0.1);
          ctx.beginPath();
          ctx.moveTo(px, y);
          ctx.lineTo(px, y - hullH * 0.38);
          ctx.stroke();
        }
        // Tank domes on deck
        ctx.fillStyle = '#132741';
        for (let k = 0; k < 4; k++) {
          const dx = x + L * (0.20 + k * 0.16);
          ctx.beginPath();
          ctx.ellipse(dx, y - hullH * 0.05, L * 0.028, hullH * 0.22, 0, Math.PI, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(140,180,225,0.35)';
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
        // Deck crane midship
        ctx.strokeStyle = 'rgba(150,190,230,0.55)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x + L * 0.46, y);
        ctx.lineTo(x + L * 0.46, y - hullH * 0.95);
        ctx.lineTo(x + L * 0.56, y - hullH * 0.45);
        ctx.stroke();

        // Superstructure at stern (left) — accommodation block
        const sw = L * 0.125, sh = hullH * 1.75, sx = x + L * 0.04;
        const ssGrad = ctx.createLinearGradient(0, y - sh, 0, y);
        ssGrad.addColorStop(0, '#1b3453');
        ssGrad.addColorStop(1, '#10233c');
        ctx.fillStyle = ssGrad;
        ctx.fillRect(sx, y - sh, sw, sh);
        ctx.strokeStyle = 'rgba(140,180,225,0.4)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(sx, y - sh, sw, sh);
        // Bridge wing on top
        ctx.fillStyle = '#152c47';
        ctx.fillRect(sx - sw * 0.12, y - sh - hullH * 0.34, sw * 1.24, hullH * 0.34);
        // Funnel
        ctx.fillStyle = '#0e2038';
        ctx.fillRect(sx + sw * 0.28, y - sh - hullH * 0.75, sw * 0.42, hullH * 0.45);
        ctx.fillStyle = `rgba(${GOLD},0.8)`;
        ctx.fillRect(sx + sw * 0.28, y - sh - hullH * 0.75, sw * 0.42, hullH * 0.10);
        // Radar mast + rotating bar
        ctx.strokeStyle = 'rgba(150,190,230,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx + sw * 0.5, y - sh - hullH * 0.34);
        ctx.lineTo(sx + sw * 0.5, y - sh - hullH * 1.15);
        ctx.stroke();
        if (!isReflection) {
          ctx.save();
          ctx.translate(sx + sw * 0.5, y - sh - hullH * 1.15);
          ctx.rotate(t * 0.05 + this.i);
          ctx.beginPath();
          ctx.moveTo(-L * 0.018, 0);
          ctx.lineTo(L * 0.018, 0);
          ctx.strokeStyle = 'rgba(120,200,255,0.8)';
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.restore();
        }
        // Lit windows — 3 rows
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 4; c++) {
            const seed = (r * 7 + c * 3 + this.i * 5) % 11;
            ctx.fillStyle = seed > 3 ? 'rgba(140,200,255,0.75)' : 'rgba(10,20,35,0.9)';
            ctx.fillRect(sx + sw * (0.14 + c * 0.2), y - sh + sh * (0.12 + r * 0.22), sw * 0.13, sh * 0.1);
          }
        }
        // Nav lights
        const blink = Math.sin(t * 0.09 + x * 0.05) > 0.2 ? 1 : 0.25;
        ctx.beginPath();
        ctx.arc(sx + sw * 0.5, y - sh - hullH * 1.2, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,80,80,${blink})`;
        ctx.shadowColor = 'rgba(255,80,80,0.8)';
        ctx.shadowBlur = isReflection ? 0 : 6;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(x + L * 0.985, y + hullH * 0.2, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(90,220,140,${blink})`;
        ctx.fill();
      },
    };
  }

  /* ══════════ DRONES ══════════ */
  function makeDrone() {
    const target = ships[Math.floor(Math.random() * ships.length)];
    return {
      target,
      x: Math.random() > 0.5 ? -50 : W + 50,
      y: H * (0.08 + Math.random() * 0.14),
      phase: 'approach',
      aimT: 0,
      missile: null,
      done: false,
      rot: Math.random() * Math.PI,
      update() {
        this.rot += 0.5;
        const tx = this.target.cx, hover = H * (0.15 + 0.06 * Math.abs(Math.sin(this.y)));
        if (this.phase === 'approach') {
          this.x += (tx - this.x) * 0.014;
          this.y += (hover - this.y) * 0.022;
          if (Math.abs(this.x - tx) < W * 0.05) { this.phase = 'aim'; this.aimT = 0; }
        } else if (this.phase === 'aim') {
          this.x += (tx - this.x) * 0.05;
          this.y += Math.sin(t * 0.1) * 0.3;
          this.aimT++;
          if (this.aimT === 60) this.fire();
          if (this.aimT > 60 && !this.missile) this.phase = 'leave';
        } else if (this.phase === 'leave') {
          this.x += this.x > W / 2 ? 2.6 : -2.6;
          this.y -= 1;
          if (this.x < -70 || this.x > W + 70) this.done = true;
        }
        this.updateMissile();
      },
      fire() { this.missile = { x: this.x, y: this.y + 10, trail: [] }; },
      updateMissile() {
        const m = this.missile;
        if (!m) return;
        const s = this.target;
        const ty = s.y + s.len * 0.02;
        const dx = s.cx - m.x, dy = ty - m.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < s.len * 0.36) {
          // Impact deflected by the polyurea barrier
          s.shield = 120;
          s.ripple = 1;
          s.flash = 140;
          flashes.push({ x: m.x, y: m.y, r: 0, max: s.len * 0.16 });
          for (let k = 0; k < 22; k++) {
            const ang = -Math.PI * (0.1 + Math.random() * 0.8);
            const sp = 1.4 + Math.random() * 3;
            sparks.push({
              x: m.x, y: m.y,
              vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
              life: 36 + Math.random() * 26,
              gold: Math.random() > 0.4,
            });
          }
          this.missile = null;
          return;
        }
        const sp = 2.9;
        m.x += dx / d * sp;
        m.y += dy / d * sp;
        m.trail.push({ x: m.x, y: m.y });
        if (m.trail.length > 18) m.trail.shift();
      },
      draw() {
        const sc = Math.max(12, W * 0.0125);
        // Targeting reticle on the ship while aiming
        if (this.phase === 'aim' && this.aimT < 60) {
          const s = this.target, a = 0.35 + 0.25 * Math.sin(t * 0.3);
          ctx.save();
          ctx.setLineDash([4, 6]);
          ctx.beginPath();
          ctx.moveTo(this.x, this.y + sc * 0.4);
          ctx.lineTo(s.cx, s.y);
          ctx.strokeStyle = `rgba(255,70,70,${a * 0.5})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
          // Reticle corners around ship
          const bw = s.len * 0.7, bh = s.len * 0.3, bx = s.cx - bw / 2, by = s.y - bh * 0.75, cl = bw * 0.1;
          ctx.strokeStyle = `rgba(255,70,70,${a})`;
          ctx.lineWidth = 1.3;
          [[bx, by, cl, cl], [bx + bw, by, -cl, cl], [bx, by + bh, cl, -cl], [bx + bw, by + bh, -cl, -cl]].forEach(([ox, oy, hd, vd]) => {
            ctx.beginPath();
            ctx.moveTo(ox + hd, oy);
            ctx.lineTo(ox, oy);
            ctx.lineTo(ox, oy + vd);
            ctx.stroke();
          });
          const fs = Math.max(8, W * 0.007);
          ctx.fillStyle = `rgba(255,70,70,${a})`;
          ctx.font = `700 ${fs}px 'Courier New',monospace`;
          ctx.textAlign = 'left';
          ctx.fillText('TARGET LOCK', bx, by - 5);
          ctx.restore();
        }
        // Missile
        const m = this.missile;
        if (m) {
          for (let k = 1; k < m.trail.length; k++) {
            const p0 = m.trail[k - 1], p1 = m.trail[k], f = k / m.trail.length;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.strokeStyle = `rgba(255,150,60,${f * 0.8})`;
            ctx.lineWidth = 2 * f;
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(m.x, m.y, 2.6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,200,110,1)';
          ctx.shadowColor = 'rgba(255,160,60,0.9)';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        // Drone body — hostile quad with spinning rotors
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.strokeStyle = 'rgba(255,100,100,0.95)';
        ctx.fillStyle = '#212d3b';
        ctx.lineWidth = 1.4;
        [[-1, -0.6], [1, -0.6], [1, 0.6], [-1, 0.6]].forEach(([ax, ay], idx) => {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(ax * sc, ay * sc);
          ctx.stroke();
          // Rotor: spinning blur ellipse
          const spin = Math.abs(Math.sin(this.rot + idx * 1.3));
          ctx.beginPath();
          ctx.ellipse(ax * sc, ay * sc, sc * (0.30 + spin * 0.14), sc * 0.08, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,140,140,${0.35 + spin * 0.35})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(ax * sc, ay * sc, sc * 0.07, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,110,110,0.9)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,100,100,0.95)';
          ctx.fillStyle = '#212d3b';
          ctx.lineWidth = 1.4;
        });
        // Fuselage + camera gimbal
        ctx.fillRect(-sc * 0.38, -sc * 0.26, sc * 0.76, sc * 0.52);
        ctx.strokeRect(-sc * 0.38, -sc * 0.26, sc * 0.76, sc * 0.52);
        ctx.beginPath();
        ctx.arc(0, sc * 0.34, sc * 0.13, 0, Math.PI * 2);
        ctx.fillStyle = '#101c2b';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,140,140,0.6)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        // Payload under belly (visible until fired)
        if (!this.missile && this.phase !== 'leave' && !(this.aimT > 60)) {
          ctx.fillStyle = 'rgba(255,170,90,0.9)';
          ctx.fillRect(-sc * 0.08, sc * 0.5, sc * 0.16, sc * 0.3);
        }
        // Strobe
        const blink = Math.sin(t * 0.22 + this.y) > 0 ? 1 : 0.15;
        ctx.beginPath();
        ctx.arc(0, -sc * 0.05, sc * 0.11, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,60,60,${blink})`;
        ctx.shadowColor = 'rgba(255,60,60,0.9)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      },
    };
  }

  /* ══════════ ENVIRONMENT ══════════ */
  function buildStars() {
    stars.length = 0;
    const n = Math.floor((W * HOR) / 8500);
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * HOR * 0.92,
        r: Math.random() * 1.3 + 0.25, a: Math.random() * 0.5 + 0.15,
        p: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, HOR);
    g.addColorStop(0, '#030810');
    g.addColorStop(0.65, '#071729');
    g.addColorStop(1, '#0d2440');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, HOR);
    stars.forEach(s => {
      const tw = Math.sin(s.p + t * 0.008) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(205,220,248,${s.a * tw})`;
      ctx.fill();
    });
    // Moon with halo (upper right)
    const mx = W * 0.82, my = H * 0.13, mr = Math.min(W, H) * 0.028;
    const halo = ctx.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 5);
    halo.addColorStop(0, 'rgba(210,225,250,0.30)');
    halo.addColorStop(1, 'rgba(210,225,250,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(226,236,252,0.95)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx - mr * 0.32, my - mr * 0.18, mr * 0.86, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(190,205,232,0.35)';
    ctx.fill();
    // Horizon glow
    const hg = ctx.createLinearGradient(0, HOR - H * 0.1, 0, HOR);
    hg.addColorStop(0, 'rgba(26,92,176,0)');
    hg.addColorStop(1, 'rgba(26,92,176,0.16)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, HOR - H * 0.1, W, H * 0.1);
  }

  function drawSea() {
    const g = ctx.createLinearGradient(0, HOR, 0, H);
    g.addColorStop(0, '#0c2038');
    g.addColorStop(0.5, '#071627');
    g.addColorStop(1, '#040d19');
    ctx.fillStyle = g;
    ctx.fillRect(0, HOR, W, H - HOR);
    // Moonlight path shimmering on the water
    const mx = W * 0.82;
    for (let r = 0; r < 14; r++) {
      const wy = HOR + 4 + r * ((H - HOR) / 15);
      const spread = (r + 2) * W * 0.008;
      const shim = Math.sin(t * 0.06 + r * 2.1) * spread * 0.35;
      ctx.beginPath();
      ctx.moveTo(mx - spread + shim, wy);
      ctx.lineTo(mx + spread + shim, wy);
      ctx.strokeStyle = `rgba(200,218,245,${0.16 - r * 0.009})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    // Moving wave strokes
    ctx.lineWidth = 1;
    for (let r = 0; r < 12; r++) {
      const wy = HOR + 8 + r * ((H - HOR) / 12.5);
      const amp = 1.3 + r * 0.4, sp = t * (0.014 + r * 0.003);
      ctx.beginPath();
      for (let x = 0; x <= W; x += 24) {
        const yy = wy + Math.sin(x * 0.02 + sp + r * 1.7) * amp;
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.strokeStyle = `rgba(100,160,215,${0.06 + r * 0.010})`;
      ctx.stroke();
    }
  }

  function drawSparksAndFlashes() {
    // Impact flash rings
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      f.r += f.max * 0.09;
      const p = f.r / f.max;
      if (p >= 1) { flashes.splice(i, 1); continue; }
      const a = 1 - p;
      // Core flash
      const cg = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      cg.addColorStop(0, `rgba(255,240,200,${a * 0.55})`);
      cg.addColorStop(0.5, `rgba(255,170,70,${a * 0.3})`);
      cg.addColorStop(1, 'rgba(255,170,70,0)');
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = cg;
      ctx.fill();
      // Shockwave ring
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * 1.15, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,220,150,${a * 0.8})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // Sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx; s.y += s.vy; s.vy += 0.05; s.life--;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      const a = Math.min(1, s.life / 26);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = s.gold ? `rgba(${GOLD},${a})` : `rgba(255,180,90,${a})`;
      ctx.fill();
    }
  }

  function drawHUD() {
    const fs = Math.max(9, W * 0.0075);
    ctx.font = `${fs}px 'Courier New',monospace`;
    ctx.textAlign = 'left';
    ctx.fillStyle = `rgba(${GOLD},0.55)`;
    const pulse = Math.sin(t * 0.06) > 0 ? '●' : '○';
    ctx.fillText(`${pulse} POLYUREA BARRIER — ACTIVE`, 18, H - 16);
  }

  /* ══════════ LOOP ══════════ */
  let spawnTimer = 60;
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
    drawSparksAndFlashes();
    drawHUD();
    if (--spawnTimer <= 0 && drones.length < 2) {
      drones.push(makeDrone());
      spawnTimer = 200 + Math.random() * 160;
    }
    t++;
    requestAnimationFrame(frame);
  }

  function resize() {
    W = canvas.width = canvas.offsetWidth || 1200;
    H = canvas.height = canvas.offsetHeight || 560;
    HOR = H * 0.58;
    buildStars();
    ships.forEach(s => s.init());
  }

  for (let i = 0; i < 3; i++) ships.push(makeShip(i));

  // Start only once the canvas is actually visible and sized
  // (CSS hides it under 900px; the pane may report 0 width mid-load).
  let started = false;
  function maybeStart() {
    if (started) return;
    if (canvas.offsetWidth > 0 && window.innerWidth >= 900) {
      started = true;
      resize();
      window.addEventListener('resize', resize);
      requestAnimationFrame(frame);
    }
  }
  window.addEventListener('resize', maybeStart);
  maybeStart();
  if (!started) setTimeout(maybeStart, 400);
})();
