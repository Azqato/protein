# vendor/

`xlsx.full.min.js` is SheetJS Community Edition (https://sheetjs.com), Apache-2.0,
vendored so ProteinPulse needs no CDN or build step. It is loaded lazily by
`js/xlsx-io.js` on the first Export or Import, never on page load. Update it by
hand after checking the SheetJS release notes; see the Dependency Policy in
docs/PRD.md.
