import type { Feature, Point } from 'geojson'
import type { Filter, FilterState } from './filters'

/** The part of the widget's state that a link can carry. */
export interface LinkState {
  /** Id of the selected point, see `featureId`. */
  point?: string
  view: 'map' | 'table'
  /** Selected options per filter id. */
  filters: FilterState
}

/**
 * The id a link uses for a point. With an `idProperty`: that property, and a
 * point without it cannot be linked to (undefined) rather than getting a
 * made-up id that could be another point's real one. Without: the GeoJSON
 * `id`, else a property named `id`, else the point's position in the data.
 * The last one breaks links when the data is reordered, so data that changes
 * should carry ids.
 */
export function featureId(
  feature: Feature<Point>,
  index: number,
  idProperty?: string,
): string | undefined {
  if (idProperty) {
    const id = feature.properties?.[idProperty]
    return id === null || id === undefined ? undefined : String(id)
  }
  return String(feature.id ?? feature.properties?.id ?? index)
}

/**
 * Whether a URL fragment is one of ours. The fragment belongs to the host
 * page: "#contact", or an empty one, says nothing about the widget and must
 * leave it alone.
 */
export function isLink(fragment: string, filters: Filter[]): boolean {
  const params = new URLSearchParams(fragment.replace(/^#/, ''))
  return (
    params.has('point') ||
    params.has('view') ||
    filters.some((filter) => params.has(`f.${filter.id}`))
  )
}

/**
 * The state as a URL fragment, without the "#": `point=nldhl-1&view=table&f.type=weather`.
 * Only what differs from a freshly loaded widget is written, so that state
 * gives an empty string. A filter with nothing selected is written as `f.<id>=`.
 */
export function encodeLink(state: LinkState, filters: Filter[]): string {
  const params = new URLSearchParams()
  if (state.point !== undefined) params.set('point', state.point)
  if (state.view === 'table') params.set('view', 'table')
  for (const filter of filters) {
    const selected = state.filters[filter.id] ?? filter.options
    if (selected.length === filter.options.length) continue
    // ponytail: an option that is itself the empty string cannot be told from
    // "nothing selected"; give such values a real name in the data if it matters.
    for (const option of selected.length ? selected : ['']) {
      params.append(`f.${filter.id}`, option)
    }
  }
  return params.toString()
}

/**
 * The reverse of `encodeLink`. Links are typed, shared and outlive the data:
 * unknown keys, unknown filter options and an unknown view are ignored rather
 * than treated as errors. A filter whose listed options have all disappeared
 * is not narrowed at all, instead of hiding every point.
 */
export function decodeLink(fragment: string, filters: Filter[]): LinkState {
  const params = new URLSearchParams(fragment.replace(/^#/, ''))
  return {
    point: params.get('point') ?? undefined,
    view: params.get('view') === 'table' ? 'table' : 'map',
    filters: Object.fromEntries(
      filters.map((filter) => {
        const key = `f.${filter.id}`
        const wanted = params.getAll(key)
        const known = filter.options.filter((option) => wanted.includes(option))
        // `f.<id>=` alone is a deliberate "nothing selected".
        const narrowed = known.length > 0 || (wanted.length > 0 && wanted.every((v) => v === ''))
        return [filter.id, narrowed ? known : [...filter.options]]
      }),
    ),
  }
}
