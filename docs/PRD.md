# ProteinPulse: Product Requirements Document

## Problem Statement

People tracking body recomposition or muscle-gain goals care about two numbers above all else: total calories and total protein. Most calorie-tracking apps bury this behind food databases, barcode scanners, accounts, and subscription paywalls. ProteinPulse solves the narrow problem of "how much have I eaten and how much protein was in it, against today's goal" (nothing else) for people who don't want an account, a server, or a database of 2 million branded snack foods.

## Target Users

- **The lifter tracking a cut/bulk**: already knows their macros from a coach or calculator, just needs a fast daily log against a calorie and protein target. Doesn't want to look up "grilled chicken breast, 6oz, Trader Joe's" in a food database; they already know the numbers from the package or a quick mental estimate.
- **The privacy-conscious user**: doesn't want to create an account or hand nutrition data to a third-party server. Wants their data to live in their own spreadsheet, not a company's database.
- **The spreadsheet person**: already logs macros in Google Sheets or Excel out of habit, and wants a nicer input UI that still round-trips to a spreadsheet file they control.

## Goals

- Logging a day's calories and protein takes under 10 seconds, no navigation required beyond the home screen.
- Zero setup: open the HTML file (or a static-hosted URL) and start logging immediately, no signup.
- Full data ownership: every byte of user data can be exported to a `.xlsx` file the user controls, and re-imported without loss.

## Non-Goals

- No food database, barcode scanning, or nutrition lookup: users enter calories/protein numbers directly.
- No user accounts, login, or server-side storage of any kind.
- No real-time multi-device sync in v1 (see Roadmap: Google Sheets sync is explicitly deferred).
- No tracking of macros beyond calories and protein (no carbs/fat/fiber/micronutrients) in v1.
- No mobile app / app-store distribution; browser-only.

## User Stories

- As a lifter, I want to type in today's calories and protein as I eat so I can see my remaining budget update in real time.
- As a privacy-conscious user, I want all my data stored only in my browser's local storage so no third party ever sees what I eat.
- As a spreadsheet person, I want to export my full log to an `.xlsx` file so I can back it up, analyze it in Excel, or hand it to a coach.
- As a returning user, I want to import a previously exported `.xlsx` file so I can restore my data on a new browser or device.
- As a goal-setter, I want to set a calorie and protein goal that automatically applies to every future day until I change it, so I don't have to re-enter it daily.
- As someone who wants detail, I want to optionally label an entry (e.g. "Chicken breast") so my exported log is readable later, without being forced to name every entry.
- As a weekly/monthly reviewer, I want to see totals and trends across the week and month, not just today, so I can spot patterns.

## Feature List

### MVP (must ship)

