# Dispute Resolution Console

A white-label dispute resolution console, rebuilt screen-for-screen from the
DisputeLab platform with Vinted branding and data. A second tenant
(**PriceLine**) ships in the same codebase and generates a complete dataset, not
just a recoloured chrome.

Vite + React 18 + React Router 6. **No UI kit, no charting library** — every
icon and every chart is hand-rolled inline SVG.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build to dist/
npm run preview      # serve the built output
```

**Demo credentials: `PriceLine` / `Changeme123`** — also shown on the sign-in screen.

---

## The three decisions worth knowing about

### 1. The hybrid data model

Two intake paths land in **one operational queue**, keyed on `caseType`:

| | `chargeback` | `claim` |
|---|---|---|
| Source | Card network | Buyer Protection |
| Carries | ARN, masked PAN, acquirer case #, BIN, MID, MCC, scheme, reason code (13.1, 13.3, 13.6, 10.4, 12.5, 4837, 4853, 4834, 4840, 4855, C08…), cycle (1st CB / 2nd CB / Pre-Arb / Retrieval / RFI), cardholder, card type | Item, category, buyer, seller, order ID, claim reason, payment method |

Roughly **2:1 chargebacks to claims** across ~1,200 cases.

Chargebacks **also carry the marketplace context** — item, listing price, order,
buyer, seller, rating. An analyst defending a 13.3 ("not as described") is
arguing about a *listing*, so the listing sits on the case beside the ARN.

The cost of one shared queue is a table that would otherwise be half N/A.
`src/domain/caseTypes.js` solves that: **columns adapt to the case-type filter**.
On the mixed view a single Reference column renders whichever identifier the row
actually has; filter to one path and that path's real columns appear.

### 2. Consolidation, and what actually counts as a double refund

Three linking rules, configured in `brand.config.js`:

| Rule | Minimum | Window | Filter |
|---|---|---|---|
| Same card | 2 | 90 days | — |
| Same order | 2 | 120 days | — |
| Same seller | **3** | **30 days** | **Open only** |

**The thresholds are the feature.** Two disputes on one card is a signal; two
against one seller is just a seller with volume. Tuned loosely this flagged 60%
of the book, then 28% — at which point analysts learn to ignore the flag.
Measured now at **13.2%** (158 of 1,200 cases, 64 groups).

**Only a shared ORDER can be refunded twice.** 13 groups span both channels, but
only **5** carry the danger treatment and the double-refund wording — the ones
sharing an order. A seller group containing a chargeback and a claim across two
different orders is two separate losses, and the panel says so rather than
crying wolf.

### 3. Special instructions gate behaviour

A blocking instruction disables the matching action tile and explains why on
hover: a regulatory hold disables Write Off, pre-arbitration disables Split Case,
a claim disables Representment because there is no card leg. The instruction
card and the tiles read from one source in `data/work-case.js`, so they cannot
disagree. The reference rendered the warning beside four permanently-enabled
buttons, which is theatre.

---

## White-label architecture

`src/brand/brand.config.js` is the single control file: palette, wordmark, logo
path, currency, locale, timezone, vocabulary, reason codes, entities, queues,
due-date offsets, thresholds and feature flags. `BrandProvider` writes the
palette to CSS custom properties at runtime.

> **No component hard-codes a colour, a brand name, or a tenant value.** Colours
> reach the DOM as `var(--c-*)`, nouns through `brand.terms`, and the logo as a
> **path** — never an import.

```bash
VITE_TENANT=priceline npm run dev
```

Tenant leaks found in the reference and converted — every one is the same class
of bug, a plausible default that only misbehaves under a second tenant:

| Source | Leak |
|---|---|
| `lib/format.ts` | `'en-US'` **and** `currency = 'USD'` hard-coded in the formatter |
| `data/cases.ts` | Priceline merchants, 9 branded queues, `@dlec.com` / `@priceline.com` addresses, `mid: USDPriceline{n}`, `currency:'USD'` |
| `data/permissions.ts` | Permission list built from the *reference's* navigation — still granting Case Priority, Archived Cases, Unmatched Docs, Criteria Check and Scheduler |
| `data/rule-builder.ts` | Merchant labels and a travel-only MCC list |
| `data/work-case.ts` | Route queues, assignable users and skills, `currency='USD'` |
| `tokens.css` / `chartPalette.ts` | "Priceline navy" and a blue/grey chart rule |
| `Sidebar` / `AppLayout` | `"DisputeLab"` wordmark, `"Priceline · CB911"` footer, avatar initials |
| `types/index.ts` | Role names including "Chargeback Analyst" |
| `lib/auth.tsx` | Demo username, plus a `localStorage` mutation at import time |

### Chart palette

Validated, not eyeballed. The shipped ramp passes all five palette checks
against a white surface — lightness band, chroma floor, CVD separation on every
adjacent pair, the normal-vision floor and 3:1 contrast. Two constraints shaped
it: the UI teal `#007782` and nav-active `#00A0AD` separate by only ΔE 12.6 and
so cannot both be series colours (the chart teal is `#008C99`), and green and
amber are never adjacent because they collapse to ΔE 7.3 under protanopia.

