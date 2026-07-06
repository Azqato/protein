# ProteinPulse

A free, open-source calorie and protein tracker that runs entirely in the browser.

- **Live site**: https://azqato.github.io/protein/
- **Docs**: see [/docs](docs/PRD.md) for the full PRD, [DESIGN.md](docs/DESIGN.md) for the design system, and [PATCHNOTES.md](docs/PATCHNOTES.md) for the changelog

## Tech Stack

- HTML5, CSS3, vanilla JavaScript (ES2020+), no framework, no build step
- [SheetJS Community Edition](https://sheetjs.com) (`xlsx.full.min.js`, Apache-2.0), vendored locally in `/vendor` for `.xlsx` import/export

## Prerequisites

- Any modern browser (current Chrome, Firefox, Safari, or Edge)
- Python 3 (or any static file server) for local development, optional but recommended over `file://`

No Node.js, package manager, or build tooling is required to run this project.

## Installation

```
git clone <repo-url>
cd protein
```

There is no dependency install step. All required files (including the vendored SheetJS library) are checked into the repository.

## Running Locally

From the project root:

```
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser. Opening `index.html` directly via `file://` also works, since the app makes no network calls.

`index.html` is the app. `landing.html` is a separate marketing/educational overview page; it has no logic of its own and reuses `css/styles.css` plus a page-specific `css/landing.css`. `roadmap.html` is the Roadmap table, also its own page. All three share the same header navigation.

## Environment Variables

None. This app has no server, no API keys, and no configuration required to run.

## Build and Deploy

There is no build step. Deploy by pointing any static host (GitHub Pages, Netlify, Cloudflare Pages) at the repository root. See [PRD.md: Runbook](docs/PRD.md#runbook) for full deploy and rollback steps.

## Documentation

Full project documentation lives in [/docs](docs/PRD.md):
- [docs/PRD.md](docs/PRD.md): problem statement, users, roadmap, technical requirements, security, FAQ
- [docs/DESIGN.md](docs/DESIGN.md): color palette, typography, spacing, breakpoints, component patterns
- [docs/PATCHNOTES.md](docs/PATCHNOTES.md): dated changelog
