# deploy-map

JS library to show deployments on a map.

Give it a GeoJSON FeatureCollection of points and it draws them on a map. It is
not tied to a domain: radars, camera traps, sensor networks and sampling sites
all work the same way.

> Early development: only the map with markers exists so far.

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

The `DeployMap` Vue component is exported too and takes the same options as
props.

### Options

| Option | Description |
|---|---|
| `data` | URL of a GeoJSON FeatureCollection of points, or the collection itself. |
| `tileLayer` | `{ url, attribution, maxZoom }`. Defaults to the OpenStreetMap standard layer. |

The map fills its container, with a minimum height of 400px.

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
