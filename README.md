# Apoorva Bandi — portfolio

A single-page portfolio site. Plain HTML, CSS and JavaScript: no framework, no
build step, no dependencies, nothing to install.

## Run it

Double-click `index.html`. That's it — no server needed, everything works.

To serve it locally instead:

```bash
cd "/Users/deepakchowdary/Downloads/APOORVA PORTFOLIO" && python3 -m http.server 4321
```

Then open http://localhost:4321.

## Live

**https://apoorva-bandi.vercel.app**

Deployed on Vercel from `laxmideepak/apoo`, so pushing to `main` redeploys.
`vercel.json` sets `cleanUrls` and the cache policy; `vercel --prod` deploys
by hand.

## Deploy it elsewhere

Every host below takes the folder as-is. No configuration.

- **Netlify** — drag the folder onto https://app.netlify.com/drop
- **Vercel** — `npx vercel --prod` from this folder
- **GitHub Pages** — push the folder to a repo, then Settings → Pages → deploy from branch
- **Cloudflare Pages** — connect the repo, leave the build command empty

`<link rel="canonical">`, `og:url` and the JSON-LD `url` all point at the
Vercel URL. Change all three together if you move to a custom domain — a
canonical aimed at a domain you do not own tells search engines the content
belongs to someone else.

## What's in here

```
index.html              the site
assets/
  css/app.css           tokens, layout, components, motion — in CSS layers
  js/field.js           the decision-boundary hero
  js/stack.js           the 104 tools, placed in the ML lifecycle
  js/motion.js          reveals, the load sequence
  js/app.js             wiring
  favicon.svg
  Apoorva-Bandi-Resume.docx    your original document — this is what the
                               Résumé buttons download, byte for byte
docs/
  content.md            every fact on the site, traced to the résumé
  design-plan.md        the design decisions and why each was made
```

## Please read this part — copy provenance

**Every number and every technology on the site comes from your résumé.** Nothing
was invented, inflated or padded. `docs/content.md` traces each one.

**On length.** The page copy is about 660 words, roughly half what it was. The
detail that was cut still lives in the résumé document itself, which is what
the Résumé buttons download. There are no photographs anywhere on the
site: NDA work has no screenshots and you asked for no headshot, so every
visual is generated — the classifier, the two architecture diagrams, the
ticker and the outcome bars.

**The prose is my draft, written in your first person, and you should edit it.**
Specifically, these are written as if you wrote them, and they are my words
until you make them yours:

| Where | What to check |
|---|---|
| Hero line — *"machine learning for places where a wrong answer costs money…"* | Is this how you'd describe your work? |
| The **disclosure** block — *"What you cannot see here"* | This states the NDA constraint in your voice. Confirm you're comfortable with the wording. |
| Both **system** introductions | Written from your résumé bullets, but the framing (*"models do not get to be black boxes"*) is mine. |
| The **Constraints** blocks | Derived from the résumé — HIPAA, PCI-DSS, latency, scale. Verify they match reality. |
| Stage notes in **Capability** | One line per lifecycle stage, mine. |
| The closing line | *"If you are building ML that has to hold up under review…"* |
| **All four Positions** | **Read these first.** See below. |

### The Positions section needs your sign-off before you publish

The four opinions — on evals, agent loops, retrieval and explainability — are
written in your first person and are the most *personal* thing on the site. They
are grounded in the work your résumé describes, and each one is paired with a
"what would change my mind" line so they read as considered rather than loud.
But they are still my drafts of your views.

Read all four. Anything you would not say out loud in an interview, change or
delete — you will be asked about these, and that is the point of having them.
The section is dated *September 2026* so it is obvious when it was written;
update the date when you revise it.

**The single highest-value edit you can make:** add one line per system saying
*why you chose what you chose* — LightGBM over XGBoost and where that broke,
pgvector over FAISS over Azure AI Search, Prophet over ARIMA. Hiring managers
read stated trade-offs as the strongest signal of real ownership, and it's the
one thing I can't write for you because I don't know your reasoning. Drop it
into the `.constr` block in each `<article class="sys">`.

