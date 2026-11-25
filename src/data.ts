import type { FeatureCollection, Point } from 'geojson'

export type PointCollection = FeatureCollection<Point>

/**
 * Resolve the `data` config value: a URL is fetched, inline GeoJSON is used as is.
 * Extra top-level members of the collection are kept untouched.
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
  return candidate as PointCollection
}
