# ProteinPulse: Design System

## Design Philosophy

ProteinPulse looks and behaves like a native phone app, and runs in any browser. The day's two numbers (calories and protein, against goal) are the loudest thing on screen; everything else is one tap away. Surfaces are layered near-blacks, so depth comes from tone rather than borders. Motion is short, springy, and always tied to a state change (a ring filling, a sheet sliding up, a row appearing), and is disabled under `prefers-reduced-motion`.

## App Shell

- **Mobile (< 640px wide)**: the app fills the viewport (`100dvh`), respecting safe-area insets (`viewport-fit=cover`).
- **Desktop, framed (default)**: the app renders inside a centered 420px device frame (44px radius, bezel ring, blue ambient glow). At 1080px and wider, a `.desk-aside` panel beside it shows the wordmark, tagline, keyboard shortcuts, and the five site links.
- **Desktop, fullscreen (optional)**: a `.layout-toggle` button (top right, 640px and wider only, or the `F` key) adds `html.layout-full`. The app then fills the window with screens, tab bar, sheet, and toast held to a centered 640px column (`--col` / `--col-pad`). The choice is saved in `localStorage` under `proteinpulse_layout` as a per-browser preference, not app data, and an inline head script applies it before first paint so the page never flashes the wrong layout.
- **Screens**: Today, History, Goal, More. Each is an independently scrolling `.screen`, routed by URL hash (`#/today`, `#/history`, `#/goal`, `#/more`) so browser back/forward work.
- **Tab bar** (`.tabbar`): fixed to the bottom, translucent blur, four tabs plus a raised center **+** button (`.fab`) that opens the log sheet. The active tab uses `aria-current="page"` and `--accent-text`.
- **Navbar** (`.navbar`): each screen has a large 34px title; once it scrolls away a compact sticky title bar fades in with a blurred background.

## Color Palette

Dark mode only. All tokens are on `:root` in [css/styles.css](../css/styles.css).

| Token | Value | Use |
|---|---|---|
| `--bg` | `#050507` | Page backdrop (desktop, site pages) |
| `--app-bg` | `#0b0b0f` | App background |
| `--surface` | `#15151b` | Cards, lists, sheet |
| `--surface-2` | `#1d1d25` | Inputs, chips, expanded rows, modal |
| `--surface-3` | `#292932` | Progress tracks, active segment, pressed states |
| `--separator` | white 7% | Hairlines between rows, card edges |
| `--border` | white 10% | Input and chip outlines |
| `--text` | `#f4f4f7` | Primary text and key numbers |
| `--text-2` | `#a6a6b3` | Secondary text (~7:1 on `--surface`) |
| `--text-3` | `#8c8c99` | Tertiary text, inactive tabs, chart labels (~5.3:1) |
| `--accent` | `#0018f9` | Brand blue, **fill only** (buttons, FAB, ring and bar gradients). Never a text color (~2.3:1) |
| `--accent-hi` | `#4f6bff` | Light end of calorie gradients |
| `--accent-text` | `#7d95ff` | Blue as text: active tab, links, calorie values, focus ring (~6.6:1) |
| `--accent-soft` | blue 24% | Calorie ring track, blue icon tiles |
| `--protein` | `#f2a93b` | Protein: ring, bars, values (~9:1) |
| `--protein-hi` | `#ffc873` | Light end of protein gradients |
| `--protein-soft` | amber 20% | Protein ring track, amber icon tiles |
| `--danger` | `#ff6b6b` | Delete hover, "kcal over" |
| `--success` | `#3ddc97` | Current-goal pill, shipped milestones, privacy icon |

Calories are always blue and protein is always amber, everywhere. Status is never color-only: over-goal states say "over" in text.

## Typography

System font stack only (`system-ui, -apple-system, "Segoe UI", Roboto`), no webfonts. All numbers use `font-variant-numeric: tabular-nums` (`.num`) so they don't jitter as they change.

| Role | Size / weight |
|---|---|
| Large screen title | 34px / 800, -0.03em |
| Ring center number | clamp(30px, 9vw, 40px) / 800 |
| Metric, tile, goal values | 24 to 32px / 800 |
| Section head | 20px / 700 |
| Body, row titles | 15px / 400 to 600 |
| Captions, row subtitles | 13px / 500 to 600 |
| Eyebrows, tile labels | 12 to 13px / 600, uppercase |

## Spacing and Radii

4px base. Screen gutter 16px (12px under 360px). Cards 20px padding, 16px bottom margin. Radii: `--r-sm` 10, `--r-md` 14 (inputs, buttons), `--r-lg` 22 (cards, lists), `--r-xl` 28 (sheet). Touch targets are at least 40px, primary buttons 50px.

## Breakpoints

| Breakpoint | Change |
|---|---|
| `< 360px` | Screen gutter shrinks from 16px to 12px, the large title to 30px, the metric gap to 14px, and the log sheet's number inputs to 26px |
| `< 640px` | Mobile: the app fills the viewport; the layout toggle is hidden |
| `≥ 640px` and `≥ 700px` tall | Desktop, framed (default): 420px device frame; the Fullscreen toggle appears (it shows from 640px wide at any height) |
| `≥ 700px` | Fullscreen layout, when chosen: content held to a 640px centered column |
| `≥ 1080px` and `≥ 700px` tall | Framed layout adds the `.desk-aside` side panel |
| `< 720px` (site pages) | `landing.html` and `roadmap.html` move the nav to a horizontally scrolling row under the wordmark |

