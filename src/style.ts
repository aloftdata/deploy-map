import type { Feature, Point } from 'geojson'

export interface StyleConfig {
  /** Property whose value decides a point's colour. Without it, all points share one colour. */
  colorBy?: string
  /** Colour per value. Values not listed get one from the default palette. */
  palette?: Record<string, string>
}

export interface LegendEntry {
  label: string
  color: string
}

export interface Style {
  colorOf: (feature: Feature<Point>) => string
  /** One entry per colour in use; empty when there is nothing to tell apart. */
  legend: LegendEntry[]
}

// Okabe-Ito: eight colours that stay distinguishable with colour vision deficiencies.
// ponytail: cycles after eight values; give a `palette` or add a generated scale if needed.
export const DEFAULT_PALETTE = [
  '#0072B2',
  '#E69F00',
  '#009E73',
  '#CC79A7',
  '#56B4E9',
  '#D55E00',
  '#F0E442',
  '#000000',
]
/** For points that have no value for the `colorBy` property. */
export const UNKNOWN_COLOR = '#777777'
export const UNKNOWN_LABEL = 'Unknown'

/** `labels`: text to show in the legend instead of the values, per property. */
export function resolveStyle(
  features: Feature<Point>[],
  config: StyleConfig = {},
  labels: Record<string, Record<string, string>> = {},
): Style {
  const { colorBy, palette = {} } = config
  if (!colorBy) return { colorOf: () => DEFAULT_PALETTE[0], legend: [] }

  const valueOf = (feature: Feature<Point>) => {
    const value = feature.properties?.[colorBy]
    return value === null || value === undefined ? undefined : String(value)
  }
  const values = new Set<string>()
  let hasUnknown = false
  for (const feature of features) {
    const value = valueOf(feature)
    if (value === undefined) hasUnknown = true
    else values.add(value)
  }

  // Sorted, so a value keeps its colour whatever the order of the data.
  const colors = new Map<string, string>()
  let next = 0
  for (const value of [...values].sort((a, b) => a.localeCompare(b))) {
    colors.set(value, palette[value] ?? DEFAULT_PALETTE[next++ % DEFAULT_PALETTE.length])
  }

  const legend = [...colors].map(([value, color]) => ({
    label: labels[colorBy]?.[value] ?? value,
    color,
  }))
  if (hasUnknown) legend.push({ label: UNKNOWN_LABEL, color: UNKNOWN_COLOR })
  return {
    colorOf: (feature) => colors.get(valueOf(feature) ?? '') ?? UNKNOWN_COLOR,
    legend,
  }
}