**The header shows the visitor's location, not hers** — city, their local time,
and their temperature. The clock is the visitor's own clock: no network, no
permission prompt, always exact.

The city cannot come from the browser timezone: `America/New_York` covers
Boston, Miami, Atlanta and Detroit alike, so deriving a city from it labels the
whole Eastern seaboard "New York". The city therefore comes from an IP lookup
(ipwho.is, no key, no cookies). That request necessarily discloses the
visitor's IP to that service — it is the only third party this site talks to
besides the font CDN. If it fails, the city and temperature stay hidden rather
than guessing, and the timezone abbreviation beside the clock still orients the
reader. Deleting `initMeta()` in `assets/js/app.js` removes all of it.

**Two claims to sanity-check before you publish:**

1. The hero opens at **93% precision**, which your résumé attributes to fraud
   work generally. The site says *"across payer-claim and card-transaction fraud
   models."* If that figure belongs to only one of the two, narrow it.
2. **−30% p95 latency** is listed on the Mastercard card. Your résumé puts it in
   the summary, spanning both roles. Move it if that's wrong.

The score distributions in the hero are **synthetic** — generated in the
browser from a fixed seed — and the caption says so plainly. No employer data
is present anywhere on this site.

## Editing content

- **Text** — edit `index.html` directly; it's ordinary readable HTML.
- **The tool list** — `assets/js/stack.js`. Each entry is
  `[label, ecosystem, cited?]`. The third value marks tools named in the two
  systems above, which is what renders them bold. Counts update automatically.
- **The diagrams** — inline `<svg>` in `index.html`. They are static; edit the
  markup directly.
- **The résumé** — the download is your original `.docx`, unmodified. Replace
  `assets/Apoorva-Bandi-Resume.docx` to update it; nothing regenerates it.
  There is no PDF: converting the real document needs LibreOffice
  (`brew install --cask libreoffice`, then
  `soffice --headless --convert-to pdf`), and a PDF built from my own layout
  would not be your document. Exporting to PDF from Word yourself gives the
  best fidelity — drop it in `assets/` and point the buttons at it.
- **Links** — LinkedIn and GitHub are wired up in the nav, the contact block and
  the JSON-LD.

## Decisions worth knowing about

**The hero is a working classifier, not decoration.** 2,390 points sampled from
two Beta distributions; the vertical rule is a decision threshold; precision and
recall are computed from the points on screen every time you move it. Drag it
left and false positives flood in red. That tradeoff is the job, so it's the
hero.

**The résumé button is in the nav.** One school of thought says a résumé
download shouldn't be a primary call to action — the site should make it
redundant. For someone actively interviewing, recruiters look for it in the nav,
so it stays. Remove it from `.bar__nav` if you'd rather it lived only at the
bottom.

**Alternating bands.** The page runs light → black → light → black, like the
reference. A `.band--invert` section flips to the opposite of whatever theme is
active, so the alternation survives a theme switch instead of going black on
black. Contrast inside the inverted bands is 17:1 for headings and 13:1 for
body.

**There is no background behind the hero, on purpose.** Three versions were
built and thrown away — a systolic grid, a causal attention matrix, a loss
surface with gradient descent running on it. All read as muddy, and the reason
was not what they depicted: the decision-boundary classifier sits directly
below, and a second field of grey marks competing with it in the same viewport
weakened the one genuinely memorable object on the page. Spend the boldness in
one place.

**The contact band keeps one ambient layer**, because nothing competes there: a
response-time histogram along its floor. Samples are drawn from a log-normal
distribution — the shape real latency actually has — and the dashed line is the
true p95 of the bars on screen, recomputed as they scroll. It ties to the 30%
p95 figure on the Mastercard card.

**Paper grain** over the whole page at 4.5% (7% in dark). Not an effect: it is
what stops large flat fields of one colour reading as flat screen, which is most
of what separates a printed poster from a web page.

