# Dispute Resolution Console

A white-label dispute resolution console. The bundled demo tenant is **Vinted**;
a second tenant (**PriceLine**) ships in the same codebase to prove the theming
is real rather than aspirational.

Vite + React 18 + React Router 6. **No UI or charting libraries** — every icon
and every chart is hand-rolled inline SVG.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build to dist/
npm run preview      # serve the built output
```

**Demo credentials: `PriceLine` / `Changeme123`** (also shown on the sign-in screen).

---

## The two decisions worth knowing about

### 1. The hybrid data model

Two intake paths land in **one operational queue**, keyed on `caseType`:

| | `chargeback` | `claim` |
|---|---|---|
| Source | Card network | Buyer Protection |
| Carries | ARN, masked PAN, acquirer case #, BIN, MID, MCC, scheme, reason code (13.1, 13.3, 10.4, 4837, 4853, 4855…), cycle (1st CB / 2nd CB / Pre-Arb / RFI), cardholder | Item, category, buyer, seller, order ID, claim reason |
| Deadline | Scheme window, minus an internal buffer | Programme window, minus the same buffer |

The book is roughly **2:1 chargebacks to claims**.

The payoff: **chargebacks also carry the marketplace context** — item, listing
price, order, buyer, seller and seller rating. An analyst defending a Visa 13.3
("not as described") is arguing about a *listing*, so the listing sits on the
case next to the ARN. Modelling the card leg as an addition to the order, rather
than as a parallel universe, is what makes that possible.

The cost of one shared queue is a table that would otherwise be half N/A.
`src/domain/caseTypes.js` solves that: **columns adapt to the active case-type
filter**. On "All", you get the columns that mean something for both paths plus
a single Reference column that renders whichever identifier the row actually
has. Filter to one type and that path's real columns appear.

### 2. Consolidation

Cases that belong together operationally are grouped and surfaced as a flag in
Work case. Three rules, configured in `brand.config.js`:

| Rule | Minimum | Window | Filter |
|---|---|---|---|
| Same card | 2 cases | 90 days | — |
| Same order | 2 cases | 120 days | — |
| Same seller | **3 cases** | **30 days** | **Open only** |

**The thresholds are the whole feature.** Two disputes on one card is already a
signal. Two against one seller is just a seller with volume — which is why that
rule needs three, a tight window and an open-only filter. Tuned loosely, this
flagged 60% of the book, and a flag on two-thirds of the queue tells an analyst
nothing. The current settings land at **13.3% flagged (16 of 120 cases, 6
groups)** — measured, not guessed.

The panel shows what linked the cases, the group size, **total exposure across
the group**, the linked cases themselves, and a "Work all N together" action.

**The cross-channel group is the one that matters.** `VIN-70008` and `VIN-70075`
are the same order disputed as *both* a card chargeback and a Buyer Protection
claim — €1,243.80 of total exposure on a €621.90 order. Worked separately by two
analysts in two queues, that order gets refunded twice. Only a system holding
both intake paths in one book can see it, and the panel escalates to a danger
treatment and says so in plain language.

---

## White-label architecture

`src/brand/brand.config.js` is the single control file: palette, wordmark,
currency, locale, vocabulary, reason codes, entities, queues, due-date offsets,
consolidation thresholds and feature flags.

`BrandProvider` writes the palette to CSS custom properties on `:root` at
runtime. The rule that keeps this honest:

> **No component may hard-code a colour or the word "Vinted".**
> Colours reach the DOM as `var(--c-*)`. Product nouns reach the JSX through
> `brand.terms`. If you are about to type a hex code or a tenant name inside
> `src/components`, it belongs in the brand config instead.

Swap tenants with an environment variable:

```bash
VITE_TENANT=priceline npm run dev
```

Everything changes with no component edits — palette, nav rail, chart series,
currency (EUR → USD), locale (en-GB → en-US), legal entities, queue labels,
case-ID prefix (`VIN-70001` → `PRL-44001`), and the vocabulary (a *seller*
becomes a *supplier*, an *order* becomes a *booking*, *Buyer Protection*
becomes *Traveller Protection*).

### Chart palette

The categorical series in `brand.config.js` is **validated, not eyeballed**. The
shipped order passes all five palette checks against a white chart surface —
lightness band, chroma floor, colour-vision-deficiency separation on every
adjacent pair, the normal-vision floor, and 3:1 contrast. Two constraints shaped
it and both are load-bearing:

- The UI teal (`#007782`) and the nav-active teal (`#00A0AD`) **cannot both be
  series colours** — adjacent, they separate by only ΔE 12.6 to normal vision.
  The chart teal is a saturated sibling (`#008C99`); the brand reads through the
  chrome, not through the slices.
