# Patch Notes

## v2.0.2 - 2026-09-29

### Added
- Open Graph and Twitter Card tags (title, description, absolute URL, type, site name, summary card) on all three pages, with matching meta descriptions.
- Each app screen now sets the browser tab title: Today shows "ProteinPulse", and History, Goal, and More show "History - ProteinPulse" and so on.
- LICENSE.md: the project is MIT licensed. Vendored SheetJS keeps its Apache-2.0 licence.
- robots.txt (fully open, with the sitemap), for use if the project moves to its own domain.
- .gitattributes pins LF line endings and marks /vendor as vendored.
- docs/TODO.md, the author's ideas list, now allowed by the Documentation Process.

### Changed
- Page titles: the landing page is now "About - ProteinPulse" and the roadmap is "Roadmap - ProteinPulse" (previously "ProteinPulse: two numbers, every day" and "ProteinPulse: Roadmap").
- vendor/README.md now describes SheetJS as vendored, replacing a note that said it would be added in v0.3.0.
- PRD: recorded the author's answers to the Project Defaults questions and marked the Documentation Versus Reality rows resolved.

## v2.0.1 - 2026-09-29

### Added
- Added standing rules to docs/PRD.md from a Project Defaults run: Browser Testing (headless Microsoft Edge), Verification Environment, Testing Cadence, Repository Hygiene, Licensing, Social Sharing Tags, Page Titles, Deprecation and Removal, Documentation Versus Reality, Working Practice, and a Project Defaults Setup record. Where the project already had a rule (writing style, local testing before push, the breakpoint check before merging, the four-document limit), it was kept.
- Added a Verification Checklist and a Feature Breakdown per Milestone heading under the PRD Roadmap, and Environment Variable Reference and Test Browser sections under the Runbook.
- Added placeholder headings for Conventions and Risks and Open Questions, to be filled by a full Documentation run.
- Added Breakpoints and Animation and Motion sections to docs/DESIGN.md, which the v2.0.0 rewrite had left out.
- Added sitemap.xml at the root listing the three public pages.

### Changed
- Rewrote README.md for a general reader (what ProteinPulse is, the live link, what it offers, who it is for, status, and where to learn more). Install and run steps now live only in the PRD Runbook.
- Changed the Documentation Process rule for README.md to match. The old wording was "`README.md` must never contain marketing language; it is strictly developer setup/run/deploy instructions with a link to `/docs` for everything else."

## v2.0.0 - 2026-09-29

### Changed
- Rebuilt the whole interface as a mobile app-style shell. On phones it fills the screen, respecting safe areas. On desktop it sits in a centered phone frame with a side panel of shortcuts and links, and a Fullscreen button (or `F`) switches to a window-filling layout with a centered 640px column; the choice is remembered per browser.
- Replaced the top header and Today/Week/Month/Year tabs with a bottom tab bar: Today, History, Goal, More, plus a raised + button. Screens are hash-routed (`#/today` etc.) so browser back/forward work.
- Today: concentric calorie/protein rings showing kcal left, per-macro progress bars with "left" and percent, the ratio, and an entry list with timestamps.
- Logging moved to a bottom sheet with large numeric-keypad fields, drag-to-dismiss, and inline validation.
- History: Week/Month/Year segmented control, summary tiles (average calories and protein, days logged, protein-goal days), and expandable day rows with mini goal bars. Expanded rows now stay open after a delete.
- Charts now plot percent of goal with a dashed goal line, use rounded gradient bars, support tap-to-inspect on touch, and re-render through `ResizeObserver`.
- Goal editor moved to its own tab, showing the current goal, the target ratio, and goal history. Export/Import moved to More; Import is now a single tap that opens the file picker, then asks for confirmation.
- New palette: layered near-black surfaces, blue/amber gradients, tabular numbers. Landing and roadmap pages redesigned to match (phone mockup hero, `<details>` FAQ, grouped roadmap).

