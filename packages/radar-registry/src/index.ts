// The radar registry widget: the generic deploy-map widget with the registry's
// presets. Everything radar-specific lives here; map, table, filters, panel
// and permalinks are deploy-map's, so fixes to those are made there.
import {
  mount as mountDeployMap,
  type DeployMapConfig,
  type DeployMapHandle,
} from '@aloftdata/deploy-map'
import '@aloftdata/deploy-map/dist/deploy-map.css'

/** The registry's presets. Any of them can be overridden in `mount()`. */
export const PRESET = {
  filters: [{ property: 'type', label: 'Radar type' }],
  style: { colourBy: 'type' },
  valueLabels: { type: { weather: 'Weather radar', birdscan: 'BirdScan', other: 'Other' } },
  table: {
    columns: [
      { property: 'radar_id', label: 'Code' },
      'type',
      'country',
      'location',
      'start',
      'end',
    ],
  },
  panel: {
    titleProperty: 'location',
    sections: [
      {
        title: 'Radar metadata',
        properties: [
          { property: 'radar_id', label: 'Code' },
          { property: 'alt_codes', label: 'Other codes' },
          'type',
          'band',
          { property: 'frequency', label: 'Frequency (GHz)' },
          'polarization',
          { property: 'gain', label: 'Gain (dBi)' },
          { property: 'beamwidth', label: 'Beamwidth (degrees)' },
          { property: 'antenna_diameter', label: 'Antenna diameter (m)' },
          { property: 'max_range', label: 'Max range (km)' },
        ],
      },
      {
        title: 'Deployment metadata',
        properties: [
          'location',
          'country',
          { property: 'elevation', label: 'Elevation (m)' },
          { property: 'antenna_height', label: 'Antenna height (m)' },
          'start',
          'end',
        ],
      },
    ],
  },
  // A map point is a deployment: links name the deployment.
  permalink: true,
  idProperty: 'deployment_id',
} satisfies Partial<DeployMapConfig>

/** Same options as deploy-map. Only `data` is required. */
export type RadarRegistryConfig = DeployMapConfig

/**
 * Mount the registry in `target` (a CSS selector or an element). `data` is
 * the registry file (URL or object). Options given here replace the preset of
 * the same name as a whole.
 */
export function mount(target: string | Element, config: RadarRegistryConfig): DeployMapHandle {
  return mountDeployMap(target, { ...PRESET, ...config })
}