- **Green and amber are never adjacent** — they collapse to ΔE 7.3 under
  protanopia. The ordering encodes that.

Assign these in fixed order and never cycle them. A seventh category folds into
"Other" and takes `chartNeutral`.

---

## Service layer

**Every read and write goes through `request()` in
`src/services/apiClient.js`. No component touches `fetch`.**

- `VITE_API_BASE_URL` set → the path is called for real.
- `VITE_API_BASE_URL` empty → a `fallback` resolver serves the demo book.

That is the entire migration path from demo to production: a config change, not
a refactor. Demo mutations apply to an in-memory copy of the book, so the UI
behaves like a real system within a session — change a status and it stays
changed until reload.

### Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/cases` | List cases across both intake paths (filters, sort, pagination) |
| `GET` | `/cases/:caseId` | One case with documents, history and notes |
| `GET` | `/cases/bench` | The current analyst's bench, due date first |
| `PATCH` | `/cases/:caseId` | Update status, queue, assignee or flags |
| `POST` | `/cases/bulk` | Apply one change set to many cases |
| `POST` | `/cases/:caseId/decision` | Record a resolution |
| `POST` | `/cases/:caseId/notes` | Add a note |
| `GET` | `/cases/:caseId/consolidation` | Linked groups for one case |
| `GET` | `/consolidation` | All groups plus flag-rate stats |
| `POST` | `/cases/import` | CSV import |
| `GET` | `/rule-groups` | Rule groups with rule counts |
| `GET` | `/rule-groups/:groupId/rules` | Rules in a group |
| `GET` | `/rules` | All rules |
| `POST` | `/rules` | Create a rule |
| `PATCH` | `/rules/:ruleId` | Enable, disable or edit |
| `GET` | `/rules/:ruleId/history` | Rule change history |
| `POST` | `/rules/:ruleId/check` | Per-criterion pass/fail for one case |
| `POST` | `/bulk-actions/preview` | Live match count for a criteria set |
| `GET` `POST` | `/bulk-actions` | Bulk action history |
| `GET` `POST` `DELETE` | `/queues`, `/queues/:id` | Queue management with live depth |
| `GET` `POST` `DELETE` | `/assignment-reasons` | Assignment reasons |
| `GET` | `/uploads`, `/uploads/schema` | Upload history and CSV column spec |
| `GET` | `/dashboard` | KPIs, activity series, AHT, reason donuts |
| `GET` | `/reports/summary` | Totals by reason category and due-date bucket |
| `GET` | `/monitoring` | Document processing, outcomes, error series |
| `GET` `POST` `DELETE` | `/reports`, `/reports/:id` | Saved and scheduled reports |
| `POST` | `/reports/preview` | Live report preview |
| `POST` | `/reports/:id/run` | Run a saved report |
| `GET` | `/users`, `/roles`, `/groups`, `/skills` | Directory |
| `GET` `PATCH` | `/permissions`, `/permissions/:id` | Permission matrix |
| `GET` `PATCH` | `/system/preferences` | Numbering, offsets, thresholds |
| `GET` `POST` `DELETE` | `/webhooks` | Webhook endpoints |
| `GET` | `/webhooks/topics` | Available webhook topics |
| `GET` `POST` | `/account`, `/account/password` | Account and password |
| `POST` | `/auth/login`, `/auth/logout` | Session |

