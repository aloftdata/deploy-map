import { describe, expect, it } from 'vitest'
import type { Feature, Point } from 'geojson'
import { DEFAULT_PALETTE, UNKNOWN_COLOR, resolveStyle } from './style'

/** A point feature with the given properties; the position is irrelevant here. */
function feature(properties: Record<string, unknown>): Feature<Point> {
  return { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties }
}

const weather = feature({ type: 'weather' })
const birdscan = feature({ type: 'birdscan' })
const untyped = feature({ type: null })

describe('resolveStyle', () => {
  /**
   * With no `style` config the widget must still draw: every point gets the
   * same colour, and there is no legend because there is nothing to explain.
   */
  it('uses one colour and no legend when colourBy is not set', () => {
    const style = resolveStyle([weather, birdscan])
    expect(style.colorOf(weather)).toBe(style.colorOf(birdscan))
    expect(style.legend).toEqual([])
  })

  /**
   * `colourBy` alone is enough: values get palette colours in sorted order, not
   * in data order, so a value keeps its colour when the data is reordered or
   * refreshed. The legend lists exactly those pairs.
   */
  it('assigns default palette colours by sorted value', () => {
    const style = resolveStyle([weather, birdscan, weather], { colourBy: 'type' })
    expect(style.colorOf(birdscan)).toBe(DEFAULT_PALETTE[0])
    expect(style.colorOf(weather)).toBe(DEFAULT_PALETTE[1])
    expect(style.legend).toEqual([
      { label: 'birdscan', color: DEFAULT_PALETTE[0] },
      { label: 'weather', color: DEFAULT_PALETTE[1] },
    ])
  })

  /**
   * A palette may name only the values someone cares about. The others must
   * still get a default colour, starting from the first one, so a partial
   * palette never leaves points uncoloured.
   */
  it('lets a partial palette override single values', () => {
    const style = resolveStyle([weather, birdscan], {
      colourBy: 'type',
      palette: { birdscan: '#44aa88' },
    })
    expect(style.colorOf(birdscan)).toBe('#44aa88')
    expect(style.colorOf(weather)).toBe(DEFAULT_PALETTE[0])
  })

  /**
   * Points with no value for the property are drawn in a neutral grey and get
   * an "Unknown" legend entry, so they are neither invisible nor mistaken for
   * a real category. The entry only appears when such points exist.
   */
  it('colours points without a value grey and says so in the legend', () => {
    const style = resolveStyle([weather, untyped], { colourBy: 'type' })
    expect(style.colorOf(untyped)).toBe(UNKNOWN_COLOR)
    expect(style.legend.at(-1)).toEqual({ label: 'Unknown', color: UNKNOWN_COLOR })
    expect(resolveStyle([weather], { colourBy: 'type' }).legend).toHaveLength(1)
  })

  /**
   * Value labels change what the legend says, not which colour a value gets:
   * a host can rename "weather" to "Weather radar" without the colours moving.
   */
  it('shows value labels in the legend without changing the colours', () => {
    const points = [
      { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [0, 0] }, properties: { type: 'weather' } },
      { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [0, 0] }, properties: { type: 'birdscan' } },
    ]
    const plain = resolveStyle(points, { colourBy: 'type' })
    const labelled = resolveStyle(points, { colourBy: 'type' }, { type: { weather: 'Weather radar' } })
    expect(labelled.legend.map((entry) => entry.label)).toEqual(['birdscan', 'Weather radar'])
    expect(labelled.legend.map((entry) => entry.color)).toEqual(plain.legend.map((entry) => entry.color))
  })

  /**
   * Values are used as keys into the palette. A value named like a built-in
   * object member ("constructor") must get a palette colour, not that member.
   */
  it('does not take a colour from a built-in object member', () => {
    const points = [
      { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [0, 0] }, properties: { type: 'constructor' } },
    ]
    const { legend } = resolveStyle(points, { colourBy: 'type' })
    expect(legend).toEqual([{ label: 'constructor', color: DEFAULT_PALETTE[0] }])
  })
})