- Today view: calorie ring, protein ring, kcal-today readout, remaining calories/remaining protein rows (as in the reference screenshot).
- Log-entry form: Calories (number), Protein (number, grams), optional Label (text); submits as one entry, added to today's running totals.
- Itemized entry list for the current day: shows each logged entry's date, label (or "Entry" if blank), and calories/protein, with a delete affordance.
- Goal editor: set calorie goal and protein goal; takes effect from the date it's set forward (carry-forward model: see Data Models below).
- Calorie:protein ratio: computed as calories per gram of protein (e.g. "12.5:1"), shown on the Today totals table, as a column on the Week/Month/Year tables, and as a line overlay on each view's chart; reads "N/A" when protein is zero to avoid a divide-by-zero display.
- Local storage persistence: all entries and goal history persist across reloads with no backend.
- Export to `.xlsx`: one workbook, two sheets (Entries, Goals), downloadable via a button.
- Import from `.xlsx`: file picker restores entries + goal history into local storage, with a confirmation step before overwriting existing data.
- Week view: rollup of the last 7 days (totals, goal adherence, and ratio per day), plus a bar chart (calories, protein, and a ratio line overlay) above the table.
- Month view: rollup of every day so far in the viewed month (totals, goal adherence, and ratio per day), a matching chart, and prior/next month navigation.
- Year view: rollup of every month in the viewed year (aggregated from daily totals), a matching chart, and prior/next year navigation.
- Fully responsive across the breakpoints defined in [DESIGN.md](DESIGN.md#breakpoints): manually audited at all three breakpoints across all four views with zero horizontal overflow.
- In-app confirm/notice modal for the import flow, replacing native `window.confirm`/`window.alert` dialogs, matching the rest of the design system.
- Landing page (`landing.html`): a separate marketing- and education-oriented overview page introducing ProteinPulse to a first-time visitor (hero, problem statement, how-it-works steps, feature grid, tenets, FAQ), linked from the app header's About link. Distinct from the app itself: `index.html` stays the tool, the landing page sells and explains it.

### Future (post-launch)

- Entry deletion from the Week, Month, and Year views: today, an entry can only be deleted from the Today view's itemized list. The rollup views show totals per day/month with no way to drill into or remove a specific entry from a past day without navigating back to that day in the Today view first. Next priority after the landing page.
- Local file sync via the File System Access API (post-v1.0): let a user pick an existing `.xlsx` file once (e.g. one already sitting in Downloads) and have the app silently re-save updates to that same file on future changes, instead of triggering a new browser download each time. Chromium-only (Chrome, Edge, Opera): Safari and Firefox don't implement `showOpenFilePicker`/`showSaveFilePicker`, so the existing manual Export/Import buttons remain the fallback path on those browsers. Needs a feasibility spike to confirm permission persistence across browser restarts before it's scheduled.
- Google Sheets live sync: push/pull entries and goals to a linked Google Sheet whenever data changes, using the same `.xlsx`-shaped schema so the sheet and local storage stay structurally identical.
- Streak tracking (consecutive days meeting protein goal).
- Multiple goal profiles (e.g. "cut" vs "bulk" presets to switch between).
- CSV export as an alternative to `.xlsx`.
- Optional PWA install (offline-capable, add-to-homescreen); still no account, still local-storage-backed.
- Dark/light theme toggle (v1 is dark-mode only per explicit requirement).

## Constraints

- **Technical**: vanilla HTML/CSS/JS only: no framework, no build step, no bundler, no package.json required to run. The one exception is a vendored, locally-hosted copy of SheetJS (`xlsx.full.min.js`, Apache-2.0 licensed) for `.xlsx` read/write, since no vanilla-JS-only path exists for real Excel-format files.
- **No server**: everything must run by opening the HTML file directly or via any static file host. No user accounts, no server-side database, no API keys required for MVP.
- **Platform**: must work in current versions of Chrome, Firefox, Safari, and Edge. No IE11 support required.
- **License**: project is free and open source; all vendored dependencies must be permissively licensed (MIT/Apache/BSD).

## Assumptions

- Users are comfortable entering raw calorie/protein numbers themselves (from food labels, a coach, or memory) rather than looking them up in-app.
- A single browser's `localStorage` is an acceptable single source of truth for a given device; multi-device consistency is solved via manual export/import until Google Sheets sync ships.
- Importing a `.xlsx` file is a full-replace operation in v1, not a smart merge; the confirmation step exists specifically because import overwrites current local storage. A future version may add merge logic if requested.
- "Set a daily goal every single day" means the goal carries forward by default (set once, applies going forward) rather than requiring re-entry every day. Confirmed with the user during scoping.
- Entries are additive/running-total only in v1; there is no "edit an entry's exact values" flow beyond delete-and-re-add, since the itemized list already covers correction via delete.

## Success Criteria

- A new user can log their first entry within 10 seconds of opening the page, with zero instructional text needed (the empty state and form are self-explanatory).
- Export → clear browser storage → import round-trips 100% of entries and goal history with no data loss.
- Page has zero horizontal overflow and zero clipped/overlapping text at every breakpoint listed in DESIGN.md.
- Lighthouse accessibility score ≥ 95 on the Today view.

## Tenets

1. **No number lookup, ever.** ProteinPulse never asks the user to search a food database. If a feature would require looking up a food's nutrition info inside the app, it's out of scope: the user always types the number they already know. This is the single biggest differentiator from every mainstream calorie tracker and it must not erode over time.
2. **Your data never leaves your machine unless you export it.** No analytics beacons, no third-party requests, no server round-trip for core logging. This wins over the "spreadsheet person" and "privacy-conscious" personas specifically and is non-negotiable even if it makes future features (like sync) harder to build.
3. **Spreadsheet-shaped data, always.** Every internal data model must be representable as flat rows a non-technical person could open in Excel and understand immediately. This constrains schema design now so that Google Sheets sync (Future) is a translation layer, not a rewrite.
4. **Ten-second logging beats perfect data.** Speed of entry beats completeness of nutrition data. When these two goals conflict (e.g. "should we require a food name"), speed wins; hence the optional, not required, label field.
5. **One color, used sparingly.** The accent color (`#0018F9`) marks exactly one thing at a time: the active/primary action. If a screen needs a second "important" color, that's a sign the screen is doing too much, not a sign we need a second accent.
6. **No dependency that needs a build step.** SheetJS is vendored as a single `.js` file, not installed via npm with a bundler. If a future feature needs a library that can't be included as one plain `<script>` tag, that feature needs to be redesigned or deferred.

## Roadmap

### Current Phase

**Phase 1 complete: v1.0.0 shipped.** Logging, goals, xlsx import/export, charted Week/Month/Year rollups, and a responsive/accessibility hardening pass are all live. Remaining roadmap items are explicitly post-v1.

| Milestone | Timeframe | Status |
|---|---|---|
| Documentation (README, PRD, DESIGN, PATCHNOTES) | Done | Complete |
| v0.0.1: Template version of the site with placeholders for upcoming milestones | Done | Complete |
| Branding: use the 💪🏼 emoji as the site favicon and the main logo | Done | Complete |
| v0.1.0: Today view + logging + local storage | Done | Complete |
| v0.2.0: Goal editor with carry-forward model | Done | Complete |
| v0.3.0: xlsx export/import | Done | Complete |
| v0.4.0: Week/Month views | Done | Complete |
| v0.5.0: Graphs for the Week and Month views | Done | Complete |
| v0.6.0: Year view | Done | Complete |
| v1.0.0: Full responsive audit + accessibility pass | Done | Complete |
| Landing page: marketing/educational overview page | Done | Complete |
| Entry deletion from Week/Month/Year views | Post-v1 | Planned |
| Local file sync via File System Access API (Chromium-only) | Post-v1 | Planned (deferred) |
| Google Sheets live sync | Post-v1 | Planned (deferred) |

### Explicitly Deferred Items

- **Google Sheets live sync**: deferred because it requires OAuth/API-key handling, which conflicts with the "no server, no account" constraint until a clean client-only auth flow (e.g. Google Identity Services with a user-supplied API key) is designed and explicitly opted into by the user.
- **Local file sync via File System Access API**: deferred pending a feasibility spike, since it's Chromium-only and its file-handle permission needs to be re-verified (and possibly re-granted) across browser restarts; needs testing before it's promised as a real feature rather than a Chrome-only convenience.
- **Multiple goal profiles**: deferred until single-goal carry-forward is proven sufficient; adding profiles now would complicate the data model before there's evidence it's needed.
- **CSV export**: deferred since `.xlsx` covers the stated requirement (Excel/Sheets compatibility); CSV adds a second export path with no new capability.

## Metrics

Since this is a client-only, no-analytics, no-account app by design (Tenet 2), most classic product metrics don't apply. Metrics here are aspirational/self-reported rather than instrumented, unless/until an explicitly opt-in, privacy-respecting analytics approach is decided.

- **North star metric**: days with at least one logged entry, self-tracked by the user (visible in the Month view "days logged" count). There is no telemetry back to any server.
- **Acquisition**: GitHub repo stars/forks, README views; no in-app acquisition tracking (no accounts to count).
- **Engagement**: consecutive days logged (streak), visible only locally to the user, not reported anywhere.
- **Retention**: N/A without accounts/telemetry; would require an opt-in mechanism to measure, which is explicitly out of scope for v1.
- **Performance**: page load time (target < 1s on a static host, since there's no framework/bundle to parse), zero horizontal overflow at all breakpoints, Lighthouse accessibility ≥ 95.
- **Targets**: page weight (HTML+CSS+JS, excluding vendored xlsx library) under 100KB unminified; first meaningful paint under 500ms on a throttled 3G profile.
- **Measurement method**: Lighthouse (performance/accessibility), manual breakpoint audit (see Runbook), GitHub Insights (stars/forks) for the acquisition proxy.
- **Reporting cadence**: reviewed at each version milestone (see Roadmap table), not on a recurring schedule; there's no live traffic to monitor.

## Runbook

### Local Setup

1. Clone the repository: `git clone <repo-url>`.
2. No install step required: there is no `package.json`, no `npm install`. All dependencies (including SheetJS) are vendored in the repo.
3. Serve the folder with any static file server, e.g. `python -m http.server 8000`, or simply open `index.html` directly in a browser (file:// works since there's no server-dependent code).

### Build

There is no build step. The `docs/` folder (or repo root, once the site is built) is the deployable artifact as-is: no compilation, bundling, or minification pipeline for v1.

### Deploy

- **Staging**: not applicable in v1; test locally via `python -m http.server` before any push.
- **Production**: deploy by pointing any static host (GitHub Pages, Netlify, Cloudflare Pages) at the repo root. No environment variables, no server config, no build command required.

### Rollback

Since there's no build/deploy pipeline, rollback is a `git revert` of the offending commit followed by re-deploying the static host from the reverted commit (or re-pointing GitHub Pages at the prior commit SHA).

### Environment Configs

Single environment: static files served as-is. No staging/production config differences exist because there is no server-side configuration of any kind.

### Common Errors

| Error | Likely Cause | Fix |
|---|---|---|
| Import silently does nothing | Uploaded file isn't a valid `.xlsx` or doesn't match the expected sheet names ("Entries"/"Goals") | Re-export from ProteinPulse itself, or check the file was saved as `.xlsx` (not `.xls`/`.csv`) |
| Data disappeared after a browser update/clear | `localStorage` was cleared (private browsing, "clear site data", or a different browser/profile) | Restore from the last `.xlsx` export via Import |
| Page looks broken/overflowing on mobile | A CSS grid track using bare `1fr` instead of `minmax(0, 1fr)`, or a flex child missing `min-height: 0` | See the responsive-bug patterns in DESIGN.md and the mobile audit process below |

### Monitoring

Not applicable: no server, no logs, no uptime to monitor. The only "monitoring" is periodic manual verification (see Documentation Process below) that the static host is serving the latest commit.

## Technical Requirements

### System Architecture

Fully static, client-only single-page app. One `index.html`, plain CSS, plain JS modules (no bundler). All state lives in the browser's `localStorage`. The only "integration" is the vendored SheetJS library used purely client-side for reading/writing `.xlsx` binary data; no network calls are made by the app itself.

### Tech Stack

- HTML5, CSS3 (custom properties, Grid, Flexbox), vanilla JavaScript (ES2020+, no transpilation).
- [SheetJS Community Edition](https://sheetjs.com) (`xlsx.full.min.js`, Apache-2.0), vendored locally for `.xlsx` parsing and writing.
- No frameworks, no npm dependencies required to run the app.

### Folder Structure

```
/project-root
├── README.md
├── index.html
├── landing.html          # marketing/educational overview page, separate from the app
├── /css
│   ├── styles.css
│   └── landing.css       # landing-page-only styles, built on styles.css tokens
├── /js
│   ├── app.js            # view rendering, event wiring
│   ├── storage.js        # localStorage read/write, goal carry-forward resolution, monthly aggregation
│   ├── charts.js         # Canvas bar-chart renderer shared by Week/Month/Year
│   ├── modal.js          # in-app confirm/alert replacement
│   └── xlsx-io.js        # export/import using vendored SheetJS, lazy-loaded on first use
├── /vendor
│   └── xlsx.full.min.js  # SheetJS, vendored for offline/no-CDN operation
└── /docs
    ├── PRD.md
    ├── DESIGN.md
    └── PATCHNOTES.md
```

### Data Models

**Entry**
| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Generated client-side |
| `date` | string `YYYY-MM-DD` | Local date the entry belongs to |
| `timestamp` | number (epoch ms) | For ordering within a day |
| `label` | string \| null | Optional, e.g. "Chicken breast" |
| `calories` | number | ≥ 0 |
| `protein` | number (grams) | ≥ 0 |

**Goal** (carry-forward model)
| Field | Type | Notes |
|---|---|---|
| `effectiveDate` | string `YYYY-MM-DD` | Goal applies from this date forward until a newer `effectiveDate` goal exists |
| `calorieGoal` | number | |
| `proteinGoal` | number (grams) | |

To resolve "today's goal," find the Goal record with the latest `effectiveDate` that is `<=` today; if none exists, the UI prompts for an initial goal.

### API Design (browser-only: internal data flow)

There are no HTTP endpoints. Internal "API" is the module boundary between `storage.js` (read/write `localStorage`, resolve today's goal, monthly aggregation), `charts.js` (`mountChart()`, reusable across Week/Month/Year), `modal.js` (`confirmModal()`/`alertModal()`, Promise-based replacements for native dialogs), and `app.js` (rendering). `xlsx-io.js` exposes two async functions: `exportToWorkbook(entries, goals) -> Promise<void>` (triggers a file download via `XLSX.writeFile`) and `importFromWorkbook(file) -> Promise<{entries, goals}>`; both lazily inject the vendored SheetJS `<script>` tag on first call. Import errors surface as a rejected promise, caught by `app.js` and shown via `alertModal()`, not a thrown exception to the console.

### State Management

All state is derived from two `localStorage` keys (`proteinpulse_entries`, `proteinpulse_goals`), read on load into in-memory arrays and re-serialized on every mutation. No client-side router or framework state: views (Today/Week/Month/Year) are plain functions that read the same in-memory arrays and re-render their section of the DOM. The Month and Year views additionally hold a small in-memory offset (not persisted) tracking which month/year is currently being viewed.

### Third-Party Integrations

- **SheetJS (vendored)**: reads/writes `.xlsx` binary format entirely client-side. Receives no user data over the network; it's a local library call, not a service.
- **Google Sheets** (future, deferred): would receive the same Entry/Goal rows the user already exports today, via a user-authorized OAuth flow. Not implemented in v1.

### Performance Requirements

- Page weight (excluding vendored SheetJS, which is ~900KB minified): target under 100KB.
- First meaningful paint under 500ms on a throttled connection, since there's no framework parse cost.
- No render-blocking network requests: SheetJS is loaded lazily, injected as a `<script>` tag only on the first Export or Import click, not on initial page load.

### Known Technical Debt

- **Lighthouse accessibility score is not automated**: this project has no CI and no Node.js-based tooling, so the ≥95 target in Success Criteria is verified by a manual audit (contrast ratios calculated by hand, keyboard/focus walkthroughs, screen-reader passes) rather than an actual Lighthouse run. Worth automating if a CI pipeline is ever added.
- **Year view recomputes daily totals on every render**: `totalsForMonth()` sums `totalsFor()` across every day of every month shown, with no memoization. Fine at current data scale (a few years of entries); would need caching if the entry list grows very large.
- **Charts have no export of their own**: the Week/Month/Year charts are visual-only; the underlying numbers are already covered by the existing `.xlsx` export and the tables beneath each chart, but there's no "save chart as image" affordance.

## Security

### Authentication Model

None. There are no user accounts, sessions, or login flows in v1.

### Authorization Model

None. A single browser profile has full read/write access to its own local data; there is no concept of roles or permissions.

### Data Storage

All entries and goals are stored in the browser's `localStorage`, scoped to the origin serving the app. No data is transmitted anywhere unless the user explicitly clicks Export (writes a local `.xlsx` file, which the browser saves via the normal file-download flow) or Import (reads a local file the user selects).

### Environment Variables

None required for v1: there is no server, so there are no secrets to configure. If Google Sheets sync is implemented later, any API key/OAuth client ID must be user-supplied at runtime (entered in-app) rather than hardcoded or committed to the repo.

### Third-Party Trust

- **SheetJS**: runs entirely client-side; receives no data since it's a local script, not a remote service.
- No other third parties receive user data in v1.

### Known Attack Surface

- **Import of untrusted `.xlsx` files**: parsing must handle malformed/malicious files defensively (SheetJS is a mature, widely-used parser, but the import path should validate row shape before writing to `localStorage` rather than trusting the file blindly).
- **XSS via entry labels**: user-entered labels must be rendered as text content (not `innerHTML`) to prevent stored XSS from a label like `<img src=x onerror=...>`.

### Dependency Policy

Since there's no `package.json`/npm dependency tree, the only third-party code is the vendored SheetJS file. It should be updated manually and deliberately (checked against SheetJS's release notes/CVEs) rather than auto-updated, given there's no dependency-scanning tool wired up for a no-build static site.

## Press Release

**Headline**: ProteinPulse launches as a free, open-source calorie-and-protein tracker that runs entirely in your browser, no account required.

**Subheadline**: Your data stays on your device and exports to a spreadsheet you control, anytime.

**Dateline**: San Francisco, CA, on launch day

Today marks the release of ProteinPulse, a free and open-source web app for anyone tracking calories against a daily protein goal. Built for lifters, dieters, and anyone who already knows their macro targets, ProteinPulse strips away food databases, logins, and subscriptions, leaving just a fast daily log and a clear picture of how much is left to hit today's goal. It runs entirely in the browser: no server, no account, and no data ever leaves the user's device unless they choose to export it.

Most calorie trackers assume you want to search a food database for every bite, and assume you're fine handing your eating habits to a company's servers. For people who already know their numbers, that's friction with no payoff, and for privacy-conscious users, it's a dealbreaker.

ProteinPulse solves this by putting two number fields front and center: calories and protein. Log an entry in seconds, watch a progress ring fill toward today's goal, and see exactly how much room is left. Every entry and goal lives in the browser's local storage, and a one-click export produces a real `.xlsx` file the user can open in Excel or Google Sheets, back up, or hand to a coach.

*"I don't need an app to tell me a chicken breast has protein in it. I just need somewhere fast to log the number and see if I'm still under my calories for the day. This is the first tracker that gets out of my way."* (Jordan, a home-gym lifter tracking a cut)

Try ProteinPulse today: open the live site, no signup required, and log your first entry in under 10 seconds.

ProteinPulse is an independent, community-maintained open-source project, built and released under a permissive license for anyone to use, audit, or contribute to.

## Frequently Asked Questions

**What is ProteinPulse?**
A free, browser-based tracker for daily calories and protein against a goal you set. No food database, no account.

**Who is it for?**
Anyone who already knows their food's calorie/protein numbers (from a label, app, or coach) and just wants a fast place to log and total them against a daily goal.

**How do I use it?**
Open the page, set a calorie and protein goal, then enter calories/protein (and optionally a label) each time you eat and tap Add to Today. Your running total and remaining budget update immediately.

**Does it cost anything?**
No. It's free and open source, with no premium tier planned for the core logging/export functionality.

**Do I need to create an account?**
No. There are no accounts, logins, or passwords anywhere in the app.

**Where is my data stored?**
In your browser's local storage, on your device only. Nothing is sent to a server.

**What happens if I clear my browser data?**
Your log is lost unless you've exported it. Export regularly to an `.xlsx` file as a backup.

**Can I use it on my phone?**
Yes. It's fully responsive and works in any modern mobile browser. There's no native app.

**Can I sync between my phone and computer?**
Not automatically in v1. Export a `.xlsx` on one device and import it on the other. Automatic Google Sheets sync is on the roadmap.

**What format does export use?**
A real `.xlsx` file (Excel format), with an Entries sheet and a Goals sheet, openable in Excel, Google Sheets, or any spreadsheet app.

**Can I import my old data back in?**
Yes. Import reads a previously exported `.xlsx` file and restores your entries and goal history. Note: import replaces current data; it doesn't merge with it.

**Do I have to name every food I log?**
No, the label field is optional. You can log just calories and protein with no name if you want to move fast.

**Does it track carbs, fat, or other nutrients?**
Not in v1. It's intentionally scoped to calories and protein only.

**What if I forget to set a goal?**
Your goal carries forward automatically once set; you set it once and it applies to every future day until you change it.

**Does the app work offline?**
Yes, once loaded: there are no network calls for core logging (SheetJS is vendored locally, not loaded from a CDN).

**Is my data ever shared with anyone?**
No, not unless you manually export a file and share it yourself.

**What browsers are supported?**
Current versions of Chrome, Firefox, Safari, and Edge.

**Is there a mobile app?**
No, and none is planned. It's a responsive web app, installable to a home screen via the browser in a future PWA update.

**What does the roadmap look like?**
Google Sheets live sync is the next major feature after v1 ships (see Roadmap above). Streaks and multiple goal profiles are also under consideration.

**How is this different from MyFitnessPal or similar apps?**
No food database, no login, no ads, no subscription, and no server ever sees your data. It trades food-search convenience for speed and privacy.

**What does it not do?**
No food lookup, no barcode scanning, no macro tracking beyond calories/protein, no accounts, no automatic multi-device sync (yet).

**How do I get help or report a bug?**
Via the project's GitHub Issues page (see README).

**Why should stakeholders care about this project?**
It demonstrates a fully serverless, zero-cost-to-operate product (no hosting bill beyond static file serving) that still solves a real, narrow user need well; success is measured by usage and community contribution, not revenue.

## Documentation Process (how these docs are maintained)

- Documentation lives exclusively in three files: root [README.md](../README.md) (developer-facing setup/run instructions) and `docs/PRD.md` (this file) and `docs/DESIGN.md` (visual/UX system), plus `docs/PATCHNOTES.md` (dated changelog). No other documentation files should be created. If new information doesn't fit one of these three, it belongs as a new section within one of them, not a new file.
- Every change to the codebase that affects product scope, design system, or user-facing behavior must be accompanied by a corresponding update to the relevant doc(s) in the same change, plus a new dated entry in `PATCHNOTES.md`.
- Before any documentation audit, the codebase must be crawled in full first (all files, features, routes/views, config) and compared line-by-line against each doc; docs are then rewritten to match the code's actual current state, not the other way around: code is the source of truth.
- `README.md` must never contain marketing language; it is strictly developer setup/run/deploy instructions with a link to `/docs` for everything else.
- Writing style: no em dashes (neither the literal `—` character nor the `&mdash;` HTML entity) and no double-dash (`--`) used as punctuation anywhere in these docs or the app's HTML. See the Writing Style section below for the replacement methodology. This does not apply to CSS custom property names like `--accent`, which are valid CSS syntax, not punctuation.

## Writing Style

All documentation and user-facing HTML text in this project avoids em dashes in both forms it can appear in: the literal Unicode character (—) and the HTML entity (`&mdash;`). Both are treated as prohibited, since a search for one will not catch the other. Double dashes (`--`) used as punctuation are likewise avoided; this does not apply to CSS custom properties such as `--accent` or `--bg`, which are valid CSS variable syntax, not punctuation, and must be left untouched.

When rewriting a sentence that used an em dash, the replacement is chosen based on context, not applied mechanically:

- **Comma**: the default, most natural replacement in most cases; keeps a sentence flowing without drawing attention to the punctuation itself.
- **Colon**: used when introducing a list, explanation, or elaboration after a complete clause.
- **Semicolon**: used when joining two closely related independent clauses that could each stand alone as a sentence.
- **Parentheses**: used for a true aside, supplementary information that isn't central to the sentence's main point.
- **Period**: used when the cleanest fix is splitting one long sentence into two; shorter sentences are frequently clearer anyway.

Any future contributor (human or AI) editing these docs or the app's HTML should apply this same methodology rather than reintroducing em dashes, and should periodically re-run a search for both forms plus stray `--` punctuation as part of a documentation or content pass.
