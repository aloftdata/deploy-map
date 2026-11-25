import { createApp, h, shallowReactive } from 'vue'
import DeployMap from './DeployMap.vue'
import type { BootstrapMode } from './bootstrap'
import type { PointCollection } from './data'
import type { FilterConfig, FilterState } from './filters'
import type { MatchBehaviour, ScrollZoom, TileLayerConfig } from './leaflet'
import type { StyleConfig } from './style'
import type { ColumnConfig } from './table'

export interface DeployMapConfig {
  /** URL of a GeoJSON FeatureCollection of points, or the collection itself. */
  data: string | PointCollection
  /** Defaults to the Esri Light Gray Canvas layer. */
  tileLayer?: TileLayerConfig
  /** Table view settings. Columns default to every property holding a plain value. */
  table?: { columns?: ColumnConfig[] }
  /** Filters to offer. A property name is enough; none by default. */
  filters?: FilterConfig[]
  /** What the map does with points that do not match the filters. Default: 'hide'. */
  matchBehaviour?: MatchBehaviour
  /** Marker colours. One colour for all points by default. */
  style?: StyleConfig
  /**
   * Where the Bootstrap styles come from. Default 'auto': the host page's
   * Bootstrap 5.3 when it has one, bundled styles scoped to the widget otherwise.
   */
  bootstrap?: BootstrapMode
  /**
   * When the scroll wheel zooms the map. Default 'afterClick': only once the
   * map has been clicked, so scrolling a page past the map is not interrupted.
   */
  scrollZoom?: ScrollZoom
  /** Called when the user changes a filter, with the selected options per filter id. */
  onFilterchange?: (state: FilterState) => void
  /** Called when the user switches between map and table. */
  onViewchange?: (view: 'map' | 'table') => void
}

/** Options that can be changed on a mounted widget. */
export type UpdatableConfig = Pick<DeployMapConfig, 'matchBehaviour' | 'table'>

export interface DeployMapHandle {
  /** Change options without remounting: filters, view and map position are kept. */
  update: (options: UpdatableConfig) => void
  unmount: () => void
}

let mountCount = 0

/** Mount the widget in `target` (a CSS selector or an element). */
export function mount(target: string | Element, config: DeployMapConfig): DeployMapHandle {
  // Shallow: only the top-level options are tracked, the data itself is left alone.
  const props = shallowReactive({ ...config })
  const app = createApp({ render: () => h(DeployMap, props) })
  // Each mount() is its own Vue app, and their generated element ids would be
  // identical: a filter button would open the popover of another widget.
  app.config.idPrefix = `deploy-map-${++mountCount}`
  app.mount(target)
  return {
    update: (options) => void Object.assign(props, options),
    unmount: () => app.unmount(),
  }
}

export { DeployMap }
export type {
  BootstrapMode,
  ColumnConfig,
  FilterConfig,
  FilterState,
  MatchBehaviour,
  PointCollection,
  ScrollZoom,
  StyleConfig,
  TileLayerConfig,
}