**The role line under the name** rolls through AI / ML / MLOps / Data Engineer
behind a one-line mask. Deliberately not a typewriter effect — that is the
most-cloned hero device there is. The full list sits in the DOM for screen
readers and the roll itself is `aria-hidden`.

**The tech ticker** is two rows of tool names scrolling in opposite directions
across the black band. It is built from the same `stack.js` data as the
lifecycle below it, so the two can never disagree; the top row is the 58 tools
the page evidences, the lower row the rest. It is `aria-hidden` and purely
decorative — the readable list is directly underneath. It pauses on hover and
does not animate under `prefers-reduced-motion`. Its duration is derived from
the measured width so it always travels at a fixed reading speed — about
52px/s — rather than crawling on wide screens and racing on narrow ones. Deliberately text, not a wall
of framework logos: logo grids read as a bootcamp certificate.

**Numbers are drawn as well as written.** Each outcome carries a small bar that
encodes its own figure — 100 vs 93 for precision, 100 vs 134 for the detection
lift, 100 vs 50 for review time, and ten unit marks for 10M records a day. They
encode the quoted number directly; no invented series.

**Light is the primary theme**, with a dark companion that follows the OS
setting and a toggle in the footer. Most engineer portfolios are dark; a light,
instrument-grade page stands out, and the field reads like a printed figure on
it. The dark theme is a warm near-black — a printed page at night rather than a
terminal — and in dark, links are underlined ink rather than a coloured accent,
because a single glowing accent on near-black is the most generated-looking
pattern in the genre. Every pair verified: ink 14.3:1, body 11.1:1, muted 6.2:1.

**Typography.** Bebas Neue for display — the condensed uppercase face from the
reference site — at poster scale: headings up to 94px with 0.82 line-height and
tight negative tracking. Host Grotesk for body copy and JetBrains Mono for data.

Bebas has no lowercase and no second weight, so it is used for headlines,
numbers, labels, nav and buttons only. Paragraphs stay in a readable sans:
the reference site sets *everything* in Bebas, which works for an agency's
short taglines and would not work for paragraphs about HIPAA and MLOps. The
name still converges on load — on tracking now, since a single-weight face has
no other axis to travel.

**The buttons** fill from the baseline up on hover rather than swapping colour,
and carry a mark that travels a few pixels. One filled control per view, never
more.

**The JavaScript is classic scripts, not ES modules.** Browsers refuse to load
a module over `file://` — a module build renders a blank, broken page when you
double-click the HTML, and only works once it's served. The five files share
one `AB` namespace and load in dependency order instead, so the page works
identically whether it's opened from disk or from a host. Verified both ways:
the module build rendered 0 of 8 lifecycle stages and neither diagram from
`file://`; this build renders all of them.

**Motion is concentrated, not sprinkled.** A uniform fade-up on every section is
the clearest tell of a templated site, so there are four moments and no more:
the name converging as the threshold settles, the field's opening sweep, the
diagram tracing its data path, and the capability filter. Metrics deliberately
do **not** count up — an animated counter makes a hard-won 93% look like a SaaS
landing page.

**Accessibility and resilience floor:**
- No horizontal scroll down to 320px — verified.
- With JavaScript off or broken, the full page renders; every hidden-until-
  revealed state is scoped under a `.js` class the page adds to itself.
- `prefers-reduced-motion` resolves everything to its finished state.
- The threshold is operable by keyboard via a real range input, and announced
  to screen readers with a live region.
- Contrast ratios were computed, not eyeballed: body text 7.9:1, muted 5.7:1,
  links 6.3:1 against the darkest surface each sits on.
- Fonts have metric-matched fallbacks measured from the live faces, so the page
  doesn't reflow when webfonts land.

**One external dependency:** the three fonts (Anybody, Host Grotesk, Azeret
Mono) load from Google Fonts. Everything else is local. If you'd rather
self-host them — faster, and no third-party request — download the woff2 files
and swap the `<link>` for local `@font-face` rules.
