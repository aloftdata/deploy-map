import type { Feature, Point } from 'geojson'

/** A table column as given in the config: a property name, optionally with a label. */
export type ColumnConfig = string | { property: string; label?: string }

export interface Column {
  property: string
  label: string
}

/** "antenna_height" -> "Antenna height" */
export function defaultLabel(property: string): string {
  const words = property.replaceAll('_', ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * Columns to show. Without config: every property that holds a plain value
 * (text, number, boolean) in at least one feature, in order of first appearance.
 * Nested values (lists, objects) need an explicit column.
 */
export function resolveColumns(features: Feature<Point>[], config?: ColumnConfig[]): Column[] {
  const columns: ColumnConfig[] = config ?? plainProperties(features)
  return columns.map((column) => {
    const { property, label = undefined } =
      typeof column === 'string' ? { property: column } : column
    return { property, label: label ?? defaultLabel(property) }
  })
}

function plainProperties(features: Feature<Point>[]): string[] {
  const names = new Set<string>()
  for (const feature of features) {
    for (const [name, value] of Object.entries(feature.properties ?? {})) {
      if (value !== null && typeof value !== 'object') names.add(name)
    }
  }
  return [...names]
}

/** Text for a table cell. Missing values are empty, not "null". */
export function formatCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.map(formatCell).join(', ')
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}
