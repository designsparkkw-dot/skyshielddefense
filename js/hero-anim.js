/* ============================================================
   SKY SHIELD DEFENCE — Cinematic Hero Background
   Multi-drone swarm intercept sequence
   ============================================================ */

(function cinematic() {
  'use strict';

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, t = 0;

  const radar = { x: 0, y: 0, rot: 0 };

  /* ── Enemy drone factory ── */
  function makeEnemy(startX, startY, speed, delay) {
    return {
      x: startX, y: startY,
      baseY: startY,
      speed: speed,
      delay: delay,
      alive: true,
      opacity: 1,
      state: 'waiting',      // waiting | flying | detected | locked | dead
      lockTimer: 0,
      lockDuration: 55,
      assignedInterceptor: null,
    };
  }

  /* ── Interceptor factory ── */
  function makeInterceptor(target) {
    return {
      x: 0, y: 0,
      baseX: 0, baseY: 0,
      tx: 0, ty: 0,
      target: target,
      state: 'rising',       // rising | pursuing | impact | returning | done
      blastR: 0,
      impactX: 0, impactY: 0,
      trail: [],
    };
  }

  let enemies = [];
  let interceptors = [];
  const stars = [], particles = [];
  let secLights = [];

  /* ── Resize & init ── */
  function resize() {
    W = canvas.width  = canvas.offsetWidth  || window.innerWidth;
    H = canvas.height = canvas.offsetHeight || window.innerHeight;
    radar.x = W * 0.61;
    radar.y = H * 0.555;
    buildStars(); buildLights(); buildParticles();
    spawnWave();
  }

  function spawnWave() {
    enemies = [
      makeEnemy(-80,   H * 0.22, 1.6,   0),
      makeEnemy(-380,  H * 0.29, 1.8,  0),
      makeEnemy(-700,  H * 0.24, 1.5,  0),
    ];
    interceptors = [];
    resetInterceptorBases();
  }

  function resetInterceptorBases() {
    const bx = W * 0.62, by = H * 0.68;
    enemies.forEach((e, i) => {
      e._baseX = bx + (i - 1) * W * 0.03;
      e._baseY = by;
    });
  }

  function buildStars() {
    stars.length = 0;
    const n = Math.floor((W * H) / 9000);
    for (let i = 0; i < n; i++) {
      stars.push({ x: Math.random()*W, y: Math.random()*H*0.55,
        r: Math.random()*1.1+0.15, a: Math.random()*0.45+0.08,
        p: Math.random()*Math.PI*2 });
    }
  }

  function buildLights() {
    secLights = [];
    const pts = [
      [0.08,0.47,'#5ab8ff',2.5],[0.11,0.59,'#fff',2],
      [0.16,0.50,'#5ab8ff',2],[0.21,0.62,'#fff',1.5],
      [0.29,0.56,'#5ab8ff',2],[0.33,0.62,'#5ab8ff',1.5],
      [0.39,0.58,'#fff',2],[0.44,0.65,'#5ab8ff',1.5],
      [0.72,0.57,'#5ab8ff',2],[0.78,0.61,'#fff',2],
      [0.84,0.59,'#5ab8ff',1.5],[0.90,0.66,'#fff',2],
      [0.10,0.39,'#ff3333',2.5],[0.25,0.41,'#ff3333',2],
      [0.82,0.40,'#ff3333',2],[0.95,0.55,'#fff',1.5],
    ];
    pts.forEach(([rx,ry,col,sz]) => {
      secLights.push({ rx,ry,col,sz, phase:Math.random()*Math.PI*2, spd:0.015+Math.random()*0.02 });
    });
  }

  function buildParticles() {
    particles.length = 0;
    for (let i = 0; i < Math.floor(W/9); i++) {
      particles.push({ x:Math.random()*W, y:H*0.3+Math.random()*H*0.45,
        vx:(Math.random()-0.5)*0.14, vy:-Math.random()*0.07,
        a:Math.random()*0.035+0.008, r:Math.random()*1.2+0.3 });
    }
  }

  /* ══════════ DRAW ══════════ */

  function drawSky() {
    const g = ctx.createLinearGradient(0,0,0,H*0.70);
    g.addColorStop(0,'#000308'); g.addColorStop(0.3,'#00060f');
    g.addColorStop(0.6,'#020c1a'); g.addColorStop(0.85,'#071526'); g.addColorStop(1,'#0c1e36');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H*0.70);
    const hg=ctx.createLinearGradient(0,H*0.58,0,H*0.70);
    hg.addColorStop(0,'rgba(26,92,176,0)'); hg.addColorStop(1,'rgba(26,92,176,0.09)');
    ctx.fillStyle=hg; ctx.fillRect(0,H*0.58,W,H*0.12);
    const rg=ctx.createRadialGradient(radar.x,H*0.55,0,radar.x,H*0.55,W*0.28);
    rg.addColorStop(0,'rgba(26,92,176,0.07)'); rg.addColorStop(1,'rgba(26,92,176,0)');
    ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
  }

  function drawStars() {
    stars.forEach(s=>{
      const tw=Math.sin(s.p+t*0.007)*0.3+0.7;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(200,215,245,${s.a*tw})`; ctx.fill();
    });
  }

  function drawParticles() {
    particles.forEach(p=>{
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(100,150,200,${p.a})`; ctx.fill();
      p.x+=p.vx; p.y+=p.vy;
      if(p.y<H*0.28){p.y=H*0.75;p.x=Math.random()*W;}
      if(p.x<0)p.x=W; if(p.x>W)p.x=0;
    });
  }

  function drawGround() {
    const g=ctx.createLinearGradient(0,H*0.69,0,H);
    g.addColorStop(0,'#04101e'); g.addColorStop(0.5,'#030c18'); g.addColorStop(1,'#020810');
    ctx.fillStyle=g; ctx.fillRect(0,H*0.69,W,H*0.31);
    ctx.save(); ctx.globalAlpha=0.06; ctx.strokeStyle='#1a5cb0'; ctx.lineWidth=0.6;
    const vx=W*0.5,vy=H*0.695;
    for(let i=0;i<7;i++){const py=H*0.72+i*H*0.045;ctx.beginPath();ctx.moveTo(0,py);ctx.lineTo(W,py);ctx.stroke();}
    for(let i=0;i<=10;i++){const px=(W/10)*i;ctx.beginPath();ctx.moveTo(vx,vy);ctx.lineTo(px,H);ctx.stroke();}
    ctx.restore();
  }

  function fr(col,x,y,w,h){ctx.fillStyle=col;ctx.fillRect(x,y,w,h);}

  function drawInfrastructure() {
    fr('#050f1c',0,H*0.688,W,H*0.02);
    fr('#060f1a',W*0.07,H*0.37,W*0.013,H*0.325); fr('#091828',W*0.066,H*0.37,W*0.021,H*0.016);
    fr('#070f1b',W*0.14,H*0.42,W*0.011,H*0.275); fr('#091828',W*0.136,H*0.42,W*0.019,H*0.013);
    fr('#060e1a',0,H*0.615,W*0.19,H*0.016); fr('#060e1a',0,H*0.638,W*0.16,H*0.011);
    for(let i=0;i<6;i++){fr('#070f1c',W*(0.015+i*0.03),H*0.615,W*0.006,H*0.036);}
    fr('#081420',W*0.01,H*0.648,W*0.09,H*0.044);
    ctx.fillStyle='#09162a'; ctx.beginPath(); ctx.ellipse(W*0.055,H*0.648,W*0.045,H*0.01,0,0,Math.PI*2); ctx.fill();
    fr('#07111e',W*0.16,H*0.64,W*0.06,H*0.052); fr('#08131f',W*0.16,H*0.638,W*0.06,H*0.008);
    fr('#081525',W*0.24,H*0.515,W*0.16,H*0.178); fr('#0a1c30',W*0.24,H*0.508,W*0.16,H*0.011);
    fr('#0b1f33',W*0.26,H*0.492,W*0.035,H*0.020); fr('#0a1c30',W*0.355,H*0.498,W*0.028,H*0.014);
    fr('#091728',W*0.265,H*0.496,W*0.015,H*0.013); fr('#091728',W*0.285,H*0.496,W*0.015,H*0.013);
    ctx.strokeStyle='#0f2035'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(W*0.32,H*0.50); ctx.lineTo(W*0.32,H*0.46); ctx.stroke();
    for(let r=0;r<3;r++){for(let c=0;c<7;c++){
      const wx=W*(0.255+c*0.020),wy=H*(0.530+r*0.042),seed=(r*17+c*7)%13;
      ctx.fillStyle=seed>4?`rgba(74,159,212,${0.08+(seed%5)*0.03})`:'rgba(6,14,24,0.9)';
      ctx.fillRect(wx,wy,W*0.013,H*0.026);
    }}
    fr('#06101c',W*0.19,H*0.594,W*0.065,H*0.099); fr('#07121e',W*0.19,H*0.587,W*0.065,H*0.010);
    drawRadarTower();
    fr('#07111e',W*0.70,H*0.568,W*0.08,H*0.125); fr('#091528',W*0.70,H*0.560,W*0.08,H*0.011);
    for(let c=0;c<4;c++){ctx.fillStyle='rgba(74,159,212,0.06)';ctx.fillRect(W*(0.712+c*0.017),H*0.578,W*0.011,H*0.022);}
    ctx.strokeStyle='#0d1f30'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(W*0.765,H*0.695); ctx.lineTo(W*0.765,H*0.52); ctx.stroke();
    fr('#0d2035',W*0.758,H*0.517,W*0.025,H*0.012); fr('#0f2438',W*0.770,H*0.524,W*0.018,H*0.008);
    ctx.strokeStyle='#0b1c2e'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(W*0.84,H*0.695); ctx.lineTo(W*0.84,H*0.355); ctx.stroke();
    ctx.lineWidth=0.6; ctx.strokeStyle='#091622';
    [[0.80,0.695],[0.88,0.695]].forEach(([tx,ty])=>{ctx.beginPath();ctx.moveTo(W*0.84,H*0.36);ctx.lineTo(W*tx,H*ty);ctx.stroke();});
    ctx.lineWidth=1; ctx.strokeStyle='#0b1c2e';
    for(let i=0;i<8;i++){const ty=0.37+i*0.04,sp=W*0.014*(1-i*0.06);ctx.beginPath();ctx.moveTo(W*0.84-sp,H*ty);ctx.lineTo(W*0.84+sp,H*ty);ctx.stroke();}
    ctx.beginPath(); ctx.moveTo(W*0.84,H*0.355); ctx.lineTo(W*0.833,H*0.31); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W*0.84,H*0.380); ctx.lineTo(W*0.850,H*0.345); ctx.stroke();
    fr('#071220',W*0.87,H*0.570,W*0.13,H*0.123); fr('#09162a',W*0.87,H*0.562,W*0.13,H*0.011);
    for(let c=0;c<5;c++){ctx.fillStyle='rgba(74,159,212,0.05)';ctx.fillRect(W*(0.88+c*0.018),H*0.580,W*0.012,H*0.022);}
    ctx.strokeStyle='rgba(12,28,44,0.7)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,H*0.698); ctx.lineTo(W,H*0.698); ctx.stroke();
    for(let i=0;i<W;i+=W*0.035){ctx.beginPath();ctx.moveTo(i,H*0.693);ctx.lineTo(i,H*0.704);ctx.stroke();}
  }

  function drawRadarTower() {
    const rx=radar.x,ry=radar.y,tw=W*0.028;
    ctx.strokeStyle='#0e2038'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(rx-tw,H*0.695); ctx.lineTo(rx,ry); ctx.lineTo(rx+tw,H*0.695); ctx.stroke();
    ctx.lineWidth=1;
    for(let i=0;i<6;i++){const frac=i/6,py=ry+(H*0.695-ry)*frac,pw=tw*(frac*0.8+0.2);ctx.beginPath();ctx.moveTo(rx-pw,py);ctx.lineTo(rx+pw,py);ctx.stroke();}
    fr('#0e2238',rx-W*0.022,ry-H*0.008,W*0.044,H*0.010);
    ctx.strokeStyle='#102540'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(rx,ry-H*0.008); ctx.lineTo(rx,ry-H*0.030); ctx.stroke();
    ctx.save(); ctx.translate(rx,ry-H*0.030); ctx.rotate(radar.rot);
    ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,W*0.042,-Math.PI*0.15,Math.PI+Math.PI*0.15,false); ctx.closePath();
    ctx.fillStyle='#0e2238'; ctx.fill(); ctx.strokeStyle='#1a3a58'; ctx.lineWidth=1.2; ctx.stroke();
    ctx.strokeStyle='rgba(20,50,80,0.7)'; ctx.lineWidth=0.7;
    for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(0,0);const ang=Math.PI*0.5+i*0.35;ctx.lineTo(Math.cos(ang)*W*0.042,Math.sin(ang)*W*0.042);ctx.stroke();}
    fr('#1a3a5a',-W*0.004,-H*0.014,W*0.008,H*0.016); ctx.restore();
    const sa=radar.rot*-1+t*0.014,bl=Math.min(W*0.42,H*0.58),sx=rx,sy=ry-H*0.030;
    const bg=ctx.createRadialGradient(sx,sy,0,sx,sy,bl);
    bg.addColorStop(0,'rgba(50,150,255,0.40)'); bg.addColorStop(0.6,'rgba(50,150,255,0.14)'); bg.addColorStop(1,'rgba(50,150,255,0)');
    ctx.save(); ctx.beginPath(); ctx.moveTo(sx,sy); ctx.arc(sx,sy,bl,sa-0.22,sa,false); ctx.closePath();
    ctx.fillStyle=bg; ctx.globalAlpha=0.95; ctx.fill(); ctx.globalAlpha=1; ctx.restore();
    ctx.shadowColor='rgba(60,170,255,0.7)'; ctx.shadowBlur=8;
    ctx.strokeStyle='rgba(80,190,255,0.75)'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx+Math.cos(sa)*bl,sy+Math.sin(sa)*bl); ctx.stroke();
    ctx.shadowBlur=0;
    [0.3,0.6,1.0].forEach(f=>{ctx.beginPath();ctx.arc(sx,sy,bl*f,0,Math.PI*2);ctx.strokeStyle=`rgba(60,150,255,${0.10+f*0.07})`;ctx.lineWidth=0.8;ctx.stroke();});
  }

  function drawSecLights() {
    secLights.forEach(sl=>{
      const pulse=Math.sin(sl.phase+t*sl.spd)*0.25+0.75,x=sl.rx*W,y=sl.ry*H,alpha=0.45+pulse*0.4;
      const grad=ctx.createRadialGradient(x,y,0,x,y,sl.sz*10);
      const base=sl.col==='#5ab8ff'?'90,184,255':sl.col==='#ff3333'?'255,60,60':'255,255,255';
      grad.addColorStop(0,`rgba(${base},${alpha*0.5})`); grad.addColorStop(1,`rgba(${base},0)`);
      ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(x,y,sl.sz*10,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x,y,sl.sz*pulse,0,Math.PI*2);
      ctx.fillStyle=sl.col; ctx.globalAlpha=alpha; ctx.fill(); ctx.globalAlpha=1;
    });
  }

  /* ── Draw single enemy drone ── */
  function drawEnemy(e) {
    if (e.state === 'waiting' || e.state === 'dead') return;
    const dx=e.x, dy=e.baseY+Math.sin(t*0.022+e.baseY)*9;
    if (dx < -80 || dx > W+100) return;

    const sc = Math.max(22, Math.min(W,H)*0.044);
    const isLocked = e.state==='locked';
    ctx.save(); ctx.translate(dx,dy); ctx.globalAlpha=e.opacity;

    ctx.shadowColor = isLocked ? 'rgba(255,70,70,0.8)' : 'rgba(120,180,255,0.55)';
    ctx.shadowBlur = sc*0.9;

    ctx.strokeStyle = isLocked ? 'rgba(255,90,90,1)' : 'rgba(140,190,255,0.95)';
    ctx.lineWidth = Math.max(1.6, sc*0.08);
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([ax,ay])=>{
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(ax*sc,ay*sc); ctx.stroke();
      ctx.beginPath(); ctx.arc(ax*sc,ay*sc,sc*0.21,0,Math.PI*2); ctx.fillStyle=isLocked?'rgba(255,90,90,0.9)':'rgba(120,175,235,0.9)'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(ax*sc,ay*sc,sc*0.36,sc*0.07,0,0,Math.PI*2);
      ctx.strokeStyle='rgba(120,180,255,0.6)'; ctx.lineWidth=sc*0.06; ctx.stroke();
    });
    ctx.shadowBlur = 0;
    ctx.fillStyle='#16283c'; ctx.fillRect(-sc*0.36,-sc*0.28,sc*0.72,sc*0.56);
    ctx.strokeStyle='rgba(140,190,255,0.5)'; ctx.lineWidth=1; ctx.strokeRect(-sc*0.36,-sc*0.28,sc*0.72,sc*0.56);
    ctx.fillStyle='#0d1c2e'; ctx.beginPath(); ctx.arc(0,sc*0.16,sc*0.17,0,Math.PI*2); ctx.fill();
    const blink=Math.sin(t*0.14+e.baseY)>0?1:0.15;
    ctx.shadowColor='rgba(255,60,60,0.9)'; ctx.shadowBlur=sc*0.7;
    ctx.beginPath(); ctx.arc(0,0,sc*0.12,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,70,70,${blink})`; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    drawEnemyTracker(e, dx, dy, sc);
  }

  function drawEnemyTracker(e, dx, dy, sc) {
    if (e.state==='flying'||e.state==='waiting'||e.state==='dead') return;
    const isLocked = e.state==='locked';
    const bw=sc*5,bh=sc*3.8,bx=dx-bw*0.5,by=dy-bh*0.5,cl=Math.max(7,bw*0.15);
    const col = isLocked ? 'rgba(255,60,60,0.95)' : 'rgba(255,200,30,0.85)';
    ctx.strokeStyle=col; ctx.lineWidth=1.3;
    [[bx,by,cl,cl],[bx+bw,by,-cl,cl],[bx,by+bh,cl,-cl],[bx+bw,by+bh,-cl,-cl]].forEach(([ox,oy,hd,vd])=>{
      ctx.beginPath(); ctx.moveTo(ox+hd,oy); ctx.lineTo(ox,oy); ctx.lineTo(ox,oy+vd); ctx.stroke();
    });
    if(isLocked){
      const p=Math.abs(Math.sin(t*0.22));
      ctx.beginPath(); ctx.arc(dx,dy,bh*0.65+p*6,0,Math.PI*2);
      ctx.strokeStyle=`rgba(255,60,60,${0.5*p})`; ctx.lineWidth=1.2; ctx.stroke();
    }
    const fs=Math.max(8,W*0.007);
    ctx.fillStyle=col; ctx.font=`700 ${fs}px 'Courier New',monospace`; ctx.textAlign='left';
    ctx.fillText(isLocked?'LOCKED':'TRACK',bx,by-4);
  }

  /* ── Draw interceptor ── */
  function drawInterceptor(intr) {
    if (intr.state==='done' || intr.state==='impact') return;

    if (intr.trail.length>1){
      for(let i=1;i<intr.trail.length;i++){
        const p0=intr.trail[i-1],p1=intr.trail[i],alpha=(i/intr.trail.length)*0.85;
        ctx.beginPath(); ctx.moveTo(p0.x,p0.y); ctx.lineTo(p1.x,p1.y);
        ctx.strokeStyle=`rgba(90,190,255,${alpha})`; ctx.lineWidth=3*(i/intr.trail.length); ctx.stroke();
      }
    }

    const ix=intr.x, iy=intr.y;
    const sc=Math.max(12,Math.min(W,H)*0.025);
    const angle = intr.state==='returning'
      ? Math.atan2(intr.baseY-iy, intr.baseX-ix)
      : Math.atan2(intr.ty-iy,   intr.tx-ix);

    ctx.save(); ctx.translate(ix,iy); ctx.rotate(angle+Math.PI*0.5);
    ctx.shadowColor='rgba(60,170,255,0.7)'; ctx.shadowBlur=sc*0.8;
    ctx.fillStyle='#2a4f78';
    ctx.beginPath();
    ctx.moveTo(0,-sc*0.12); ctx.lineTo(-sc*1.1,sc*0.38); ctx.lineTo(-sc*0.75,sc*0.48);
    ctx.lineTo(0,sc*0.08); ctx.lineTo(sc*0.75,sc*0.48); ctx.lineTo(sc*1.1,sc*0.38); ctx.closePath();
    ctx.fill(); ctx.strokeStyle='rgba(80,190,255,0.9)'; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle='#1c3f63';
    ctx.beginPath(); ctx.ellipse(0,0,sc*0.20,sc*0.56,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#3a8fe0';
    ctx.beginPath(); ctx.ellipse(0,-sc*0.52,sc*0.09,sc*0.16,0,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='#1a3a5a';
    ctx.beginPath(); ctx.moveTo(0,sc*0.42); ctx.lineTo(-sc*0.45,sc*0.75); ctx.lineTo(0,sc*0.60); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0,sc*0.42); ctx.lineTo( sc*0.45,sc*0.75); ctx.lineTo(0,sc*0.60); ctx.closePath(); ctx.fill();
    const blink=Math.sin(t*0.22+ix)>0?1:0.15;
    ctx.beginPath(); ctx.arc(0,-sc*0.10,sc*0.09,0,Math.PI*2);
    ctx.fillStyle=`rgba(50,180,255,${blink})`; ctx.fill();
    const tg=ctx.createRadialGradient(0,sc*0.48,0,0,sc*0.48,sc*0.38);
    tg.addColorStop(0,'rgba(50,150,255,0.55)'); tg.addColorStop(1,'rgba(26,92,176,0)');
    ctx.fillStyle=tg; ctx.beginPath(); ctx.arc(0,sc*0.48,sc*0.38,0,Math.PI*2); ctx.fill();
    ctx.restore();

    const fs=Math.max(7,W*0.0065);
    ctx.fillStyle='rgba(50,180,255,0.80)';
    ctx.font=`700 ${fs}px 'Courier New',monospace`; ctx.textAlign='center';
    ctx.fillText('SSD-INT',ix,iy-sc*0.95);
  }

  /* ── Draw blast ── */
  function drawBlast(intr) {
    if (intr.state!=='impact') return;
    const bx=intr.impactX, by=intr.impactY;
    const maxR=Math.min(W,H)*0.09;
    const progress=intr.blastR/maxR;
    const alpha=Math.max(0,1-progress*1.1);

    [1.0,0.65,0.35].forEach((s,i)=>{
      const r=intr.blastR*s,a=alpha*(1-i*0.22);
      ctx.beginPath(); ctx.arc(bx,by,r,0,Math.PI*2);
      ctx.strokeStyle=i===0?`rgba(50,180,255,${a*0.5})`:i===1?`rgba(255,180,50,${a*0.7})`:`rgba(255,255,255,${a*0.9})`;
      ctx.lineWidth=i===2?2.5:1.5; ctx.stroke();
    });
    const fg=ctx.createRadialGradient(bx,by,0,bx,by,intr.blastR);
    fg.addColorStop(0,`rgba(200,230,255,${alpha*0.28})`); fg.addColorStop(1,`rgba(26,92,176,0)`);
    ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(bx,by,intr.blastR,0,Math.PI*2); ctx.fill();
    if(alpha>0.25){
      for(let i=0;i<5;i++){
        const ang=Math.random()*Math.PI*2,dist=intr.blastR*(0.4+Math.random()*0.6);
        ctx.beginPath(); ctx.arc(bx+Math.cos(ang)*dist,by+Math.sin(ang)*dist,Math.random()*2+0.5,0,Math.PI*2);
        ctx.fillStyle=Math.random()>0.5?`rgba(255,180,50,${alpha})`:`rgba(50,180,255,${alpha})`; ctx.fill();
      }
    }
    if(alpha>0.2){
      const fs=Math.max(10,W*0.010);
      ctx.fillStyle=`rgba(50,200,255,${alpha})`;
      ctx.font=`900 ${fs}px 'Montserrat','Segoe UI',sans-serif`;
      ctx.textAlign='center';
      ctx.fillText('ELIMINATED',bx,by-intr.blastR-10);
    }
  }

  /* ── HUD ── */
  function drawHUD() {
    const pad=Math.min(18,W*0.014),len=Math.min(26,W*0.02);
    ctx.strokeStyle='rgba(26,92,176,0.28)'; ctx.lineWidth=1;
    [[pad,pad,len,len],[W-pad,pad,-len,len],[pad,H-pad,len,-len],[W-pad,H-pad,-len,-len]].forEach(([ox,oy,hd,vd])=>{
      ctx.beginPath(); ctx.moveTo(ox+hd,oy); ctx.lineTo(ox,oy); ctx.lineTo(ox,oy+vd); ctx.stroke();
    });
    const alive=enemies.filter(e=>e.state!=='dead'&&e.state!=='waiting').length;
    const d=new Date(),hh=String(d.getUTCHours()).padStart(2,'0'),mm=String(d.getUTCMinutes()).padStart(2,'0'),ss=String(d.getUTCSeconds()).padStart(2,'0');
    const fs=Math.max(8,W*0.007);
    ctx.font=`${fs}px 'Courier New',monospace`; ctx.textAlign='left';
    ctx.fillStyle='rgba(26,92,176,0.42)';
    ctx.fillText('SYS OPERATIONAL',pad+4,H-pad-22);
    ctx.fillText(`UTC ${hh}:${mm}:${ss}Z`,pad+4,H-pad-10);
    ctx.textAlign='right'; ctx.fillStyle='rgba(26,92,176,0.32)';
    ctx.fillText(`HOSTILES TRACKED: ${alive} — INTERCEPTORS DEPLOYED`,W-pad-4,pad+14);
    const sy=(t*0.35)%H;
    const sg=ctx.createLinearGradient(0,sy-3,0,sy+3);
    sg.addColorStop(0,'rgba(26,92,176,0)'); sg.addColorStop(0.5,'rgba(26,92,176,0.04)'); sg.addColorStop(1,'rgba(26,92,176,0)');
    ctx.fillStyle=sg; ctx.fillRect(0,sy-3,W,6);
  }

  /* ══════════ UPDATE ══════════ */

  function updateEnemies() {
    enemies.forEach(e => {
      if (e.state==='dead') return;
      if (e.state==='waiting') { e.delay--; if(e.delay<=0){e.state='flying';} return; }
      const slow = e.state==='locked' ? 0.35 : 1.0;
      e.x += e.speed * slow;
      if (e.x > W+140) {
        e.x=-80-Math.random()*200; e.baseY=H*(0.20+Math.random()*0.14);
        e.state='flying'; e.assignedInterceptor=null;
      }
      if (e.state==='flying' && e.x > W*0.38) { e.state='detected'; e.lockTimer=0; }
      if (e.state==='detected') {
        e.lockTimer++;
        if (e.lockTimer >= e.lockDuration) {
          e.state='locked';
          if (!e.assignedInterceptor) {
            const idx=enemies.indexOf(e);
            const intr=makeInterceptor(e);
            intr.baseX=W*0.61+(idx-1)*W*0.035; intr.baseY=H*0.68;
            intr.x=intr.baseX; intr.y=intr.baseY;
            e.assignedInterceptor=intr; interceptors.push(intr);
          }
        }
      }
    });
  }

  function updateInterceptors() {
    const spd=Math.min(W,H)*0.005;
    interceptors.forEach(intr=>{
      if(intr.state==='done') return;
      const e=intr.target;
      if(intr.state!=='impact'){
        intr.trail.push({x:intr.x,y:intr.y});
        if(intr.trail.length>24) intr.trail.shift();
      }
      if(intr.state==='rising'){
        intr.y-=spd*2.2;
        if(intr.y<=e.baseY+15){intr.state='pursuing';}
      }
      if(intr.state==='pursuing'){
        const ex=e.x,ey=e.baseY+Math.sin(t*0.022+e.baseY)*9;
        intr.tx=ex; intr.ty=ey;
        const dx=ex-intr.x,dy=ey-intr.y,dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<Math.min(W,H)*0.035){
          intr.impactX=intr.x; intr.impactY=intr.y;
          intr.blastR=0; intr.state='impact'; intr.trail=[];
          e.state='dead'; e.opacity=0; e.alive=false;
        } else {
          intr.x+=dx/dist*spd*2.2; intr.y+=dy/dist*spd*2.2;
        }
      }
      if(intr.state==='impact'){
        intr.blastR+=Math.min(W,H)*0.006;
        if(intr.blastR>Math.min(W,H)*0.10*1.4){intr.state='returning';intr.trail=[];}
      }
      if(intr.state==='returning'){
        const dx=intr.baseX-intr.x,dy=intr.baseY-intr.y,dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<8){intr.state='done';}
        else{intr.x+=dx/dist*spd;intr.y+=dy/dist*spd;}
      }
    });
    interceptors=interceptors.filter(i=>i.state!=='done');
    const allDead=enemies.every(e=>e.state==='dead'||e.state==='waiting');
    if(allDead&&interceptors.length===0){
      setTimeout(()=>{spawnWave();resetInterceptorBases();},1800);
    }
  }

  function update() {
    t++;
    radar.rot+=0.008;
    secLights.forEach(sl=>{sl.phase+=sl.spd;});
    updateEnemies();
    updateInterceptors();
  }

  /* ══════════ FRAME ══════════ */
  function frame() {
    ctx.clearRect(0,0,W,H);
    drawSky(); drawStars(); drawParticles(); drawGround(); drawInfrastructure(); drawSecLights();
    interceptors.forEach(drawBlast);
    interceptors.forEach(drawInterceptor);
    enemies.forEach(drawEnemy);
    drawHUD();
    update();
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  frame();
})();
