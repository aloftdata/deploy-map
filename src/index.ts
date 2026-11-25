import { createApp } from 'vue'
import DeployMap from './DeployMap.vue'
import type { PointCollection } from './data'
import type { TileLayerConfig } from './leaflet'

export interface DeployMapConfig {
  /** URL of a GeoJSON FeatureCollection of points, or the collection itself. */
  data: string | PointCollection
  /** Defaults to the OpenStreetMap standard layer. */
  tileLayer?: TileLayerConfig
}

/** Mount the widget in `target` (a CSS selector or an element). */
export function mount(target: string | Element, config: DeployMapConfig): { unmount: () => void } {
  const app = createApp(DeployMap, { ...config })
  app.mount(target)
  return { unmount: () => app.unmount() }
}

export { DeployMap }
export type { PointCollection, TileLayerConfig }
