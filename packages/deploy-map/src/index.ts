import type { Feature, Point } from 'geojson'
import { createApp, h, shallowReactive } from 'vue'
import DeployMap from './DeployMap.vue'
import type { BootstrapMode } from './bootstrap'
import type { PointCollection } from './data'
import type { FilterConfig, FilterState } from './filters'
import type { MatchBehaviour, ScrollZoom, TileLayerConfig } from './leaflet'
import type { StyleConfig } from './style'
import type { PanelConfig } from './panel'
import type { ColumnConfig, ValueLabels } from './table'

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
   * Text to show instead of the data's values, per property:
   * `{ type: { weather: 'Weather radar' } }`. Used by filters, legend, table and panel.
   */
  valueLabels?: ValueLabels
  /**
   * The panel of a selected point: its title, sections of properties, or
   * custom content. Default: every property holding a plain value.
   */
  panel?: PanelConfig
  /**
   * Keep selection, filters and view in the page's URL fragment ("#point=..."),
   * and restore them from it, so a link opens the widget in the same state.
   * Default false: the fragment belongs to the host page.
   */
  permalink?: boolean
  /**
   * Property that identifies a point in links. Default: the GeoJSON `id`, else
   * a property named `id`, else the point's position in the data.
   */
  idProperty?: string
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
  /** Called when the user selects a point, and with null when its panel is closed. */
  onSelect?: (feature: Feature<Point> | null) => void
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
  PanelConfig,
  PointCollection,
  ScrollZoom,
  StyleConfig,
  TileLayerConfig,
  ValueLabels,
}
