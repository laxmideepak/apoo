(function (AB) {
'use strict';

/* ---------------------------------------------------------------------------
   compute.js — the two ambient layers.

   createLatency — a response-time histogram along the floor of the contact
   band. Samples come from a log-normal distribution, which is the shape real
   latency actually has, and the dashed line is the true p95 of the bars on
   screen, recomputed as they scroll.

   There is deliberately no second layer behind the hero. The classifier there
   is the page's one memorable object, and a second field of grey marks above
   it competed with it rather than adding anything.

   It stops when off-screen, when the tab is hidden, and under
   prefers-reduced-motion, where it renders one finished frame instead.
--------------------------------------------------------------------------- */

function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* shared lifecycle: sizing, visibility, reduced motion */
function harness(canvas, onResize, onFrame, fps) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let running = false, visible = true, last = 0;

  const ctx = canvas.getContext('2d', { alpha: true });
  const state = { w: 0, h: 0, dpr: 1, ctx, reduced };

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.w = Math.round(r.width);
    state.h = Math.round(r.height);
    canvas.width = Math.round(state.w * state.dpr);
    canvas.height = Math.round(state.h * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    onResize(state);
  }

  function frame(now) {
    if (!running) return;
    if (!last) last = now;
    const dt = now - last;
    if (dt >= 1000 / fps) { last = now; onFrame(state, dt); }
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || !visible) return;
    if (reduced.matches) { onFrame(state, 1000); return; }
    running = true; last = 0;
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    visible ? start() : stop();
  }, { threshold: 0 });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
  });
  reduced.addEventListener('change', () => { stop(); resize(); start(); });

  return { state, resize, start, stop,
    destroy() { stop(); ro.disconnect(); io.disconnect(); } };
}

function readVars(canvas, names) {
  const cs = getComputedStyle(canvas);
  const out = {};
  for (const n of names) out[n] = cs.getPropertyValue('--' + n).trim();
  return out;
}

/* ============================================================== latency === */
function createLatency(canvas, options) {
  const cfg = Object.assign({ seed: 7731, fps: 20, bars: 72, pitch: 9 }, options || {});
  const rnd = prng(cfg.seed);

  /* Log-normal: the distribution response times genuinely follow — a dense
     body near the median with a long right tail. */
  const sample = () => {
    let u = 0, v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return Math.exp(3.05 + 0.42 * g);           /* ms */
  };

  const vals = Array.from({ length: cfg.bars }, sample);
  let pal = {};
  let acc = 0;

  const p95 = () => {
    const s = [...vals].sort((a, b) => a - b);
    return s[Math.floor(s.length * 0.95)];
  };

  const h = harness(canvas, (st) => {
    pal = readVars(canvas, ['c-idle', 'c-live']);
    pal.idle = pal['c-idle'] || 'rgba(255,255,255,.08)';
    pal.live = pal['c-live'] || 'rgba(255,255,255,.5)';
    draw(st);
  }, (st, dt) => {
    acc += dt;
    while (acc > 110) { acc -= 110; vals.push(sample()); vals.shift(); }
    draw(st);
  }, cfg.fps);

  function draw(st) {
    const { ctx, w } = { ctx: st.ctx, w: st.w };
    const H = st.h;
    ctx.clearRect(0, 0, w, H);

    const max = Math.max(...vals) * 1.08;
    const n = Math.min(vals.length, Math.ceil(w / cfg.pitch));
    const bw = cfg.pitch - 3;
    const cut = p95();

    for (let i = 0; i < n; i++) {
      const v = vals[vals.length - n + i];
      const bh = Math.max(2, (v / max) * H * 0.82);
      ctx.fillStyle = v >= cut ? pal.live : pal.idle;
      ctx.fillRect(i * cfg.pitch, H - bh, bw, bh);
    }

    /* the p95 line, computed from the bars on screen */
    const y = H - (cut / max) * H * 0.82;
    ctx.strokeStyle = pal.live;
    ctx.globalAlpha = 0.55;
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  h.resize(); h.start();
  return {
    refresh() {
      pal = readVars(canvas, ['c-idle', 'c-live']);
      pal.idle = pal['c-idle']; pal.live = pal['c-live'];
      h.resize();
    },
    destroy: h.destroy,
  };
}

AB.createLatency = createLatency;
})(window.AB = (window.AB || {}));
