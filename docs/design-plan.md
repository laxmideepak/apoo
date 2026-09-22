# Design plan — Apoorva Bandi

## Subject, audience, job

**Subject.** An AI/ML engineer who ships models into two of the most tightly
regulated environments in American software: a health insurer under HIPAA and a
card network under PCI-DSS. Nothing she has built can be shown. Everything she
has built had to be auditable, reversible, and explainable to a compliance
reviewer before it was allowed to score a single record.

**Audience.** US hiring managers and recruiters for senior AI/ML roles. Two
reading modes in one scroll: a 15-second scan, and an engineer who reads
everything.

**The page's one job.** Convince a hiring manager that she can own a production
ML system where being wrong is expensive — without a single product screenshot.

**Thesis.** *Models that have to explain themselves.* This is the honest
differentiator. Most ML portfolios sell novelty. Hers sells trustworthiness at
scale, and the résumé backs it: SHAP, model governance, audit logging, rollback,
HIPAA-aligned controls, PCI-DSS.

## Tokens

### Color — "technical paper"

Not a mood board: a printed statistical figure. Cool grey-blue stock, ink, one
structural blue, one red reserved strictly for error.

| Token | Light | Role |
|---|---|---|
| `--paper` | `#E9ECF2` | page |
| `--card` | `#F5F7FA` | raised surface |
| `--sunk` | `#DFE3EB` | flagged region, wash |
| `--ink` | `#14171E` | headings — 13.9:1 worst case |
| `--body` | `#3A4152` | prose — 7.9:1 |
| `--mute` | `#4E5668` | metadata — 5.7:1 |
| `--rule` | `#C7CDD9` | hairlines (decorative only) |
| `--accent` | `#2440C4` | structure, links, positive class — 6.3:1 |
| `--alert` | `#A32812` | error text — 5.7:1 |
| `--alert-dot` | `#D93A24` | false-positive marks (non-text, 3.6:1) |

Dark companion: `#0F131A / #161B24 / #1E242F` ground, `#8DA0FF` accent,
`#FF7A63` alert. Every pair verified ≥ 4.5:1 for text, ≥ 3:1 for marks.
Contrast was computed, not eyeballed.

### Type — three roles, one width axis

| Role | Face | Why |
|---|---|---|
| Display | **Anybody** (var: `wdth` 50–150, `wght` 100–900) | Industrial, flat-terminalled, signage-like. The width axis is not decoration — it drives the one signature moment. |
| Body | **Host Grotesk** (var 300–800) | Tall x-height, unfussy, holds long technical prose. |
| Data | **Azeret Mono** (var 100–900) | Every date, metric, tag and stage number. An ML portfolio is a numbers document; monospaced tabular figures are what make numbers look engineered. |

Explicitly rejected as 2026 defaults: Inter, Geist, Space Grotesk/Mono,
Satoshi, Clash Display, General Sans, Switzer, Instrument Serif, Bricolage
Grotesque, Playfair, Poppins, Montserrat, DM Sans.

### Layout — asymmetric, one side channel

A named-line grid: a `15rem` left channel and a `44rem` main measure. The
channel carries exactly one kind of thing — mono metadata: stage numbers, dates,
ecosystem tags, counts. Nothing decorative ever enters it. No symmetric
6-6 split, which reads as Bootstrap.

## Signature

**The decision boundary.** The hero is a real binary classifier. 2,390 records
sampled from two Beta distributions, a draggable threshold, and precision and
recall computed from the points actually on screen. Push the threshold left and
false positives flood in red and precision collapses; push it right and fraud
slips through as hollow rings. It opens at the threshold where precision is
93% — the figure from her résumé.

It is the one hero an AI generator cannot fabricate, because it requires the
domain. It is also, literally, the tradeoff she is paid to make.

**Tied to it:** as the threshold settles during load, her name *converges* —
Anybody travels from `wdth 128 / wght 250` to `wdth 88 / wght 800` over the same
900ms. Type motion and model convergence are the same gesture. One moment, once,
at load.

## Structure

The order is an argument, not a template.

1. **Hero** — name, thesis, the field, live readout.
2. **Four numbers** — each with a provenance clause. A number without a baseline
   and a window is decoration.
3. **Disclosure** — the sanitization note. Naming the NDA converts an absence
   into evidence of judgment. Recruiters already know the constraint exists.
4. **Two systems** — Humana, Mastercard. Context → what she built → an
   architecture diagram → outcomes → constraints. The diagram is the screenshot.
5. **The lifecycle** — 103 tools placed at the stage where they're used, across
   8 stages, filterable by ecosystem. Numbered 01–08 because it genuinely is a
   sequence.
6. **Close** — education, résumé in two formats, click-to-copy contact.

## Critique of this plan, before building

**Is the palette a default?** The three AI defaults are cream+serif+terracotta,
near-black+neon, and broadsheet hairlines. This is none of them. It derives from
the subject's own artifacts — matplotlib figures, model cards, audit reports.
Kept.

**Is the hero a default?** The template answer is a big number with a small
label and a gradient accent. Rejected. Kept the classifier.

**Is `01–08` decoration?** The skill's warning is that numbered markers are only
honest when order carries information. A model lifecycle is strictly ordered —
you cannot serve before you train. Earned. Kept, and used *nowhere else*.

**What gets cut?** Chanel's rule. Cut in planning: custom cursor, WebGL,
percentage preloader, marquee, local-time clock, theme toggle as the headline
interaction, command palette, and a "latent space" skill scatter — faking
embedding coordinates on an ML engineer's own site would be dishonest.

Cut during the build: the field's ambient shimmer. Idle is now completely
static. A crisp statistical figure that comes alive the moment you touch it is
more confident than one that shimmers at you, and it costs no battery. That is
the accessory removed at the door.

**Copy.** The résumé is written in procurement voice — "architected scalable
solutions leveraging". None of that survives. Plain, active, specific, and short
enough to read.

## Floor, not negotiable

- Responsive to 320px, no horizontal scroll.
- `:focus-visible` double ring, designed rather than tolerated.
- `prefers-reduced-motion` resolves everything to its finished state — a
  reduced-motion visitor sees the complete page, never an empty one.
- `clamp()` with a rem term everywhere, so browser zoom to 200% works.
- `tabular-nums slashed-zero` on every figure.
- Transform and opacity only; no layout animated.
- Zero dependencies, zero build step.
