import type { FeatureCollection, Point } from 'geojson'

export type PointCollection = FeatureCollection<Point>

/** A point the map can place: a Point geometry with two finite numbers. */
function isPlaceable(feature: unknown): boolean {
  const geometry = (feature as { geometry?: { type?: unknown; coordinates?: unknown } } | null)
    ?.geometry
  const coordinates = geometry?.coordinates
  return (
    geometry?.type === 'Point' &&
    Array.isArray(coordinates) &&
    Number.isFinite(coordinates[0]) &&
    Number.isFinite(coordinates[1])
  )
}

/**
 * Resolve the `data` config value: a URL is fetched, inline GeoJSON is used as is.
 * Extra top-level members of the collection are kept untouched.
 * Features that are not points with usable coordinates are left out, with a
 * warning: one bad record must not take the whole widget down, and lines or
 * polygons would be drawn but escape the filters and the selection.
 */
export async function loadData(data: string | PointCollection): Promise<PointCollection> {
  let collection: unknown = data
  if (typeof data === 'string') {
    const response = await fetch(data)
    if (!response.ok) {
      throw new Error(`deploy-map: could not load ${data} (HTTP ${response.status})`)
    }
    collection = await response.json()
  }
  const candidate = collection as Partial<PointCollection> | null
  if (candidate?.type !== 'FeatureCollection' || !Array.isArray(candidate.features)) {
    throw new Error('deploy-map: data is not a GeoJSON FeatureCollection')
  }
  const placeable = candidate.features.filter(isPlaceable)
  if (placeable.length === candidate.features.length) return candidate as PointCollection
  console.warn(
    `deploy-map: left out ${candidate.features.length - placeable.length} feature(s) that are not points with valid coordinates`,
  )
  return { ...candidate, features: placeable } as PointCollection
}
