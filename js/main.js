/* ============================================================
   SKY SHIELD DEFENSE — Main JS (Government/Defense Edition)
   ============================================================ */

/* ---------- Loading Screen ---------- */
(function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add('out');
    setTimeout(() => { loader.style.display = 'none'; }, 300);
  }, 500);
})();

/* ---------- Navbar scroll ---------- */
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 40);
});

/* ---------- Hamburger menu ---------- */
const ham = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
ham?.addEventListener('click', () => {
  ham.classList.toggle('open');
  mobileMenu?.classList.toggle('open');
  document.body.style.overflow = mobileMenu?.classList.contains('open') ? 'hidden' : '';
});
mobileMenu?.querySelectorAll('a').forEach(l => l.addEventListener('click', () => {
  ham?.classList.remove('open');
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
}));

/* ---------- Tactical Radar Canvas (Hero Right) ---------- */
(function initTactical() {
  const canvas = document.getElementById('tactical-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, cx, cy, R;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width  = rect.width  || 480;
    H = canvas.height = rect.height || 480;
    cx = W / 2; cy = H / 2;
    R = Math.min(W, H) * 0.38;
  }
  resize();
  window.addEventListener('resize', resize);

  let sweep = 0;
  const threats = [];
  const MAX_THREATS = 6;

  class Threat {
    constructor() { this.reset(); this.age = Math.random() * 200; }
    reset() {
      const angle = Math.random() * Math.PI * 2;
      const dist  = R * (0.25 + Math.random() * 0.65);
      this.x = cx + Math.cos(angle) * dist;
      this.y = cy + Math.sin(angle) * dist;
      this.age = 0;
      this.maxAge = 180 + Math.random() * 120;
      this.type = Math.random() > 0.6 ? 'drone' : 'vessel';
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.neutralised = false;
      this.neutralAge = 0;
      this.r = Math.random() * Math.PI * 2;
    }
    update() {
      this.age++;
      if (this.age > this.maxAge) {
        this.neutralised = true;
        this.neutralAge++;
        if (this.neutralAge > 40) this.reset();
        return;
      }
      this.x += this.vx; this.y += this.vy;
      // Keep inside circle
      const dx = this.x - cx, dy = this.y - cy;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d > R - 8) { this.vx *= -1; this.vy *= -1; }
    }
    draw() {
      const alpha = Math.min(1, this.age / 20);
      if (this.neutralised) {
        // Neutralised ring expanding
        const nr = this.neutralAge * 1.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, nr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,255,136,${Math.max(0, 1 - this.neutralAge / 40)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = `rgba(0,255,136,${Math.max(0, 0.3 - this.neutralAge / 120)})`;
        ctx.fill();
        return;
      }
      // Threat blip
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = this.type === 'drone' ? 'rgba(255,140,0,0.9)' : 'rgba(255,51,85,0.9)';
      ctx.fillStyle   = this.type === 'drone' ? 'rgba(255,140,0,0.15)' : 'rgba(255,51,85,0.12)';
      ctx.lineWidth = 1.5;
      // Diamond shape for drone
      ctx.beginPath();
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.r + this.age * 0.01);
      ctx.moveTo(0,-7); ctx.lineTo(7,0); ctx.lineTo(0,7); ctx.lineTo(-7,0); ctx.closePath();
      ctx.restore();
      ctx.fill(); ctx.stroke();
      // Pulse ring
      const pulse = (this.age % 60) / 60;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 4 + pulse * 16, 0, Math.PI * 2);
      ctx.strokeStyle = this.type === 'drone'
        ? `rgba(255,140,0,${0.5 * (1 - pulse)})`
        : `rgba(255,51,85,${0.5 * (1-pulse)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  // Seed threats
  for (let i = 0; i < MAX_THREATS; i++) {
    const t = new Threat();
    threats.push(t);
  }

  let interceptorFlash = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = 'rgba(0,5,14,0.95)';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,212,255,0.05)';
    ctx.lineWidth = 0.5;
    const step = 40;
    for (let x = step; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = step; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Radar rings
    [0.25, 0.5, 0.75, 1].forEach(f => {
      ctx.beginPath();
      ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,212,255,${0.08 + f * 0.04})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Crosshairs
    ctx.strokeStyle = 'rgba(0,212,255,0.1)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();

    // Sweep gradient
    const sweepRad = (sweep * Math.PI) / 180;
    const grad = ctx.createConicalGradient
      ? null
      : null;
    // Draw sweep as filled arc sector
    ctx.save();
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, 'rgba(0,212,255,0.15)');
    g.addColorStop(1, 'rgba(0,212,255,0)');
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, sweepRad - 1.2, sweepRad);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    // Sweep line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepRad) * R, cy + Math.sin(sweepRad) * R);
    ctx.strokeStyle = 'rgba(0,212,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Centre dot
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,212,255,0.8)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,212,255,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Threats
    threats.forEach(t => { t.update(); t.draw(); });

    // Interceptor lines (random tracking lines)
    if (Math.random() < 0.04) interceptorFlash = 8;
    if (interceptorFlash > 0) {
      interceptorFlash--;
      const active = threats.filter(t => !t.neutralised);
      if (active.length > 0) {
        const target = active[Math.floor(Math.random() * active.length)];
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = `rgba(0,255,136,${interceptorFlash / 8 * 0.6})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Range labels
    ctx.fillStyle = 'rgba(0,212,255,0.35)';
    ctx.font = '9px Courier New';
    ctx.textAlign = 'center';
    ['25km','50km','75km','100km'].forEach((lbl, i) => {
      ctx.fillText(lbl, cx + R * (i + 1) * 0.25 + 4, cy - 4);
    });

    sweep = (sweep + 1.2) % 360;
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ---------- Hero threat counter animation ---------- */
(function initHeroCounter() {
  let count = 1247;
  const el = document.getElementById('threat-count');
  if (!el) return;
  setInterval(() => {
    if (Math.random() < 0.3) { count++; el.textContent = count.toLocaleString(); }
  }, 2800);
})();

/* ---------- Scroll fade-up ---------- */
(function initFadeUp() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
})();

/* ---------- Counter animation ---------- */
(function initCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const start = performance.now();
      const dur = 2000;
      (function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(ease * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(start);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => obs.observe(el));
})();

/* ---------- Contact form ---------- */
(function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();

    // Block submission until all required fields — including the
    // Privacy Policy / Terms agreement checkbox — are completed.
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const btn = form.querySelector('.form-submit');
    const orig = btn.innerHTML;
    btn.innerHTML = '<span>TRANSMITTING...</span>';
    btn.disabled = true;

    const resetBtn = () => {
      setTimeout(() => { btn.innerHTML = orig; btn.style = ''; btn.disabled = false; }, 6000);
    };

    fetch('/api/contact', {
      method: 'POST',
      body: new FormData(form)
    })
      .then(res => res.json().catch(() => ({ success: false, message: 'Unexpected response from the server.' })))
      .then(data => {
        if (data.success) {
          btn.innerHTML = '<span>✓ ' + (data.message || 'REQUEST RECEIVED — WE WILL CONTACT YOU WITHIN 4 HOURS').toUpperCase() + '</span>';
          btn.style.background = 'rgba(0,255,136,0.15)';
          btn.style.borderColor = 'var(--green)';
          btn.style.color = 'var(--green)';
          form.reset();
        } else {
          btn.innerHTML = '<span>✕ ' + (data.message || 'SOMETHING WENT WRONG — PLEASE EMAIL US DIRECTLY').toUpperCase() + '</span>';
          btn.style.background = 'rgba(255,80,80,0.15)';
          btn.style.borderColor = '#ff5050';
          btn.style.color = '#ff5050';
        }
        resetBtn();
      })
      .catch(() => {
        btn.innerHTML = '<span>✕ COULD NOT SEND — PLEASE EMAIL US DIRECTLY AT INFO@SKYSHIELDDEFENSE.COM</span>';
        btn.style.background = 'rgba(255,80,80,0.15)';
        btn.style.borderColor = '#ff5050';
        btn.style.color = '#ff5050';
        resetBtn();
      });
  });
})();

