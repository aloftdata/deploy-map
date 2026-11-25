// The only file that imports Leaflet. Leaflet 2.0 is still in beta, so keeping
// it behind this wrapper keeps a fallback to 1.9.4 local to this file.
import { Canvas, CircleMarker, GeoJSON, Map as LeafletMap, TileLayer } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { PointCollection } from './data'

export interface TileLayerConfig {
  url: string
  attribution: string
  maxZoom?: number
}

export const DEFAULT_TILE_LAYER: TileLayerConfig = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
}

/**
 * Draw the points on a new map in `el`, zoomed to fit them.
 * Returns a function that destroys the map.
 */
export function createMap(
  el: HTMLElement,
  points: PointCollection,
  tileLayer: TileLayerConfig = DEFAULT_TILE_LAYER,
): () => void {
  // One shared canvas for all markers: a thousand or more points are expected.
  const map = new LeafletMap(el, { renderer: new Canvas() })
  new TileLayer(tileLayer.url, {
    attribution: tileLayer.attribution,
    maxZoom: tileLayer.maxZoom,
  }).addTo(map)

  const layer = new GeoJSON(points, {
    pointToLayer: (_feature, latlng) => new CircleMarker(latlng, { radius: 6 }),
  }).addTo(map)

  const bounds = layer.getBounds()
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [20, 20] })
  } else {
    map.setView([0, 0], 2) // no points: show the world
  }
  return () => map.remove()
}
