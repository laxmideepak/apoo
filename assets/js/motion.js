(function (AB) {
'use strict';

/* ---------------------------------------------------------------------------
   motion.js — reveals and the load sequence.

   Rules this file follows:
   · Only transform and opacity animate, so nothing touches layout mid-flight.
   · Every observer unsubscribes once its element has played.
   · prefers-reduced-motion resolves everything to its final state rather than
     leaving content hidden — a reduced-motion visitor sees the finished page,
     not an empty one.
--------------------------------------------------------------------------- */

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- reveal on entry -------------------------------------------------- */
/* Elements opt in with [data-reveal]. A parent [data-reveal-group] staggers
   its children by giving each one an --i index. */
function initReveals() {
  const groups = document.querySelectorAll('[data-reveal-group]');
  groups.forEach((g) => {
    const kids = g.querySelectorAll(':scope > [data-reveal], :scope [data-reveal-item]');
    kids.forEach((k, i) => k.style.setProperty('--i', i));
  });

  const targets = document.querySelectorAll('[data-reveal]');
  if (reduced()) {
    targets.forEach((t) => t.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
  );
  targets.forEach((t) => io.observe(t));
}

/* Numbers do not animate here, on purpose. A production metric that counts up
   on scroll reads as a SaaS marketing page, which is the opposite of what a
   hard-won 93% should look like. The interactive number on this site is the
   threshold, and it moves because the visitor moved it. */

/* ---- the load sequence ------------------------------------------------- */
/* Beats are CSS-driven; this only opens the gate once fonts have settled, so
   the first thing a visitor sees is not a reflow. */
function runIntro() {
  const go = () => {
    document.documentElement.classList.add('is-ready');
    requestAnimationFrame(() => document.documentElement.classList.add('is-lit'));
  };
  if (document.fonts && document.fonts.ready) {
    Promise.race([
      document.fonts.ready,
      new Promise((r) => setTimeout(r, 900)),
    ]).then(go);
  } else {
    go();
  }
}

AB.initReveals = initReveals;
AB.runIntro = runIntro;
})(window.AB = (window.AB || {}));