/* ---------- Lead capture popup ---------- */
(function initLeadPopup() {
  const popup = document.getElementById('leadPopup');
  if (!popup) return;

  const DISMISS_KEY = 'leadPopupDismissed';
  if (sessionStorage.getItem(DISMISS_KEY)) return;

  const show = () => popup.classList.add('show');
  const hide = () => {
    popup.classList.remove('show');
    sessionStorage.setItem(DISMISS_KEY, '1');
  };

  setTimeout(show, 8000);

  popup.querySelector('.lead-popup-close')?.addEventListener('click', hide);

  const form = popup.querySelector('#leadForm');
  const status = popup.querySelector('.lead-popup-status');

  form?.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending...';
    status.textContent = '';
    status.className = 'lead-popup-status';

    fetch('/api/lead', { method: 'POST', body: new FormData(form) })
      .then(res => res.json().catch(() => ({ success: false, message: 'Unexpected response from the server.' })))
      .then(data => {
        status.textContent = data.message || (data.success ? 'Thank you!' : 'Something went wrong.');
        status.classList.add(data.success ? 'success' : 'error');
        if (data.success) {
          form.reset();
          setTimeout(hide, 2500);
        } else {
          btn.disabled = false;
          btn.textContent = orig;
        }
      })
      .catch(() => {
        status.textContent = 'Could not send — please try again.';
        status.classList.add('error');
        btn.disabled = false;
        btn.textContent = orig;
      });
  });
})();

/* ---------- AI chat widget ---------- */
(function initChatWidget() {
  const widget = document.getElementById('chatWidget');
  if (!widget) return;

  const toggle = document.getElementById('chatToggle');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const messagesEl = document.getElementById('chatMessages');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');

  const history = [];
  let open = false;

  function setOpen(v) {
    open = v;
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) input.focus();
  }

  toggle.addEventListener('click', () => setOpen(!open));
  closeBtn.addEventListener('click', () => setOpen(false));

  function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = 'chat-msg ' + (role === 'user' ? 'chat-msg-user' : 'chat-msg-bot');
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function addTyping() {
    const div = document.createElement('div');
    div.className = 'chat-msg chat-msg-bot chat-msg-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    addMessage('user', text);
    history.push({ role: 'user', content: text });
    input.value = '';
    input.disabled = true;

    const typingEl = addTyping();

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    })
      .then(res => res.json().catch(() => ({ error: 'Unexpected response from the server.' })))
      .then(data => {
        typingEl.remove();
        const reply = data.reply || data.error || 'Sorry, something went wrong.';
        addMessage('assistant', reply);
        if (data.reply) history.push({ role: 'assistant', content: data.reply });
      })
      .catch(() => {
        typingEl.remove();
        addMessage('assistant', 'Could not reach the assistant — please try again or use the contact form.');
      })
      .finally(() => {
        input.disabled = false;
        input.focus();
      });
  });
})();

/* ---------- Active nav link ---------- */
(function() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .mobile-menu a').forEach(l => {
    if (l.getAttribute('href') === path) l.classList.add('active');
  });
})();

/* ---------- Smooth scroll ---------- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});
