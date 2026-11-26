import type { Feature, Point } from 'geojson'
import { defaultLabel } from './table'

/**
 * A filter as given in the config. A bare property name is enough; `id` defaults
 * to the property and `label` to a readable form of it.
 */
export type FilterConfig =
  | string
  | { property: string; id?: string; label?: string; kind?: 'categorical' }

export interface Filter {
  id: string
  label: string
  property: string
  /** The distinct values found in the data, sorted. */
  options: string[]
}

/** Selected options per filter id. */
export type FilterState = Record<string, string[]>

export function resolveFilters(features: Feature<Point>[], config: FilterConfig[] = []): Filter[] {
  return config.map((entry) => {
    const { property, id = property, label = defaultLabel(property) } =
      typeof entry === 'string' ? { property: entry } : entry
    const values = new Set<string>()
    for (const feature of features) {
      const value = feature.properties?.[property]
      if (value !== null && value !== undefined) values.add(String(value))
    }
    return { id, label, property, options: [...values].sort((a, b) => a.localeCompare(b)) }
  })
}

/** Everything selected: the state in which no filter restricts anything. */
export function initialState(filters: Filter[]): FilterState {
  return Object.fromEntries(filters.map((filter) => [filter.id, [...filter.options]]))
}

/** A filter restricts only when some of its options are deselected. */
export function isRestricting(filter: Filter, state: FilterState): boolean {
  const selected = state[filter.id]
  return selected !== undefined && selected.length < filter.options.length
}

/**
 * OR within a filter (any selected option), AND across filters.
 * A feature without a value for the property passes a filter only while that
 * filter is not restricting: it cannot be said to be one of the selected options.
 */
export function matches(feature: Feature<Point>, filters: Filter[], state: FilterState): boolean {
  return filters.every((filter) => {
    if (!isRestricting(filter, state)) return true
    const value = feature.properties?.[filter.property]
    return value !== null && value !== undefined && state[filter.id].includes(String(value))
  })
}
