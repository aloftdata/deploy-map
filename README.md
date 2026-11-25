# deploy-map

JS library to show deployments on a map.

Give it a GeoJSON FeatureCollection of points and it draws them on a map. It is
not tied to a domain: radars, camera traps, sensor networks and sampling sites
all work the same way.

> Early development: a map with coloured markers and a legend, a table view and filters so far.

Demo: <https://aloftdata.github.io/deploy-map/>

## Usage

With a script tag (Vue and Leaflet are included in the bundle):

```html
<link rel="stylesheet" href="dist/deploy-map.css">
<script src="dist/deploy-map.js"></script>

<div id="map" style="height: 600px"></div>
<script>
  DeployMap.mount('#map', { data: 'points.geojson' })
</script>
```

As an ES module (`vue` and `leaflet` are regular dependencies):

```js
import { mount } from '@aloftdata/deploy-map'
import '@aloftdata/deploy-map/dist/deploy-map.css'

mount('#map', { data: 'points.geojson' })
```

`mount()` returns a handle. `handle.update({ matchBehaviour, table })` changes
those options on the mounted widget, keeping the filters, the view and the map
position; `handle.unmount()` removes it.

The `DeployMap` Vue component is exported too and takes the same options as
props.

### Options

| Option | Description |
|---|---|
| `data` | URL of a GeoJSON FeatureCollection of points, or the collection itself. |
| `tileLayer` | `{ url, attribution, maxZoom }`. Defaults to the Esri Light Gray Canvas layer. |
| `table.columns` | Columns of the table view: property names, or `{ property, label }` to set the header. Defaults to every property holding a plain value, labelled after its name. |
| `filters` | Filters to offer: property names, or `{ property, label, id }`. Each lists the distinct values of its property as checkboxes. Options of one filter combine with OR, filters with AND. Default: none. |
| `style` | `{ colorBy, palette }`. `colorBy` names the property that decides a marker's colour; `palette` maps values to colours, and values it does not list get one from a built-in colour-blind-safe palette. A legend is shown when `colorBy` is set. Default: one colour for all points, no legend. |
| `matchBehaviour` | `'hide'` (default) or `'dim'`: what the map does with points that do not match. The table always lists matching points only. |
| `bootstrap` | Where the Bootstrap styles come from: `'auto'` (default), `'host'` or `'bundled'`. See [Styling](#styling). |
| `onFilterchange` | Called with the selected options per filter id when the user changes a filter. |
| `onViewchange` | Called with `'map'` or `'table'` when the user switches view. |

Only `data` is required; everything else has a default.

The widget fills its container, with a minimum height of 400px. Markup uses
Bootstrap 5.3 classes, so it picks up the styles of a page that has Bootstrap.

## Styling

The widget's markup uses Bootstrap 5.3 classes. With the default
`bootstrap: 'auto'` it works on any page:

- If the page already has Bootstrap 5.3, the widget uses it and follows the
  page's theme. Nothing is added to the page.
- Otherwise the widget adds its own copy of the Bootstrap parts it needs
  (about 9 kB gzipped) in a `<style>` tag. Every rule is scoped to the widget,
  so the rest of the page is not affected.

To decide yourself, set `bootstrap: 'bundled'` (always add the bundled styles)
or `bootstrap: 'host'` (never add anything). With `'host'` on a page without
Bootstrap, for example because inline styles are not allowed there, link the
same styles as a file:

```html
<link rel="stylesheet" href="dist/deploy-map.bootstrap.css">
```

The widget never uses Bootstrap's JavaScript.

## Development

```sh
npm install
npm run build      # dist/: deploy-map.js (IIFE), deploy-map.esm.js, deploy-map.css, deploy-map.bootstrap.css
npm test
npm run lint
npm run typecheck
npx playwright install   # once, downloads the test browsers
npm run test:e2e         # smoke tests of the built bundle in Chromium, Firefox and WebKit
```

To see the demo, build, serve the repository root with any static server and
open `demo/index.html` (a page with Bootstrap) or `demo/bare.html` (a page
without).
