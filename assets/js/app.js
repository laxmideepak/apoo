/* ---------------------------------------------------------------------------
   app.js — wiring. Everything interesting lives in the four files beside it.

   These are classic scripts sharing one `AB` namespace rather than ES modules,
   for one reason: a browser refuses to load a module over file://, so a module
   build only works when the page is served. This build also works when you
   double-click index.html, which is how most people will first open it.
--------------------------------------------------------------------------- */
(function (AB) {
'use strict';

const { createField } = AB;
const { createLatency } = AB;
const { STAGES, ECOSYSTEMS, TOTAL, countIn } = AB;
const { initReveals, runIntro } = AB;


/* modules that hold cached colour state and need telling when the theme moves */
const repaints = new Set();

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pct = (v) => `${(v * 100).toFixed(1)}%`;

/* ------------------------------------------------------- the field ------ */
function initField() {
  const canvas = $('.field__cv');
  const input = $('#thr-input');
  const live = $('#thr-live');
  const verdict = $('#verdict');
  const out = {};
  $$('#readout dd').forEach((d) => (out[d.dataset.role] = d));

  let announce;
  const say = (m) => {
    clearTimeout(announce);
    announce = setTimeout(() => {
      live.textContent =
        `Threshold ${m.t.toFixed(3)}. Precision ${pct(m.precision)}, ` +
        `recall ${pct(m.recall)}. ${m.flagged} records flagged, ${m.fn} missed.`;
    }, 450);
  };

  let field;
  field = createField(canvas, {
    onChange(t, m) {
      out.threshold.textContent = t.toFixed(3);
      out.precision.textContent = pct(m.precision);
      out.recall.textContent = pct(m.recall);
      out.flagged.textContent = m.flagged;
      out.missed.textContent = m.fn;
      /* The numbers alone are abstract. This sentence says what they cost. */
      verdict.textContent =
        `At this threshold ${m.flagged.toLocaleString('en-US')} of ` +
        `${field.total.toLocaleString('en-US')} records go to review, ` +
        `${m.fp} of them needlessly — and ${m.fn} fraudulent ones do not.`;
      if (document.activeElement !== input) input.value = t.toFixed(3);
      input.setAttribute('aria-valuetext',
        `${t.toFixed(3)} — precision ${pct(m.precision)}, recall ${pct(m.recall)}`);
      say({ t, ...m });
    },
  });

  repaints.add(() => field.refresh());
  input.value = field.target.toFixed(3);
  input.addEventListener('input', () => field.setThreshold(parseFloat(input.value)));
  input.addEventListener('focus', () => field.focus(true));
  input.addEventListener('blur', () => field.focus(false));
}

/* ------------------------------------------------- the compute ---------- */
function initCompute() {
  const foot = $('.compute--latency');
  if (foot && createLatency) {
    const b = createLatency(foot);
    repaints.add(() => b.refresh());
  }
  /* the same histogram heading the page, hanging from the top */
  const top = $('.compute--top');
  if (top && createLatency) {
    const t = createLatency(top, { invert: true, seed: 4402 });
    repaints.add(() => t.refresh());
  }
}

/* ------------------------------------------------------- the stack ------ */
function initStack() {
  const host = $('#stages');
  const bar = $('#filters');
  const live = $('#filter-live');

  host.innerHTML = STAGES.map(
    (s) => `
    <section class="stage" data-stage="${s.id}">
      <span class="stage__n">${s.n}</span>
      <h3 class="stage__h">${s.name}</h3>
      <p class="stage__note">${s.note}</p>
      <div class="tools">${s.items
        .map(([label, eco, cited]) =>
          `<span class="tool${cited ? ' tool--cited' : ''}" data-eco="${eco}">${label}</span>`)
        .join('')}</div>
    </section>`
  ).join('');

  bar.innerHTML = ECOSYSTEMS.map(
    (e) => `
    <button class="chip" type="button" data-eco="${e.id}"
            aria-pressed="${e.id === 'all'}">
      ${e.label} <span class="chip__n">${countIn(e.id)}</span>
    </button>`
  ).join('');

  const tools = $$('.tool', host);

  const apply = (eco) => {
    for (const t of tools) {
      const hit = eco === 'all' || t.dataset.eco === eco;
      t.classList.toggle('is-dim', !hit);
      t.classList.toggle('is-hit', hit && eco !== 'all');
    }
    $$('.chip', bar).forEach((c) =>
      c.setAttribute('aria-pressed', String(c.dataset.eco === eco))
    );
    const label = ECOSYSTEMS.find((e) => e.id === eco).label;
    live.textContent =
      eco === 'all'
        ? `Showing all ${TOTAL} tools.`
        : `${countIn(eco)} of ${TOTAL} tools are ${label}.`;
  };

  bar.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip) apply(chip.dataset.eco);
  });
}

/* --------------------------------------------------------- ticker ------- */
/* Built from the same data as the lifecycle below, so it can never drift out
   of sync with it. The strip is aria-hidden — it is the poster version of a
   list that is already on the page in readable form. The sequence is rendered
   twice so translating by -50% lands exactly on the seam. */
