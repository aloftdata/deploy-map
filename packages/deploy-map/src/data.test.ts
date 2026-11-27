import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadData, type PointCollection } from './data'

const collection: PointCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [4.79, 52.95] }, properties: {} },
  ],
}

/** Replace the global fetch with one that answers every request with `body`. */
function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('loadData', () => {
  /**
   * The `data` option accepts GeoJSON directly, so hosts that already have the
   * points (or cannot expose a URL) need no request. Guards against fetching
   * or copying when the caller passed an object.
   */
  it('returns inline GeoJSON without fetching', async () => {
    const fetchMock = stubFetch({})
    expect(await loadData(collection)).toBe(collection)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  /**
   * A string is a URL to fetch. Top-level members beyond the GeoJSON spec must
   * survive, because the registry file carries its datasets and software there.
   */
  it('fetches a URL and keeps extra top-level members', async () => {
    const fetchMock = stubFetch({ ...collection, datasets: { a: {} } })
    const loaded = await loadData('https://example.org/points.geojson')
    expect(fetchMock).toHaveBeenCalledWith('https://example.org/points.geojson')
    expect(loaded).toEqual({ ...collection, datasets: { a: {} } })
  })

  /**
   * fetch() resolves on HTTP errors, so a 404 page would otherwise be parsed as
   * data. The error must name the URL and status, since it is shown to the user
   * in place of the map.
   */
  it('rejects with the URL and status on an HTTP error', async () => {
    stubFetch('Not found', 404)
    await expect(loadData('missing.json')).rejects.toThrow('missing.json (HTTP 404)')
  })

  /**
   * The data URL is outside our control. Anything that is not a
   * FeatureCollection (a bare Feature, an API error object) must fail here with
   * a clear message instead of deep inside Leaflet.
   */
  it('rejects data that is not a FeatureCollection', async () => {
    stubFetch({ type: 'Feature', geometry: null, properties: {} })
    await expect(loadData('feature.json')).rejects.toThrow('not a GeoJSON FeatureCollection')
    await expect(loadData(null as unknown as PointCollection)).rejects.toThrow(
      'not a GeoJSON FeatureCollection',
    )
  })

  /**
   * Real data files contain the odd broken record. One feature without usable
   * coordinates used to make Leaflet throw and replace the whole widget with
   * an error, and lines or polygons were drawn but escaped filters and
   * selection. Both are now left out, with a warning, and the rest is shown.
   */
  it('leaves out features that are not points with valid coordinates', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const good = collection.features[0]
    const loaded = await loadData({
      type: 'FeatureCollection',
      features: [
        good,
        { type: 'Feature', geometry: { type: 'Point', coordinates: [] }, properties: {} },
        { type: 'Feature', geometry: null, properties: {} },
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
      ],
    } as unknown as PointCollection)
    expect(loaded.features).toEqual([good])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('left out 3 feature(s)'))
    warn.mockRestore()
  })
})
