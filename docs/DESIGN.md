# ProteinPulse: Design System

## Design Philosophy

Legibility first, hierarchy second, color only when it adds meaning. ProteinPulse is a data-entry tool, not a marketing surface: the day's numbers (calories, protein, remaining budget) should be the loudest thing on screen. The palette is a VS Code Dark+ inspired set of layered greys rather than flat black, giving the page visible depth (page, card, raised input) without introducing decoration. Motion is kept minimal so nothing competes with the numbers for attention.

## Color Palette

Dark-mode only. All colors are CSS custom properties on `:root` (see [css/styles.css](../css/styles.css)).

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#1e1e1e` | Page background (VS Code editor grey, not black) |
| `--surface` | `#252526` | Card / section backgrounds, ring track hole |
| `--surface-raised` | `#2d2d2d` | Inputs, table header row |
| `--surface-alt` | `#292929` | Alternating table row stripe |
| `--header-bg` | `#333333` | Top header bar, one tier lighter than cards |
| `--border` | `#3c3c3c` | Hairline dividers, input borders, card borders |
| `--text` | `#d4d4d4` | Primary text, headings, key numbers (VS Code default text grey, ~11:1 contrast on `--bg`) |
| `--text-muted` | `#9a9a9a` | Labels, captions, secondary stats |
| `--accent` | `#0018f9` | Solid fills only: button background, progress ring stroke. Deliberately deep/saturated; only ever paired with white text on top, never used as text itself |
| `--accent-text` | `#6b87ff` | Brighter blue used anywhere accent color appears as text: ring labels, active tab, accent-colored table values, focus outline. ~5.2–6:1 contrast against `--bg`/`--surface`, chosen specifically because the deep `--accent` measured only ~2.3:1 as text and failed legibility |
| `--accent-dim` | `rgba(0, 24, 249, 0.18)` | Accent-tinted backgrounds |
| `--accent-secondary` | `#e8a33d` | Protein's contrasting color: ring, label, and remaining-total value. Warm amber, blue's complement on the color wheel, ~7.7:1 contrast |
| `--accent-secondary-dim` | `rgba(232, 163, 61, 0.18)` | Amber-tinted backgrounds |
| `--danger` | `#ff5c5c` | Delete affordance hover state |
| `--success` | `#3ddc97` | Completed roadmap status, on-track states |

Calories are always blue (`--accent-text` for text, `--accent` for the ring fill); protein is always amber (`--accent-secondary`). This pairing is deliberate: the two macros must be visually distinguishable at a glance without reading labels, and warm/cool is a stronger distinction than two shades of one hue.

**Why two blue tokens exist**: a single `--accent` cannot serve both purposes at once. As a large fill (button background, ring arc) `#0018f9` easily clears contrast requirements with white text on top. As small text on a dark background, that same deep blue only reaches ~2.3:1, well under the 4.5:1 AA minimum. Rather than compromise the brand blue's saturation everywhere, `--accent-text` exists specifically for text-role usage. Any new UI element must decide which role it's playing (fill vs. text) and pick the matching token; never use `--accent` as a `color:` value.

## Typography

System font stack only (`-apple-system, "Segoe UI", Roboto, sans-serif`): no webfonts, no network requests.

| Role | Size | Weight | Line height |
|---|---|---|---|
| H1 (page title) | 20px | 700 | 1.2 |
| H2 (section label) | 13px, uppercase, letter-spacing 0.05em | 600 | 1.2 |
| Body | 14px | 400 | 1.5 |
| Key number (ring center, totals) | 28–36px via `clamp()` | 700 | 1.1 |
| Caption (e.g. "0 kcal / 2500 kcal") | 12px | 400 | 1.4 |
| Label (form labels) | 12px | 500 | 1.4 |
| Table cell | 13px | 400 (600 for the value column) | 1.5 |
| Code / monospace (export filenames, etc.) | 13px, `ui-monospace` | 400 | 1.4 |

## Spacing System

