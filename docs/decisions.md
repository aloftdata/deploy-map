# Decision log

## 2026-11-23 - Slice 1 scaffold: single package, Leaflet 2.0 beta, two bundles
**What:** One Vite + Vue 3 + TypeScript package building a self-contained IIFE and an ESM bundle; Leaflet pinned to 2.0.0-beta.5 behind `src/leaflet.ts`; TypeScript held at 6.x; test data is a GeoJSON FeatureCollection following the mockups.
**Why:** The registry widget has no code before slice 4, so a workspace would be empty scaffolding; GeoJSON as the data file avoids a conversion layer; vue-tsc cannot load TypeScript 7 yet.
**Rejected:** Monorepo from day one, `create-vue` scaffolding, Leaflet 1.9.4, a custom nested JSON format.
