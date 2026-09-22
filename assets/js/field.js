(function (AB) {
'use strict';

/* ---------------------------------------------------------------------------
   field.js — the decision-boundary field.

   Not decorative particles. Every dot is a scored record drawn from one of two
   real Beta distributions (legitimate / fraudulent). The vertical rule is a
   classification threshold. Precision and recall shown beside it are computed
   from the points actually on screen, so moving the threshold moves the numbers
   the way it would in a real review queue.

   Zero dependencies. Deterministic: the same field renders on every load.
--------------------------------------------------------------------------- */

const TAU = Math.PI * 2;

/* deterministic PRNG (mulberry32) — the field must not reshuffle between loads */
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

/* Beta(a,b) sampling via two Marsaglia–Tsang gammas */
function sampler(rnd) {
  const gauss = () => {
    let u = 0, v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
  };
  const gamma = (k) => {
    if (k < 1) return gamma(k + 1) * Math.pow(rnd(), 1 / k);
    const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) {
      const x = gauss(), v = 1 + c * x;
      if (v <= 0) continue;
      const v3 = v * v * v, u = rnd();
      if (u < 1 - 0.0331 * x * x * x * x) return d * v3;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v3 + Math.log(v3))) return d * v3;
    }
  };
  return (a, b) => { const x = gamma(a); return x / (x + gamma(b)); };
}