function initTicker() {
  const all = STAGES.flatMap((s) => s.items);
  const rows = [
    { el: $('#ticker-a .ticker__row'), items: all.filter(([, , c]) => c) },
    { el: $('#ticker-b .ticker__row'), items: all.filter(([, , c]) => !c) },
  ];

  for (const { el, items } of rows) {
    if (!el || !items.length) continue;
    const soft = items === rows[1].items ? ' ticker__i--soft' : '';
    const seq = items
      .map(([label]) => `<span class="ticker__i${soft}">${label}</span>`)
      .join('');
    el.innerHTML = seq + seq;
  }

  /* Duration is derived from the measured width so the strip always travels at
     a fixed reading speed. A hard-coded duration means the same strip crawls on
     a wide screen and races on a narrow one. */
  const SPEED = [52, 43]; // px per second, per row
  const pace = () => {
    rows.forEach(({ el }, i) => {
      if (!el) return;
      const travel = el.scrollWidth / 2;
      if (!travel) return;
      el.style.animationDuration = `${(travel / SPEED[i]).toFixed(1)}s`;
    });
  };
  pace();

  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(pace, 250);
  });
}

/* ---------------------------------------------------------- copy -------- */
function initCopy() {
  for (const btn of $$('[data-copy]')) {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
      } catch {
        /* clipboard blocked — the mailto link beside this still works */
        return;
      }
      btn.classList.add('is-said');
      setTimeout(() => btn.classList.remove('is-said'), 1600);
    });
  }
}

/* ---------------------------------------------------- header meta ------- */
/* Where the visitor is.

   The clock is the visitor's own clock — no network, no permission, exact.

   The city cannot come from the timezone: America/New_York covers Boston,
   Miami, Atlanta and Detroit alike, so deriving a city name from it labels the
   whole Eastern seaboard "New York". A real city needs an IP lookup, which is
   what ipwho.is does here — no key, no cookies. That request necessarily
   discloses the visitor's IP to that service; it is the only third party this
   site talks to besides the font CDN, and removing initMeta() removes it.

   If the lookup fails, the city and temperature stay hidden rather than
   guessing. The timezone abbreviation beside the clock still tells the reader
   roughly where they are, and it is never wrong. */

function initMeta() {
  const locEl = $('#meta-loc');
  const timeEl = $('#meta-time');
  const tempEl = $('#meta-temp');
  if (!timeEl) return;

  const tick = () => {
    try {
      timeEl.textContent = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short',
      }).format(new Date());
      return true;
    } catch {
      timeEl.remove();
      return false;
    }
  };
  if (tick()) setInterval(tick, 30000);

  if (typeof fetch !== 'function') { locEl && locEl.remove(); return; }

  const unit = /^en-US\b/i.test(navigator.language || '') ? 'fahrenheit' : 'celsius';
  const sym = unit === 'fahrenheit' ? '\u00b0F' : '\u00b0C';

  fetch('https://ipwho.is/?fields=success,city,region_code,country_code,latitude,longitude')
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((d) => {
      if (!d || d.success === false || !d.city) return Promise.reject('no city');
      const region = d.country_code === 'US' && d.region_code ? `, ${d.region_code}` : '';
      if (locEl) locEl.textContent = `${d.city}${region}`;
      if (typeof d.latitude !== 'number') return null;
      return fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${d.latitude}` +
        `&longitude=${d.longitude}&current=temperature_2m&temperature_unit=${unit}`
      );
    })
    .then((r) => (r && r.ok ? r.json() : null))
    .then((d) => {
      const t = d && d.current && d.current.temperature_2m;
      if (typeof t !== 'number' || !tempEl) return;
      tempEl.textContent = `${Math.round(t)}${sym}`;
      tempEl.hidden = false;
    })
    .catch(() => { if (locEl) locEl.remove(); });
}

/* --------------------------------------------------------- theme -------- */
function initTheme() {
  const repaint = () => repaints.forEach((fn) => fn());
  const btn = $('#theme');
  const label = $('#theme-label');
  const root = document.documentElement;

  const stored = (() => {
    try { return localStorage.getItem('theme'); } catch { return null; }
  })();
  if (stored === 'dark' || stored === 'light') root.dataset.theme = stored;

  const isDark = () =>
    root.dataset.theme === 'dark' ||
    (!root.dataset.theme &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const sync = () => {
    const dark = isDark();
    label.textContent = dark ? 'Light' : 'Dark';
    btn.setAttribute('aria-label',
      dark ? 'Switch to the light theme' : 'Switch to the dark theme');
  };

  btn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch { /* private mode */ }
    sync();
    repaint();
  });

  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (!root.dataset.theme) { sync(); repaint(); }
    });

  sync();
}

/* ----------------------------------------------------------- boot ------- */
function boot() {
  initField();
  initCompute();
  initStack();
  initTicker();
  initCopy();
  initMeta();
  initTheme();
  /* a stylesheet arriving late changes the computed palette too */
  window.addEventListener('load', () => repaints.forEach((fn) => fn()));
  initReveals();
  runIntro();

}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

})(window.AB = (window.AB || {}));
