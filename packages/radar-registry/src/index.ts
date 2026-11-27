// The radar registry widget: the generic deploy-map widget with the registry's
// presets. Everything radar-specific lives here; map, table, filters, panel
// and permalinks are deploy-map's, so fixes to those are made there.
import {
  mount as mountDeployMap,
  type DeployMapConfig,
  type DeployMapHandle,
} from '@aloftdata/deploy-map'
import '@aloftdata/deploy-map/dist/deploy-map.css'
import { withPresets } from './presets'

export { PRESET } from './presets'

/** Same options as deploy-map. Only `data` is required. */
export type RadarRegistryConfig = DeployMapConfig

/**
 * Mount the registry in `target` (a CSS selector or an element). `data` is
 * the registry file (URL or object). Options given here are merged over the
 * presets: see `withPresets`.
 */
export function mount(target: string | Element, config: RadarRegistryConfig): DeployMapHandle {
  return mountDeployMap(target, withPresets(config))
}