The API documentation page in the app documents these same endpoints — it
describes the real contract, not a parallel fiction.

---

## Navigation

The information architecture below is the client's edited version of the
reference product. **The omissions are deliberate** and are documented in
`src/components/layout/navigation.js`:

```
Dashboard
Rules
  ├ Rule groups
  ├ Bulk actions
  └ Rule check            ← renamed from "Criteria check"
Case admin
  ├ Assignment reasons
  ├ Queue management
  ├ Case management       ← Archived is a TAB here, not a page
  └ Upload cases          ← no "Case priority" page
Work case
Reports
  ├ Reports center
  ├ Monitoring
  └ Custom reports        ← scheduling lives in the builder, no Scheduler page
Users                     ← ONE page: User management (Users/Roles/Groups
                             sub-tabs), Skills, Permissions
API documentation
Settings
  ├ Account settings
  ├ Webhooks
  └ System preferences
Help
```

There is no "Unmatched docs" section anywhere. Priority is **derived** from due
date and value (`domain/statuses.js`), which is why there is nothing to
administer.

---

## Project structure

```
src/
  brand/        brand.config.js (the control file), BrandProvider, Wordmark
  domain/       statuses, caseTypes (adaptive columns), consolidation,
                criteria (the rules engine), metrics
  data/         seeded RNG + fixtures (cases, rules, users, reports, API, help)
  services/     apiClient + one service per resource — the only place fetch lives
  context/      Auth, Toast
  hooks/        useAsync (with stale-response guard), useSelection
  components/   ui/ charts/ layout/ cases/ workcase/ rules/
  pages/        one per route
  styles/       tokens.css (fallbacks), base.css, components.css
  utils/        format, constants (routes)
```

### The demo dataset

`src/data/cases.seed.js` generates ~120 cases from **one fixed seed**, so the
table, the charts and the consolidation groups are identical on every reload.
Dates are the deliberate exception: they **anchor to `now()` at module load**,
so due dates are live rather than a frozen calendar from whenever the seed was
written. The seed controls the *offsets*, not the dates.

Consolidation groups are planted at fixed indices rather than left to chance —
see the comment block in that file for why, and why every case starts with a
distinct seller.

The same criteria engine (`domain/criteria.js`) backs the rule wizard, the live
match count in Bulk actions, and Rule check. A rule that says it matches 14
cases matches the same 14 cases everywhere.

---

## Deployment

`vercel.json` carries two things that matter:

- **The SPA rewrite.** Without it, refreshing on `/work-case/VIN-70123` 404s,
  because there is no file at that path.
- **Immutable cache headers** on `/assets/*`, which are content-hashed by Vite.

`.github/workflows/ci.yml` runs `npm ci && npm run build` on every push and PR.

### Environment

```bash
VITE_API_BASE_URL=      # empty → demo data; set → real API
VITE_TENANT=vinted      # vinted | priceline
```

---

## Verification status

Verified:

- `npm run build` passes clean.
- Both tenants generate a valid book with the correct palette, currency,
  vocabulary and case-ID prefix.
- Consolidation flag rate measured at 13.3%, with the cross-channel pair
  present and carrying the double-refund warning.
- Every page mounts and renders its **loaded** state (not just a skeleton), and
  all 41 service functions return valid payloads.

Not verified:

- **No automated test suite is committed.** The checks above were run with
  throwaway harnesses. Vitest + Testing Library is the first thing to add before
  this carries real traffic.
- No cross-browser, responsive-breakpoint or screen-reader testing.
- The live-API path (`VITE_API_BASE_URL` set) has never been exercised against a
  real backend — only the demo resolver path has run.