4px base unit. Common increments: 4, 8, 12, 16, 20, 24, 32, 48px. Card padding is 24px; cards and tables carry a 20px `margin-bottom` so stacked sections read as distinct panels. Max content width 1200px, centered, with 24px horizontal padding on the container (16px below 700px).

## Breakpoints

| Breakpoint | Change |
|---|---|
| `≥ 1023px` | Full desktop layout: three-stat row (Calories ring / kcal-today / Protein ring) side by side |
| `700px – 1022px` | Stat row wraps to a 2-column grid; log-entry form fields stack to full width above the button |
| `≤ 699px` | Single column throughout; rings shrink; tab bar (Today/Week/Month/Year) becomes equal-width flex items instead of centered links; table cell padding tightens from 12px to 10px; chart height shrinks from 140px to 110px and `.chart-nav` buttons/label shrink to fit |

All grid tracks that could contain wide content use `minmax(0, 1fr)`, never a bare `1fr`, to prevent content from forcing horizontal page overflow. Flex children wrapping scrollable content get `min-height: 0` so they scroll internally instead of pushing the page taller/wider than intended.

## Component Patterns

- **Cards** (`.card`): `--surface` background, `--border` 1px border, 10px border radius, 24px padding, 20px bottom margin. Used for the stat row, log-entry form, entry list, goal editor, and data import/export section.
- **Tables** (`.data-table`): real `<table>` elements, not styled `<div>` rows. `--surface` background with `--surface-alt` alternating row stripes, `--surface-raised` header row, right-aligned value columns, 10px border radius with `overflow: hidden` to clip the corners.
- **Progress rings**: conic-gradient circle, `--border` track, `--accent` (calories) or `--accent-secondary` (protein) progress arc, `--surface` punched center so the ring reads as a distinct layer against the card behind it, percentage centered in `--text`, label below in `--accent-text` / `--accent-secondary`.
- **Buttons**: primary action (`.btn-primary`, e.g. `+ Add to Today`, `Save Goal`) is solid `--accent` fill with white text, full-width, 0.9 opacity on hover. Secondary actions (`.btn-secondary`, e.g. Export/Import) use `--surface-raised` with a `--border` outline that switches to `--accent-text` on hover. Delete actions (`.btn-delete`) are outlined and turn `--danger` on hover.
- **Inputs**: `--surface-raised` background, `--border` 1px border, `--accent-text` border/focus ring on focus, `--text-muted` placeholder.
- **File input**: visually hidden (`opacity: 0`, absolutely positioned) inside a `.btn-secondary`-styled `<label>` so file choosers match the rest of the button system instead of the browser default control.
- **Tabs (Today/Week/Month/Year)**: text buttons, active tab colored `--accent-text` with a matching underline.
- **Header** (`.topbar`): its own `--header-bg` tier, one step lighter than the page background, so it reads as a distinct bar rather than blending into the page.
- **Itemized entry list**: a `.data-table` with Date, Item, Macros, and a Delete action column; empty state shows centered `--text-muted` text ("No entries logged yet").
- **Roadmap**: a `.data-table` with Milestone and Status columns; status is a pill (`.roadmap-status`) colored by state (`--success` for Complete, `--surface-raised` neutral for Planned/Deferred).
- **Header Support link**: an outlined pill-style link (`.support-link`) sitting to the left of the Goal summary inside `.header-right`, opens in a new tab since it leaves the app.
- **Footer**: centered, muted, one line ("Built by Azqato", linking to https://azqato.com/), separated from the roadmap by a `--border` top rule; the only accent-colored element on the page that isn't functional app data.
- **Charts** (`.chart-wrap`): a `.card`-like panel (same `--surface`/`--border`/10px radius) wrapping a Canvas bar chart (`js/charts.js`). Calories render in `--accent`, protein in `--accent-secondary`, matching the rings and tables; the calorie:protein ratio overlays as a `--text`-colored line. A layer of invisible, focusable `.chart-hotspot` buttons sits over the canvas, one per bar-group, so exact values are reachable via keyboard focus (not just mouse hover) through a `.chart-tooltip` popover. A visually-hidden text summary (`.visually-hidden`) gives screen readers the same data the chart shows visually; the chart is always a supplement to the data table beneath it, never a replacement.
- **Chart navigation** (`.chart-nav`): Prev/Next `.btn-secondary` buttons flanking a centered label (e.g. "July 2026"), used above the Month and Year charts to page between periods. The Week view has no navigation since it's always a fixed rolling 7-day window relative to today.
- **Modal** (`.modal-backdrop` / `.modal`): a `--surface` panel over a semi-transparent scrim, used by `js/modal.js` (`confirmModal()`/`alertModal()`) in place of native `window.confirm`/`window.alert`, so the import flow's dialogs match the rest of the design system. Traps focus while open, closes on Escape, and returns focus to the triggering element on close.
- **Visually-hidden utility** (`.visually-hidden`): the standard clip-based pattern (1px box, clipped, not `display: none`) for content meant for screen readers only, such as chart summaries.
- **Landing page** (`landing.html`, `css/landing.css`): the only page in the project with an editorial rather than utilitarian layout, since its job is to sell and explain rather than log data. Reuses every token and most components from `styles.css` (`.card`, `.btn-primary`/`.btn-secondary`, `.ring`/`.stat-row` as a static hero visual, `.site-footer`) so it never introduces a new color or a one-off component; `landing.css` only adds layout for sections that don't exist in the app (hero, numbered steps, feature grid, tenet list, FAQ). Linked from the app via an "About" link in `.header-right`, and links back to the app via "Open ProteinPulse" CTAs.

## Accessibility Standards

Targets WCAG 2.1 AA. `--text` (`#d4d4d4`) on `--bg` (`#1e1e1e`) measures roughly 11:1. `--accent-text` (`#6b87ff`), the token used for all blue text, measures roughly 5.2–6:1 against both `--bg` and `--surface`, comfortably above the 4.5:1 minimum for normal text; the original `--accent` (`#0018f9`) is never used as a `color:` value because it only reaches ~2.3:1 there. `--accent-secondary` (`#e8a33d`) measures roughly 7.7:1. Status is never color-only: over/under goal states pair color with a text label (e.g. "2400 kcal remaining", not just a colored number), and calories/protein are distinguished by both color (blue vs. amber) and label text, not color alone. All interactive elements are native `<button>`/`<input>`/`<a>`/`<label>` for built-in keyboard and screen-reader support; visible focus ring uses `--accent-text` at 2px outline, never `outline: none` without a replacement. Charts are supplemented, not replaced, by a visually-hidden text summary and a row of keyboard-focusable hotspot buttons, since a `<canvas>` element itself is not natively accessible. The modal (`js/modal.js`) traps Tab focus within its buttons while open and restores focus to the triggering element on close, so it never leaves a keyboard user stranded behind an invisible backdrop.

## Animation & Motion

Functional only: 0.15s ease transitions on hover/focus/active states for buttons, tabs, and inputs. No page-load animations, no decorative motion.

## Notes for future contributors / AI models

- This is a static, no-build, vanilla HTML/CSS/JS site; there is no CSS preprocessor and no component framework. Keep styles in plain CSS custom properties as shown above.
- Color additions should stay inside the palette table above; don't introduce new one-off hex values in component CSS.
- When adding a UI element that uses the brand blue, decide fill vs. text first and pick `--accent` or `--accent-text` accordingly; see "Why two blue tokens exist" above.
- Any new page/view must be checked at all breakpoints listed above before merging.
- The favicon and header logo are the 💪🏼 emoji: the favicon is an inline SVG data URI (`<link rel="icon" href="data:image/svg+xml,...">` in `index.html`) rather than a binary image file, keeping the project dependency-free.
- Charts are hand-rolled Canvas drawing (`js/charts.js`), not a vendored charting library, per Tenet 6 (no dependency that needs a build step). Any future chart change should stay inside that file's plain Canvas 2D calls rather than introducing a charting package.