---

## Navigation

Our edited IA. **The omissions are deliberate** and documented in
`src/data/navigation.js`:

```
Dashboard
Rules      > Rule groups | Bulk actions | Rule check     ← not "Criteria check"
Case admin > Assignment reasons | Queue management |
             Case management | Upload cases             ← no Case priority;
                                                          Archived is a TAB
Work case
Reports    > Reports center | Monitoring | Custom reports ← no Scheduler page
Users                                                    ← ONE page, tabs
API documentation
Settings   > Account settings | Webhooks | System preferences
Help
```

No Unmatched docs section. Priority is derived from due date and value, so there
is nothing to administer. **The Permissions grid is generated from this
navigation**, so it can never grant access to a page that does not exist.

---

## Global patterns

- **Tooltips on everything truncated or icon-only**, rendered in a portal at the
  document root with a high z-index, ~400ms delay, dismissed on scroll. The
  reference's tooltip was already portalled; its *popovers* were not, and were
  clipped by the table's overflow container. Everything that floats now goes
  through `components/ui/Overlay.jsx`.
- **One data table** for every list: search, Advanced Search, filter popovers
  with live counts, `Fit to width | Comfortable` density, Column Toggle, Copy /
  Excel / CSV, sortable headers, expandable rows, and a footer with rows-per-page
  and `1–10 of N`.
- **Modals**: title, × close, required fields marked with a red asterisk, inline
  errors beneath the field, submit disabled until valid.

---

## Project structure

```
src/
  brand/       brand.config.js (the control file), BrandProvider, Wordmark
  domain/      statuses, caseTypes (adaptive columns), criteria engine,
               consolidation, metrics
  data/        seeded RNG, catalogue, people, 1200 cases, work-case detail,
               rules, admin, navigation, permissions, content
  components/  ui/ charts/ layout/ cases/ workcase/
  pages/       one per route
  styles/      tokens (fallbacks), base, components
  utils/       format, export, storage, rule reordering
```

The book is generated from one fixed seed, so tables, charts and consolidation
groups are identical on every reload — but **dates anchor to `now()`**, so the
seed controls offsets, not the calendar. Presentment can never post-date today:
a short window (Amex + RFI computes to a negative window) is floored and the due
offset clamped.

---

## Deployment

`vercel.json` carries the SPA rewrite — without it, refreshing on
`/work-case/VIN-720008` 404s — and immutable cache headers on content-hashed
assets. CI runs `npm ci && npm run build` on push, pull request and manual
dispatch, and builds the second tenant too.

---

## Verification

Verified:

- `npm run build` passes; both tenants build.
- Both tenants generate a complete dataset: 1,200 cases, exactly 2:1, **zero
  presentments post-dating today**, consolidation at **13.2%** in the 10–15 band,
  entity resolved on every case.
- All 20 screens plus the work-case detail mount and render their **loaded**
  state in jsdom with no React errors.
- Opened in **real Chrome at 1280 and 1440**: 16 routes each, no horizontal
  overflow, no console errors. Three table-overflow defects were found and fixed
  this way — long emails bleeding into the next column, the due pill colliding
  with the actions icons, and case IDs wrapping on their hyphen.
- Permissions: ungranted rows carry **no toggle** (checked across all three
  roles — 0 toggles in denied rows), and counts derive from the real list.

Not verified:

- **No automated test suite is committed.** The checks above ran through
  throwaway harnesses. Vitest + Testing Library is the first thing to add.
- No cross-browser testing beyond Chrome, no testing below 1280px, and no
  screen-reader pass.
- The Vinted logo could not be downloaded — brandfetch's CDN needs an API key and
  the only reachable asset was a 32×32 favicon. `public/tenant-*.svg` are
  authored marks, still referenced by path from the config.