### Added
- Recent chips in the log sheet refill a past entry's numbers and label in one tap (drawn from your own history; no food database).
- Undo toast after adding or deleting an entry.
- Keyboard shortcuts: `N` log entry, `1` to `4` switch tabs, `F` toggle fullscreen (desktop), `Esc` close.
- Home-screen meta tags (`theme-color`, `apple-mobile-web-app-capable`).

### Removed
- `totalsForMonth()` in `storage.js`, replaced by a one-pass per-date index in `app.js`.

## v1.2.0 - 2026-07-06

### Added
- Added entry deletion from the Week and Month views: clicking a date row expands it in place into that day's itemized entries (label, macros, delete button), reusing the same delete affordance as the Today view. Deleting collapses the row and re-renders the whole parent view, the same pattern the Today view already used after any mutation.
- Added a drill-down path from the Year view: since Year rows are month-aggregated (not entry-level), clicking a month row jumps to the Month view for that month instead of expanding in place, where entry-level deletion then happens.
- Added `roadmap.html`: the Roadmap table, previously the last section of `index.html`, now lives on its own page. Added a Version column to the table so every milestone cites the patch note it shipped in (or `TBD` for unscheduled deferred items), not just the ones that happened to have a version number in their title already.
- Added a shared five-link site navigation (About, App, Roadmap, GitHub, Support), rendered identically in `.header-right` across `index.html`, `landing.html`, and `roadmap.html`.
- Added a clickable "ProteinPulse" wordmark in the header, linking to the About page, on all three pages.

### Changed
- Reworked header links from a single muted style (`.support-link`, always `--text-muted`) into `.nav-link`, defaulting to high-contrast `--text` with a `.nav-link.active` state in `--accent-text` (blue) for whichever page you're on, matching the convention the Today/Week/Month/Year tabs already used.
- Changed the "Free and open source" tagline on `landing.html` from the muted `.today-date` class to a new `.landing-tagline` class set to `--text`, since it was reported hard to read; verified the "Protein" half of the wordmark is already on `--text` (~11:1 contrast) and needed no change.
- Extracted the Today/Week/Month/Year tab-switching logic into a single `switchToView(viewKey)` function in `js/app.js`, reused by both the tab buttons and the new Year-to-Month drilldown links.

### Removed
- Removed the "Goal: X kcal / Yg protein" summary from the header's top-right; the same numbers are already visible in the Today view's ring captions, totals table, and remaining-budget rows.

### Fixed
- Fixed switching back to the Today tab not refreshing its numbers after an entry was deleted from a different view (e.g. an expanded Week row); `switchToView()` previously only re-rendered Week/Month/Year, never Today, since Today had always been re-rendered directly by its own form/delete handlers until entries could now be deleted from elsewhere.

## v1.1.2 - 2026-07-05

### Added
- Added "Move Roadmap out of the app into its own page" to the roadmap: the Roadmap table currently sits at the bottom of `index.html`, below every logging view. Planned: remove it from the app and give it a dedicated page (e.g. `roadmap.html`), linked from the site navigation instead.

## v1.1.1 - 2026-07-05

### Fixed
- Fixed the live roadmap table in `index.html` still showing "Landing page" as Planned; v1.1.0's patch notes claimed this was updated but the table markup itself was never actually changed. `docs/PRD.md`'s table was correct; `index.html`'s was not.

### Added
- Added "Header contrast and navigation pass" to the roadmap: the header links on both pages currently share one muted, low-contrast style regardless of which page you're on. Planned rework: default links in `--text` (higher contrast) with the current page highlighted in `--accent-text` (blue), matching the existing Today/Week/Month/Year tab pattern. Also covers the "Free and open source" tagline on `landing.html` (currently `--text-muted`, reported hard to read) and a re-check of the "Protein" half of the wordmark for the same complaint.

## v1.1.0 - 2026-07-05

