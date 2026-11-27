import { defineConfig } from 'vite'

// Same two passes as deploy-map (build that package first):
// - default: self-contained IIFE for a plain <script> tag (global `RadarRegistry`),
//   with deploy-map, Vue and Leaflet inside.
// - `--mode esm`: ES module for npm consumers, with deploy-map left external.
// Both produce radar-registry.css, which includes deploy-map's styles.
export default defineConfig(({ mode }) => {
  const esm = mode === 'esm'
  return {
    // Library mode does not replace this, and Vue reads it at runtime in the browser.
    define: esm ? {} : { 'process.env.NODE_ENV': '"production"' },
    build: {
      emptyOutDir: !esm,
      lib: {
        entry: 'src/index.ts',
        name: 'RadarRegistry',
        formats: [esm ? 'es' : 'iife'],
        fileName: () => (esm ? 'radar-registry.esm.js' : 'radar-registry.js'),
        cssFileName: 'radar-registry',
      },
      rollupOptions: { external: esm ? ['@aloftdata/deploy-map'] : [] },
    },
  }
})
