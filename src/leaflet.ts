// The only file that imports Leaflet. Leaflet 2.0 is still in beta, so keeping
// it behind this wrapper keeps a fallback to 1.9.4 local to this file.
import { Canvas, CircleMarker, GeoJSON, Map as LeafletMap, TileLayer } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Feature, Point } from 'geojson'
import type { PointCollection } from './data'

export interface TileLayerConfig {
  url: string
  attribution: string
  maxZoom?: number
}

// Esri Light Gray Canvas: a muted background that lets the markers stand out.
// The attribution is the one the tile service declares. Beyond zoom 16 the
// service only returns "map data not yet available" placeholders.
export const DEFAULT_TILE_LAYER: TileLayerConfig = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  attribution:
    'Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community',
  maxZoom: 16,
}

/**
 * When the scroll wheel zooms the map:
 * - 'afterClick': only once the map has been clicked, until the pointer leaves
 *   it. Scrolling a page past the map then keeps scrolling the page.
 * - 'always': whenever the pointer is over the map. For a map that fills the page.
 * - 'never'
 */
export type ScrollZoom = 'afterClick' | 'always' | 'never'

/** What happens to points that do not match the filters. */
export type MatchBehaviour = 'hide' | 'dim'

export interface MapHandle {
  /** Show the points that pass `isMatch` normally, and hide or dim the others. */
  update: (isMatch: (feature: Feature<Point>) => boolean, behaviour: MatchBehaviour) => void
  destroy: () => void
}

const SOLID = { opacity: 1, fillOpacity: 0.2 } // Leaflet's own path defaults
const DIMMED = { opacity: 0.4, fillOpacity: 0.05 }

/** Draw the points on a new map in `el`, zoomed to fit them. */
export function createMap(
  el: HTMLElement,
  points: PointCollection,
  options: {
    colorOf: (feature: Feature<Point>) => string
    tileLayer?: TileLayerConfig
    scrollZoom?: ScrollZoom
  },
): MapHandle {
  const { colorOf, tileLayer = DEFAULT_TILE_LAYER, scrollZoom = 'afterClick' } = options
  // One shared canvas for all markers: a thousand or more points are expected.
  const map = new LeafletMap(el, {
    renderer: new Canvas(),
    scrollWheelZoom: scrollZoom === 'always',
  })
  if (scrollZoom === 'afterClick') {
    // The listeners go away with the element when the map is destroyed.
    el.addEventListener('pointerdown', () => map.scrollWheelZoom.enable())
    el.addEventListener('pointerleave', () => map.scrollWheelZoom.disable())
  }
  new TileLayer(tileLayer.url, {
    attribution: tileLayer.attribution,
    maxZoom: tileLayer.maxZoom,
  }).addTo(map)

  const markers: [Feature<Point>, CircleMarker][] = []
  const layer = new GeoJSON(points, {
    pointToLayer: (feature, latlng) => {
      const marker = new CircleMarker(latlng, { radius: 6, color: colorOf(feature) })
      markers.push([feature, marker])
      return marker
    },
  }).addTo(map)

  const bounds = layer.getBounds()
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [20, 20] })
  } else {
    map.setView([0, 0], 2) // no points: show the world
  }

  return {
    update(isMatch, behaviour) {
      for (const [feature, marker] of markers) {
        const match = isMatch(feature)
        const visible = match || behaviour === 'dim'
        if (visible && !layer.hasLayer(marker)) layer.addLayer(marker)
        if (!visible && layer.hasLayer(marker)) layer.removeLayer(marker)
        marker.setStyle(match ? SOLID : DIMMED)
      }
    },
    destroy: () => map.remove(),
  }
}
