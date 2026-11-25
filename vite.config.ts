import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Two passes, because the two bundles need different externals:
// - default: self-contained IIFE for a plain <script> tag (global `DeployMap`).
// - `--mode esm`: ES module for npm consumers, with vue and leaflet left external.
export default defineConfig(({ mode }) => {
  const esm = mode === 'esm'
  return {
    plugins: [vue()],
    // Library mode does not replace this, and Vue reads it at runtime in the browser.
    define: esm ? {} : { 'process.env.NODE_ENV': '"production"' },
    build: {
      emptyOutDir: !esm,
      lib: {
        entry: 'src/index.ts',
        name: 'DeployMap',
        formats: [esm ? 'es' : 'iife'],
        fileName: () => (esm ? 'deploy-map.esm.js' : 'deploy-map.js'),
        cssFileName: 'deploy-map',
      },
      rollupOptions: { external: esm ? ['vue', 'leaflet'] : [] },
    },
  }
})
