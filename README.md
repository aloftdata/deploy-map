# deploy-map

Widgets that show a set of points on a map and in a table.

| Package | What it is |
| --- | --- |
| [`@aloftdata/deploy-map`](packages/deploy-map) | The generic widget: map, table, filters, colours, details panel, permalinks. |

- Demo: <https://aloftdata.github.io/deploy-map/>
- Quick start tutorial: <https://aloftdata.github.io/deploy-map/demo/tutorial.html>

## Development

This is an npm workspace: run the commands below at the root and they run in
every package.

```sh
npm install
npm run build
npm test
npm run lint
npm run typecheck
npx playwright install   # once
npm run test:e2e         # browser tests of the built bundles
```