### Added
- Added `landing.html` and `css/landing.css`: a separate marketing/educational overview page (hero, problem statement, three-step how-it-works, feature grid, tenets, and a short FAQ), distinct from the app itself. Reuses every color token and most components from `css/styles.css` (cards, buttons, the ring/stat-row visual, footer) rather than introducing new ones.
- Added an "About" link to the app's header (`.header-right`, left of the existing Support link) pointing to `landing.html`; the landing page links back via "Open ProteinPulse" calls to action.
- Added "Entry deletion from Week/Month/Year views" to the roadmap as the next planned item after this release: today, deleting an entry is only possible from the Today view's itemized list.

### Changed
- Marked the Landing Page milestone Complete in the roadmap table (PRD.md and the live table in index.html).
- Changed the "Built by Azqato" footer link (index.html and landing.html) from the GitHub profile to https://azqato.com/, opening in a new tab since it leaves the site.

## v1.0.1 - 2026-07-05

### Fixed
- Fixed the import-confirmation modal (`.modal-backdrop`) rendering visibly on every page load instead of staying hidden. The `.modal-backdrop { display: flex; }` rule (an author-stylesheet class selector) was overriding the browser's default `[hidden] { display: none; }` rule (a same-specificity user-agent selector), since author styles always win ties with user-agent styles. Since the backdrop is `position: fixed`, this showed up as an empty grey box floating in the center of the viewport at all times. Added an explicit `.modal-backdrop[hidden] { display: none; }` rule so the `hidden` attribute is respected again.

## v1.0.0 - 2026-07-05

### Added
- Manually audited every view (Today, Week, Month, Year) at all three DESIGN.md breakpoints (mobile, tablet, desktop): confirmed zero horizontal overflow via an automated headless-browser check comparing `scrollWidth` to `clientWidth` at each width.
- Ran a manual accessibility pass in place of an automated Lighthouse run (no Node.js/CI tooling in this project): keyboard-only navigation through every interactive element, a screen-reader-oriented review of labels and landmarks, and added `aria-label`s to the new month/year Prev/Next buttons for clarity beyond their arrow glyphs.
- Added `js/modal.js`: an in-app confirm/notice modal (`confirmModal()`/`alertModal()`) styled to match the rest of the design system, with focus trapped inside the modal while open, Escape-to-close, and focus restored to the triggering element on close.
- Replaced the import flow's native `window.confirm`/`window.alert` calls with the new modal.
- Lazy-loaded the vendored SheetJS library: `vendor/xlsx.full.min.js` is now injected as a `<script>` tag only on the first Export or Import click, instead of loading unconditionally on every page load.

### Changed
- Marked v0.5.0, v0.6.0, and v1.0.0 Complete in the roadmap table; added a Landing Page milestone and reordered the deferred items to sit after it.
- Documentation (PRD.md, DESIGN.md) fully re-audited against the live app: folder structure, API description, state management, and Known Technical Debt all rewritten to match the actual shipped v1.0.0 code rather than the earlier planning-stage text.

### Fixed
- N/A for this release; see v0.5.0 and v0.6.0 below for the feature work that preceded this hardening pass.

## v0.6.0 - 2026-07-05

### Added
- Built the Year view: a `.data-table` rollup with one row per month (Month, Calories, Protein, Ratio), aggregated from daily totals via a new `totalsForMonth()` helper in `js/storage.js` so the Year view shares the exact same definition of a "total" as Today/Week/Month.
- Added a Year tab to the main navigation, wired into the existing `views` map and `.tab[data-view]` click handler.
- Added a Year chart (via the `js/charts.js` helper from v0.5.0) showing calories and protein per month, with the calorie:protein ratio as a line overlay.
- Added prior/next year navigation (`.chart-nav` with Prev/Next buttons and a year label) to the Year view; the "Next" button disables once you're back at the current year, since the app has no future data to show.
- Added prior/next month navigation to the Month view (previously locked to the current calendar month), closing the "no month/day navigation" item from PRD.md's Known Technical Debt.

## v0.5.0 - 2026-07-05

