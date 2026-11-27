# @aloftdata/radar-registry

Map and table of the radars in the Aloft radar registry. It is the generic
[`@aloftdata/deploy-map`](../deploy-map) widget with the registry's presets:
radar type filter and colours, table columns, a panel with radar and
deployment metadata, and links to a radar.

> Not on npm yet, and there is no published registry file yet: the demo uses test data.

- Demo: <https://aloftdata.github.io/deploy-map/radar-registry/demo/>

## Usage

```html
<link rel="stylesheet" href="dist/radar-registry.css">
<script src="dist/radar-registry.js"></script>

<div id="registry" style="height: 600px"></div>
<script>
  RadarRegistry.mount('#registry', { data: 'registry.json' })
</script>
```

The single script includes deploy-map, so nothing else needs loading.

`data` is the only required option. Every [deploy-map option](../deploy-map#options)
is accepted and is merged over the presets, which are exported as `PRESET`:

- `style`, `panel` and `table` are merged key by key, and `valueLabels` label
  by label: `{ data, panel: { titleProperty: 'radar_id' } }` changes the panel
  title and keeps the metadata sections.
- Lists (`filters`, `panel.sections`, `table.columns`) and plain values
  replace the preset: `{ data, permalink: false }`.

As an ES module, also import the styles:

```js
import { mount } from '@aloftdata/radar-registry'
import '@aloftdata/radar-registry/dist/radar-registry.css'
```

## Development

See the [repository README](../../README.md). This package is built from
deploy-map's `dist`, so build deploy-map first; `npm run build` at the
repository root does both in the right order.
