import type { DeployMapConfig } from '@aloftdata/deploy-map'

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

type Plain = Record<string, unknown>

function isPlain(value: unknown): value is Plain {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * The presets with the host's options on top. An option the host leaves out,
 * or sets to undefined, keeps its preset. Object options (`style`, `panel`,
 * `table`) are merged key by key, and `valueLabels` label by label, so a host
 * can change one thing without restating the rest. Lists (`filters`,
 * `panel.sections`, `table.columns`) are replaced whole: merging them by
 * position would be unpredictable.
 */
export function withPresets(config: DeployMapConfig): DeployMapConfig {
  const merged: Plain = { ...PRESET }
  for (const [name, value] of Object.entries(config)) {
    if (value === undefined) continue
    const preset = merged[name]
    if (!isPlain(preset) || !isPlain(value)) {
      merged[name] = value
    } else if (name === 'valueLabels') {
      const labels: Plain = { ...preset }
      for (const [property, own] of Object.entries(value)) {
        labels[property] = { ...(labels[property] as Plain | undefined), ...(own as Plain) }
      }
      merged[name] = labels
    } else {
      merged[name] = { ...preset, ...value }
    }
  }
  return merged as unknown as DeployMapConfig
}