### Added
- Added `js/charts.js`: a hand-rolled Canvas bar-chart renderer (no vendored charting library, per Tenet 6), reading its colors directly from the app's CSS custom properties so charts always match the current palette.
- Added a chart above the Week view's table: dual bars for calories (blue) and protein (amber), with the calorie:protein ratio as a line overlay.
- Added a matching chart to the Month view, confirming the chart helper generalizes to a variable-length (28-31 day) axis.
- Made chart data keyboard-accessible: each bar-group has an invisible, focusable hotspot button showing an exact-value tooltip on hover or keyboard focus, not mouse-hover only.
- Added a visually-hidden text summary alongside each chart for screen readers; the existing data table beneath each chart remains the primary accessible data source, with the chart as a visual supplement rather than a replacement.

## v0.4.1 - 2026-07-05

### Added
- Added a site footer, "Built by Azqato" linking to https://github.com/Azqato, matching the footer pattern used on azqato.github.io.
- Added a Support link (opens https://azqato.github.io/support.html in a new tab) to the header's grey area, to the left of the Goal summary.

### Changed
- Restructured the header into a `.header-right` wrapper containing the Support link and the Goal summary side by side, so Support sits directly beside the goal text rather than in the Today/Week/Month tab bar.
- Scoped the tab-switching click handler to `.tab[data-view]` instead of every `.tab`, so non-view elements that reuse tab-like styling (like the Support link, before it moved to the header) can't accidentally hide every view.

## v0.4.0 - 2026-07-05

### Added
- Built Week and Month views: `.data-table` rollups showing date, calorie total (with goal if one applies), protein total (with goal), and the calorie:protein ratio for every day in the range. Week shows the last 7 days; Month shows every day so far in the current calendar month.
- Added a calorie:protein ratio (calories per gram of protein, e.g. "12.5:1") to the Today view's totals table and as a column on the Week/Month tables; displays "N/A" when protein is zero instead of dividing by zero.
- Added a Date column to the itemized entry list so each logged entry shows the day it was logged on, in addition to its label and macros.
- Added roadmap milestones for v0.5.0 (graphs for the Week and Month views) and v0.6.0 (a Year view), both planned, not yet built.

### Changed
- Marked v0.1.0 through v0.4.0 and the branding milestone as Complete in the roadmap table (docs/PRD.md and the live table in index.html).

## v0.3.0 - 2026-07-05

### Added
- Vendored the real SheetJS library (`vendor/xlsx.full.min.js`, downloaded from the official SheetJS CDN) to replace the placeholder README that had been sitting in `/vendor` since v0.0.1.
- Implemented `exportToWorkbook()` and `importFromWorkbook()` in js/xlsx-io.js: export writes a two-sheet workbook (Entries, Goals) via `XLSX.writeFile`; import reads a selected `.xlsx` file, validates both sheets are present, and resolves parsed entries/goals or rejects with a descriptive error.
- Added an Export/Import card to the Today view: an Export button, a styled file-choose control, and an Import button that confirms with the user (native `window.confirm`) before overwriting local storage, since import is a full-replace operation.
- Verified the export/import round-trip logic (json_to_sheet → XLSX.write → XLSX.read → sheet_to_json) with an automated headless-browser test confirming entry counts, calorie values, labels, and goal values all survive the round trip unchanged.

## v0.2.0 - 2026-07-05

### Added
- Implemented the carry-forward goal model in js/storage.js: `resolveGoalForDate()` finds the latest goal with an effective date on or before the date being viewed; `upsertGoal()` replaces the goal for a given effective date instead of duplicating it.
- Added a Goal editor card to the Today view: setting a calorie/protein goal takes effect from today forward and is reflected immediately in the header's goal summary, the rings, and the totals table.
- Verified carry-forward behavior with an automated test: a goal set on an earlier date still applies to dates before a later goal change, and applies the newer goal from its effective date onward.

## v0.1.0 - 2026-07-05

### Added
- Made the Today view fully functional: the Log Entry form (Calories, Protein, optional Label) now submits real entries to local storage instead of being disabled placeholder controls.
- Implemented js/storage.js: `loadEntries()`/`saveEntries()`, `loadGoals()`/`saveGoals()`, `generateId()` (using `crypto.randomUUID()` with a manual fallback for unsupported/insecure contexts), and date helpers (`todayStr()`, `dateToStr()`).
- Implemented js/app.js: renders the calorie/protein rings, kcal-today readout, totals table, and remaining-budget row from real entry data; renders an itemized, deletable entry list for the current day; wires up Today/Week/Month tab switching.
- Verified date formatting and ID generation with an automated headless-browser test covering `dateToStr()` output and uniqueness of generated entry IDs.

### Changed
- Marked v0.1.0 Complete in the roadmap table.

## v0.0.2 - 2026-07-05

### Added
- Adopted the 💪🏼 emoji as the site's favicon (inline SVG data URI, no binary asset) and as a logo mark in the header next to the ProteinPulse wordmark.
- Converted the Today view's flat totals rows and the roadmap list into real `<table>` elements with alternating grey row stripes and a raised header row, replacing the earlier `<div>`-based rows and `<ul>`-based roadmap.
- Wrapped the stat row, log-entry form, and entry-list placeholder in `.card` panels (bordered, rounded, raised surface) so the page reads as distinct layered panels.

### Changed
- Replaced the near-black `#000000`/`#0d0d0d` palette with a VS Code Dark+ inspired grey scale (`--bg: #1e1e1e`, `--surface: #252526`, `--surface-raised: #2d2d2d`, `--text: #d4d4d4`) after feedback that the original background was too dark and the palette wasn't "artistically designed."
- Gave the top header its own `--header-bg` (`#333333`) tier instead of blending into the page background.
- Split the blue accent into two tokens after feedback that blue and white text weren't legible enough: `--accent` (`#0018f9`, deep saturated blue) stays reserved for solid fills like the primary button and ring arc; a new `--accent-text` (`#6b87ff`) is used everywhere blue appears as text (ring labels, active tab, accent-colored values, focus outline), since the deep blue measured only ~2.3:1 contrast as text against the dark background versus ~5.2–6:1 for the brighter token.
- Replaced the teal secondary accent (`#22c9a3`) with a warm amber (`#e8a33d`, `--accent-secondary`) for the protein ring/label/value, chosen as blue's complementary color for a stronger visual split between calories and protein, and to better match the muted, desaturated accent tones typical of VS Code themes.

## v0.0.1 - 2026-07-05

### Added
- Created initial project documentation: root README.md, docs/PRD.md, docs/DESIGN.md, docs/PATCHNOTES.md.
- Defined the product scope for ProteinPulse: a serverless, vanilla HTML/CSS/JS calorie and protein tracker with no accounts and no food database.
- Defined the data model: itemized Entry records (with optional label) and a carry-forward Goal model, both designed to map directly to flat spreadsheet rows for future .xlsx export/import.
- Defined the design system: dark-mode-only palette built around #0018F9 (accent) and #ffffff (primary text), adapted from the structure of the referenced net-worth-tracker DESIGN.md.
- Established a documentation process: exactly three docs (README, PRD, DESIGN) plus PATCHNOTES, code as source of truth, and a no-em-dash writing style policy (covering both the literal character and the &mdash; entity, excluding CSS custom properties like --accent).
- Built the v0.0.1 template scaffold: index.html, css/styles.css, and stub js/app.js, js/storage.js, js/xlsx-io.js files, matching the design system with placeholder (disabled) log-entry controls and a roadmap section listing every upcoming milestone with its status.
- Added a vendor/ folder with a placeholder README noting the SheetJS library will be vendored there in v0.3.0.

### Changed
- N/A - no prior documentation existed.

### Fixed
- Removed em dashes (both the literal character and the &mdash; entity) and stray double-dash punctuation that had been introduced across README.md, docs/PRD.md, and docs/DESIGN.md while those files were first being written, replacing each with the comma, colon, semicolon, parentheses, or period called for by context, per the Writing Style methodology documented in docs/PRD.md.

### Removed
- N/A - no prior documentation existed.
