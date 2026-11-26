# deploy-map

Widgets that show a set of points on a map and in a table.

| Package | What it is |
| --- | --- |
| [`@aloftdata/deploy-map`](packages/deploy-map) | The generic widget: map, table, filters, colours, details panel, permalinks. |
| [`@aloftdata/radar-registry`](packages/radar-registry) | The Aloft radar registry: deploy-map with the registry's presets. |

- Demo: <https://aloftdata.github.io/deploy-map/>
- Radar registry demo: <https://aloftdata.github.io/deploy-map/radar-registry/demo/>
- Quick start tutorial: <https://aloftdata.github.io/deploy-map/demo/tutorial.html>

## Development

This is an npm workspace: run the commands below at the root and they run in
every package.

```sh
npm install
npm run build            # first: radar-registry is built and type-checked against deploy-map's dist
npm test
npm run lint
npm run typecheck
npx playwright install   # once
npm run test:e2e         # browser tests of the built bundles
```
