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
| `onFilterchange` | Called with the selected options per filter id when the user changes a filter. |
| `onViewchange` | Called with `'map'` or `'table'` when the user switches view. |

Only `data` is required; everything else has a default.

The widget fills its container, with a minimum height of 400px. Markup uses
Bootstrap 5.3 classes, so it picks up the styles of a page that has Bootstrap.

## Development

```sh
npm install
npm run build      # dist/deploy-map.js (IIFE), dist/deploy-map.esm.js, dist/deploy-map.css
npm test
npm run lint
npm run typecheck
```

To see the demo, build, serve the repository root with any static server and
open `demo/index.html`.