const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function createField(canvas, options = {}) {
  const cfg = Object.assign({
    nNeg: 2200,
    nPos: 190,
    negA: 2.0, negB: 8.0,     /* legitimate  → scores pile up low  */
    posA: 6.5, posB: 1.7,     /* fraudulent  → scores pile up high */
    seed: 20260921,
    targetPrecision: 0.93,    /* the figure from the résumé        */
    padX: 0.045,
    padY: 0.10,
    onSettled: null,
    onChange: null,
  }, options);

  const rnd = prng(cfg.seed);
  const beta = sampler(rnd);

  /* ---- population ------------------------------------------------------- */
  const pts = [];
  for (let i = 0; i < cfg.nNeg; i++) {
    pts.push({ s: beta(cfg.negA, cfg.negB), v: rnd(), pos: 0, ph: rnd() * TAU, d: rnd() });
  }
  for (let i = 0; i < cfg.nPos; i++) {
    pts.push({ s: beta(cfg.posA, cfg.posB), v: rnd(), pos: 1, ph: rnd() * TAU, d: rnd() });
  }
  pts.sort((a, b) => a.s - b.s);

  function metrics(t) {
    let tp = 0, fp = 0, fn = 0, tn = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], flag = p.s >= t;
      if (p.pos) { if (flag) tp++; else fn++; }
      else { if (flag) fp++; else tn++; }
    }
    return {
      tp, fp, fn, tn,
      flagged: tp + fp,
      precision: tp + fp ? tp / (tp + fp) : 1,
      recall: tp + fn ? tp / (tp + fn) : 0,
    };
  }

  /* threshold whose precision sits closest to the résumé figure */
  let target = 0.57;
  {
    let err = Infinity;
    for (let t = 0.3; t <= 0.985; t += 0.0025) {
      const m = metrics(t);
      if (m.flagged < 12) continue;
      const e = Math.abs(m.precision - cfg.targetPrecision);
      if (e < err) { err = e; target = t; }
    }
  }

  /* ---- density curves (one per class, shared x bins) -------------------- */
  const BINS = 96;
  const dens = { neg: new Float32Array(BINS), pos: new Float32Array(BINS) };
  for (const p of pts) {
    const b = clamp((p.s * BINS) | 0, 0, BINS - 1);
    dens[p.pos ? 'pos' : 'neg'][b] += 1;
  }
  /* Gaussian smoothing. The positive class has ~10x fewer samples, so it needs
     a wider kernel or the curve reads as noise rather than a distribution. */
  const smooth = (arr, sigma) => {
    const out = new Float32Array(arr.length);
    const r = Math.ceil(sigma * 3);
    for (let i = 0; i < arr.length; i++) {
      let sum = 0, wsum = 0;
      for (let k = -r; k <= r; k++) {
        const j = i + k;
        if (j < 0 || j >= arr.length) continue;
        const w = Math.exp(-(k * k) / (2 * sigma * sigma));
        sum += arr[j] * w; wsum += w;
      }
      out[i] = sum / wsum;
    }
    return out;
  };
  dens.neg = smooth(dens.neg, 1.6);
  dens.pos = smooth(smooth(dens.pos, 4.2), 3.0);
  const maxNeg = Math.max(...dens.neg) || 1;
  const maxPos = Math.max(...dens.pos) || 1;

  /* ---- state ----------------------------------------------------------- */
  const ctx = canvas.getContext('2d', { alpha: true });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let W = 0, H = 0, dpr = 1;
  let thr = reduced.matches ? target : 0.985;
  let entry = reduced.matches ? 1 : 0;   /* 0→1 point arrival           */
  let intro = reduced.matches ? 1 : 0;   /* 0→1 threshold settle        */
  let running = false, visible = true, dragging = false, hasFocus = false;
  let dirty = true;
  let t0 = 0, last = 0;
  const palette = {};

  function readPalette() {
    const cs = getComputedStyle(canvas);
    palette.neg = cs.getPropertyValue('--f-neg').trim() || 'rgba(255,255,255,.22)';
    palette.pos = cs.getPropertyValue('--f-pos').trim() || 'rgba(255,255,255,.55)';
    palette.line = cs.getPropertyValue('--f-line').trim() || '#fff';
    palette.wash = cs.getPropertyValue('--f-wash').trim() || 'rgba(255,255,255,.04)';
    palette.miss = cs.getPropertyValue('--f-miss').trim() || palette.line;
    palette.grid = cs.getPropertyValue('--f-grid').trim() || 'rgba(255,255,255,.06)';
    palette.fp = cs.getPropertyValue('--f-fp').trim() || palette.line;
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.round(r.width); H = Math.round(r.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    readPalette();
    draw();
  }

  const X = (s) => (cfg.padX + s * (1 - cfg.padX * 2)) * W;

  /* the dot band sits above the density plot, never over it */
  function band() {
    const base = H * (1 - cfg.padY * 0.5);
    const amp = Math.min(H * 0.26, 132);
    const top = H * cfg.padY * 0.9;
    const bottom = base - amp - H * 0.03;
    return { top, bottom: Math.max(top + 24, bottom), base, amp };
  }
  const Y = (v) => { const b = band(); return b.top + v * (b.bottom - b.top); };

  function draw(now = 0) {
    if (!W || !H) return;
    dirty = false;
    ctx.clearRect(0, 0, W, H);

    const tx = X(thr);
    const introE = easeOutCubic(intro);

    /* flagged region wash */
    ctx.fillStyle = palette.wash;
    ctx.fillRect(tx, 0, W - tx, H);

    /* Score distribution, stroked not filled. A filled silhouette reads as
       landscape decoration; an outline on a baseline reads as a density plot,
       which is what it is. */
    const { base, amp } = band();

    ctx.save();
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    const curve = (arr, max, col, alpha) => {
      ctx.beginPath();
      for (let i = 0; i < BINS; i++) {
        const s = (i + 0.5) / BINS;
        const h = (arr[i] / max) * amp * introE;
        const x = X(s), y = base - h;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = col;
      ctx.globalAlpha = alpha * introE;
      ctx.stroke();
    };
    curve(dens.neg, maxNeg, palette.neg, 0.9);
    curve(dens.pos, maxPos, palette.pos, 0.9);

    /* baseline hairline */
    ctx.globalAlpha = introE;
    ctx.strokeStyle = palette.grid;
    ctx.beginPath();
    ctx.moveTo(X(0), base + 0.5);
    ctx.lineTo(X(1), base + 0.5);
    ctx.stroke();

    /* score ticks at 0 · .25 · .5 · .75 · 1 */
    for (const s of [0, 0.25, 0.5, 0.75, 1]) {
      const x = Math.round(X(s)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, base + 1);
      ctx.lineTo(x, base + (s === 0 || s === 1 ? 7 : 4.5));
      ctx.stroke();
    }
    ctx.restore();

    /* ---- points: two batched fill passes, then the misclassified rings -- */
    const sz = W < 640 ? 1.6 : 2;

    /* pass 1: true negatives — legitimate records left of the threshold */
    ctx.fillStyle = palette.neg;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (p.pos || p.s >= thr || p.s > entry) continue;
      ctx.fillRect(X(p.s), Y(p.v), sz, sz);
    }

    /* pass 2: false positives — legitimate records the threshold flagged.
       Drawn in the alert hue so precision degrading is something you SEE,
       not only something the readout reports. */
    ctx.fillStyle = palette.fp;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (p.pos || p.s < thr || p.s > entry) continue;
      ctx.fillRect(X(p.s) - 0.3, Y(p.v) - 0.3, sz + 0.9, sz + 0.9);
    }

    /* pass 3: ground truth = fraudulent */
    ctx.fillStyle = palette.pos;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (!p.pos) continue;
      if (p.s > entry) continue;
      ctx.fillRect(X(p.s) - 0.4, Y(p.v) - 0.4, sz + 1.2, sz + 1.2);
    }

    /* pass 4: false negatives — fraud the threshold let through.
       These are the whole reason the threshold is a judgement call. */
    ctx.strokeStyle = palette.miss;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.85 * introE;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (!p.pos || p.s >= thr || p.s > entry) continue;
      const x = X(p.s), y = Y(p.v);
      ctx.beginPath();
      ctx.arc(x + sz / 2, y + sz / 2, sz + 2.2, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* ---- threshold rule ------------------------------------------------- */
    const strong = dragging || hasFocus;
    ctx.save();
    ctx.strokeStyle = palette.line;
    ctx.globalAlpha = introE * (strong ? 1 : 0.82);
    ctx.lineWidth = strong ? 1.6 : 1.2;
    ctx.beginPath();
    ctx.moveTo(tx + 0.5, band().top - 10);
    ctx.lineTo(tx + 0.5, band().base + 8);
    ctx.stroke();

    /* grip: three short ticks, so it reads as draggable without a blob */
    const bb = band();
    const cy = (bb.top + bb.bottom) / 2;
    ctx.lineWidth = strong ? 1.6 : 1.2;
    for (const off of [-7, 0, 7]) {
      ctx.beginPath();
      ctx.moveTo(tx - 3.5, cy + off);
      ctx.lineTo(tx + 4.5, cy + off);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---- loop ------------------------------------------------------------- */
  function frame(now) {
    if (!running) return;
    if (!t0) t0 = now;
    const el = now - t0;

    if (entry < 1) entry = Math.min(1, easeOutCubic(el / 1000) * 1.06);
    if (intro < 1) {
      intro = Math.min(1, Math.max(0, (el - 260) / 900));
      if (!dragging) thr = 0.985 + (target - 0.985) * easeOutExpo(intro);
      emit();
    }

    /* Only repaint when something actually changed. A pointer can emit more
       moves than there are frames, and each of those already painted. */
    if (dirty || entry < 1 || intro < 1) draw(now);

    /* Idle is static on purpose. A statistical figure that shimmers at you is
       less confident than one that holds still and responds when touched —
       and it costs battery for nothing. */
    if (entry >= 1 && intro >= 1 && !dragging) {
      running = false;
      if (cfg.onSettled) { cfg.onSettled(); cfg.onSettled = null; }
      return;
    }
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || !visible) return;
    running = true; last = 0;
    requestAnimationFrame(frame);
  }

  function emit() {
    if (cfg.onChange) cfg.onChange(thr, metrics(thr));
  }

  /* ---- interaction ------------------------------------------------------ */
  function scoreAt(clientX) {
    const r = canvas.getBoundingClientRect();
    const f = (clientX - r.left) / r.width;
    return clamp((f - cfg.padX) / (1 - cfg.padX * 2), 0.02, 0.98);
  }

  function setThreshold(s, { silent = false } = {}) {
    thr = clamp(s, 0.02, 0.98);
    intro = 1; entry = 1;
    if (!silent) emit();
    /* Paint now rather than waiting for the next frame. An input should never
       depend on the rAF loop's state to become visible — and when the loop is
       running but frames are throttled (a background tab, a hidden window) the
       next frame may be a long way off. The frame loop skips any repaint this
       already covered. */
    dirty = true;
    draw(performance.now());
    if (!running) start();
  }

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    canvas.setPointerCapture?.(e.pointerId);
    setThreshold(scoreAt(e.clientX));
    e.preventDefault();
  };
  const onPointerMove = (e) => { if (dragging) setThreshold(scoreAt(e.clientX)); };
  const onPointerUp = (e) => {
    if (!dragging) return;
    dragging = false;
    canvas.releasePointerCapture?.(e.pointerId);
    draw(performance.now());
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const io = new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    if (visible) start();
    else running = false;
  }, { threshold: 0.02 });
  io.observe(canvas);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) running = false;
    else if (visible) start();
  });

  reduced.addEventListener?.('change', () => { resize(); start(); });

  resize();
  start();

  return {
    metrics,
    total: pts.length,
    /* The canvas caches its colours, so a theme change has to tell it to look
       again — otherwise the dots stay drawn in the previous theme's ink. */
    refresh() { readPalette(); dirty = true; draw(performance.now()); },
    get threshold() { return thr; },
    setThreshold,
    target,
    focus(on) { hasFocus = on; dirty = true; draw(performance.now()); },
    reset() { setThreshold(target); },
    destroy() {
      running = false;
      ro.disconnect(); io.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    },
  };
}

AB.createField = createField;
})(window.AB = (window.AB || {}));
