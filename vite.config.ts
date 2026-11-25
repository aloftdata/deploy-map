import * as sass from 'sass'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

// No .css in the id: Vite would hand the module to its own CSS pipeline.
const SCOPED_BOOTSTRAP_ID = 'virtual:scoped-bootstrap'

/** Compile the Bootstrap subset with every selector under the widget root. */
function compileScopedBootstrap(): string {
  const { css } = sass.compile('src/styles/bootstrap-scoped.scss', {
    style: 'compressed',
    charset: false,
    loadPaths: ['node_modules'],
    // Bootstrap 5.3 is written in the older Sass syntax; these warnings are about its code.
    quietDeps: true,
    silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
  })
  const moved = css
    // Bootstrap declares its --bs-* variables on the document root: put them on the widget root.
    .replace('.deploy-map :root,.deploy-map [data-bs-theme=light]{', '.deploy-map{')
    .replaceAll('.deploy-map :root{', '.deploy-map{')
    // Same for the base font and text colour it sets on <body>. The page background
    // stays the host's.
    .replace('.deploy-map body{', '.deploy-map{')
    .replace('background-color:var(--bs-body-bg);-webkit-text-size-adjust', '-webkit-text-size-adjust')
  if (moved.includes(':root') || moved.includes('.deploy-map body{')) {
    throw new Error('scoped Bootstrap: the :root/body rules were not moved; check the replacements')
  }
  return moved
}

/**
 * Makes the scoped Bootstrap CSS available twice from one compilation:
 * as a string the widget can inject (`import css from 'virtual:scoped-bootstrap'`)
 * and as dist/deploy-map.bootstrap.css for hosts that prefer a <link>.
 */
function scopedBootstrap(): Plugin {
  let css = ''
  return {
    name: 'scoped-bootstrap',
    buildStart() {
      css = compileScopedBootstrap()
    },
    resolveId: (id) => (id === SCOPED_BOOTSTRAP_ID ? '\0' + SCOPED_BOOTSTRAP_ID : undefined),
    load: (id) =>
      id === '\0' + SCOPED_BOOTSTRAP_ID ? `export default ${JSON.stringify(css)}` : undefined,
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'deploy-map.bootstrap.css', source: css })
    },
  }
}

// Two passes, because the two bundles need different externals:
// - default: self-contained IIFE for a plain <script> tag (global `DeployMap`).
// - `--mode esm`: ES module for npm consumers, with vue and leaflet left external.
export default defineConfig(({ mode }) => {
  const esm = mode === 'esm'
  return {
    plugins: [vue(), scopedBootstrap()],
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
