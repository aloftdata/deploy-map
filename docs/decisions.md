# Decision log

## 2026-11-23 - Slice 1 scaffold: single package, Leaflet 2.0 beta, two bundles
**What:** One Vite + Vue 3 + TypeScript package building a self-contained IIFE and an ESM bundle; Leaflet pinned to 2.0.0-beta.5 behind `src/leaflet.ts`; TypeScript held at 6.x; test data is a GeoJSON FeatureCollection following the mockups.
**Why:** The registry widget has no code before slice 4, so a workspace would be empty scaffolding; GeoJSON as the data file avoids a conversion layer; vue-tsc cannot load TypeScript 7 yet.
**Rejected:** Monorepo from day one, `create-vue` scaffolding, Leaflet 1.9.4, a custom nested JSON format.

## 2026-11-25 - Slice 3: defaults for every option, native popovers, scoped Bootstrap
**What:** Table, categorical filters, colour rules and legend, all usable from `data` alone; filter dropdowns use the native Popover API with CSS anchor positioning; a Bootstrap 5.3 subset is compiled with every selector under `.deploy-map` and inlined in the bundle, injected only when the host page has no Bootstrap 5.3.
**Why:** A deploy must work with minimal config and be tweaked later; the widget may not depend on `bootstrap.js`; injecting from the bundle avoids guessing a stylesheet URL.
**Rejected:** Cancel/Apply buttons on filters, a home-made dropdown, a `<link>` derived from the script URL, leaving out Bootstrap's base rules (the two style modes then look different).

## 2026-11-25 - Default background is Esri Light Gray Canvas
**What:** The built-in tile layer is Esri Light Gray Canvas (maximum zoom 16) instead of the OpenStreetMap standard layer.
**Why:** A muted background lets the markers stand out and is close to the mockups. Esri's terms for keyless use still have to be checked before publishing.
**Rejected:** CARTO Positron (same look, labels included, terms equally unchecked), keeping OpenStreetMap as the default.

## 2026-11-27 - Slice 4: selection, panel, permalinks, and the registry as a preset package
**What:** Points are selectable from the map and the table; the panel is configured as sections of properties (`panel.content` for anything else); permalinks live in the URL fragment and are off by default; the repo is an npm workspace and `@aloftdata/radar-registry` is deploy-map plus presets, with no map, table or panel code.
**Why:** Keeping the registry to configuration means fixes land once, in deploy-map; an element-returning hook keeps data out of `innerHTML`; the fragment belongs to the host page, so the widget only takes it when asked.
**Rejected:** HTML-string panel templates, query-string or pushState permalinks, map position in links, a registry widget that forks or subclasses the generic component. Reverses 2026-11-23 "single package": the second package now has code.

## 2026-11-27 - Option names before 0.1: British spelling, camelCase callbacks
**What:** `style.colourBy` (was `colorBy`), `onFilterChange` and `onViewChange` (were `onFilterchange`, `onViewchange`); `style` and `filters` now react to changes and `update()` accepts every reactive option; unknown option names are reported in the console.
**Why:** One spelling across options and docs (`matchBehaviour`, "colours"), and renames are free only before the first release; the warning covers the habit of typing `colorBy`.
**Rejected:** American spelling to match CSS and Leaflet, accepting both spellings as aliases, making `data` and `tileLayer` reactive (documented as read once instead).

## 2026-11-27 - Packaging before 0.1: Vue as a peer, ES module as the main entry, merged presets
**What:** `vue` is a peer dependency (`^3.5.0`) of deploy-map; `main` and the default export of both packages point at the ES module, the script-tag bundle stays under `unpkg`/`jsdelivr`; radar-registry depends on deploy-map `^0.1.0` and merges host options over its presets one level deep. Fragment keys (`point`, `view`, `f.<id>`) are declared stable.
**Why:** A Vue app must share one Vue with the component; `require()` of the old entry returned nothing; whole-option replacement made a one-label tweak drop the other presets.
**Rejected:** A CommonJS build, `leaflet` as a peer (hosts on 1.9 need our 2.0 copy alongside), deep-merging lists, a namespace prefix for the fragment keys (can be added as an option later).