Grid tracks that could hold wide content use `minmax(0, 1fr)`, never a bare `1fr`, so content never forces horizontal page overflow.

## Component Patterns

- **Rings** (Today): one SVG with two concentric arcs (outer calories r=86, inner protein r=62), `pathLength="100"` so progress is `stroke-dasharray: pct 100`. Gradient strokes with a soft glow, animated on change. The center shows kcal left (or "kcal over", or "kcal eaten" with no goal). The wrapper is `role="img"` with a live text label.
- **Metrics**: two columns (Calories, Protein) with eaten / goal, a 6px gradient bar, and "X left · Y%".
- **Lists** (`.list`): grouped rounded containers with inset hairline separators. Rows are 60px or taller.
- **Entry rows** (`.entry`): label (or "Entry"), time, kcal and protein stacked right, trash icon button. Deleting shows an **Undo** toast; newly added rows animate in.
- **Log sheet** (`.sheet-layer`): bottom sheet with a grab handle (drag down to dismiss), backdrop tap, close button, and Escape. It traps focus and returns focus on close. Two large numeric fields (`inputmode="decimal"`), an optional label, and **Recent** chips (the user's own last 8 distinct labels) that refill all three fields in one tap. Validation shakes the fields and shows an inline error.
- **Segmented control** (`.segmented`): Week / Month / Year with a sliding thumb, `role="tablist"`.
- **Period navigator**: chevron buttons flanking the period label, hidden for the rolling week.
- **Tiles** (`.tiles`): 2×2 summary: average calories and protein per logged day, days logged, and protein-goal days hit.
- **Charts** (`js/charts.js`): hand-rolled Canvas. Values are plotted as **% of goal** with a dashed GOAL line when every period with data has a goal; otherwise each series is scaled to its own max. Rounded gradient bars, the ratio as a white line on its own scale, and empty periods as grey stubs. Each group has a focusable hotspot; hover, focus, or tap shows a tooltip and highlights the column. A visually-hidden summary mirrors the data. Charts re-render through `ResizeObserver`.
- **Day rows** (History): friendly date ("Today", "Yesterday", "Mon, Sep 28"), entry count and ratio, mini goal bars, totals, and a chevron. Tapping expands the day's entries in place with delete. Expanded state persists across re-renders (deleting no longer collapses the row). Year rows are months; tapping one opens that month.
- **Toast** (`.toast`): floats above the tab bar, `role="status"`, with an optional action (Undo). Stays 5s with an action, 2.4s without.
- **Modal** (`js/modal.js`): centered alert-style dialog over the app for import confirmation and results. Focus is trapped, Escape closes it, and focus is restored.
- **Buttons**: `.btn` + `.btn-primary` (solid `--accent`, blue glow) or `.btn-secondary` (`--surface-2` with outline). They scale to 0.97 when pressed.
- **Site pages** (`landing.html`, `roadmap.html`, `css/landing.css`): sticky blurred header with the wordmark, the five-link nav (horizontally scrollable on mobile), and an "Open app" button. The landing page has a hero with a static phone mockup of the Today screen, step and feature cards, tenets, and a `<details>` FAQ. The roadmap is grouped Planned / Shipped lists with a version chip per milestone.

## Accessibility Standards

Targets WCAG 2.1 AA. All text tokens clear 4.5:1 on their surfaces; `--accent` is never used as text. Everything interactive is a native `<a>`, `<button>`, or `<input>`, with a 2px `--accent-text` focus ring. Screens are labelled regions, the segmented control uses `role="tab"`/`aria-selected`, day rows use `aria-expanded`/`aria-controls`, and icon buttons carry descriptive `aria-label`s (e.g. "Delete Rice, 480 kcal, 5 grams protein"). The sheet and modal trap focus. Keyboard shortcuts: `N` log, `1` to `4` tabs, `F` toggle fullscreen (desktop), `Esc` close. The layout toggle uses `aria-pressed`.

## Animation and Motion

- Easing tokens: `--ease-out` `cubic-bezier(0.2, 0.8, 0.2, 1)` for quick responses, and `--ease-spring` `cubic-bezier(0.32, 0.72, 0, 1)` for things that travel (sheet, segmented thumb, rings).
- Timings: 0.15s for hover and press feedback (buttons scale to 0.97, icon buttons to 0.92), 0.2 to 0.3s for fades, screen entry, and the segmented thumb, 0.42s for the sheet, and 0.9s for ring and progress-bar fills.
- Motion is only used to show a state change: a ring filling, a sheet opening, a new row arriving, a toast appearing, or a shake on invalid input. Nothing moves decoratively or loops.
- Under `prefers-reduced-motion: reduce`, all animation and transition durations collapse to near zero, and the sheet closes without waiting for its animation.

## Notes for future contributors / AI models

- Static, no-build, vanilla HTML/CSS/JS. Keep colors inside the token table; decide fill vs. text before using blue.
- Test new UI at 360px and 390px mobile, and on desktop in both framed and fullscreen layouts.
- The favicon and logo are the 💪🏼 emoji (inline SVG data URI).
- Charts stay in plain Canvas 2D in `js/charts.js`; no charting library.
