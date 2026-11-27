import { describe, expect, it } from 'vitest'
import type { Feature, Point } from 'geojson'
import { formatCell, resolveColumns } from './table'

/** A point feature with the given properties; the position is irrelevant here. */
function feature(properties: Record<string, unknown>): Feature<Point> {
  return { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties }
}

describe('resolveColumns', () => {
  /**
   * The table must be usable with no `table` config at all. Columns then come
   * from the data: a property counts as soon as one feature has a plain value
   * for it (so a column that is null on the first rows is not lost), while
   * nested values are left out because they do not fit a cell.
   */
  it('derives columns from plain properties when not configured', () => {
    const columns = resolveColumns([
      feature({ radar_id: 'bejab', end: null, datasets: [] }),
      feature({ radar_id: 'deemd', end: '2018', antenna_height: 55 }),
    ])
    expect(columns).toEqual([
      { property: 'radar_id', label: 'Radar id' },
      { property: 'end', label: 'End' },
      { property: 'antenna_height', label: 'Antenna height' },
    ])
  })

  /**
   * Explicit columns win over the derived ones and keep their order. A bare
   * property name gets the default label, so only the labels that need
   * tweaking have to be spelled out.
   */
  it('uses configured columns, with default labels where none is given', () => {
    const columns = resolveColumns(
      [feature({ radar_id: 'bejab', type: 'weather', country: 'Belgium' })],
      [{ property: 'radar_id', label: 'Code' }, 'type'],
    )
    expect(columns).toEqual([
      { property: 'radar_id', label: 'Code' },
      { property: 'type', label: 'Type' },
    ])
  })
})

describe('formatCell', () => {
  /**
   * Unknown values are common (a deployment with no end date is still active)
   * and must show as an empty cell, never as the text "null" or "undefined".
   * Zero and false are real values and must stay visible.
   */
  it('shows missing values as empty and keeps falsy values', () => {
    expect(formatCell(null)).toBe('')
    expect(formatCell(undefined)).toBe('')
    expect(formatCell(0)).toBe('0')
    expect(formatCell(false)).toBe('false')
  })

  /**
   * A nested value only reaches a cell when its column was configured
   * explicitly; it must then be readable instead of "[object Object]".
   */
  it('renders lists and objects readably', () => {
    expect(formatCell(['6234', '1207'])).toBe('6234, 1207')
    expect(formatCell({ level: 'public' })).toBe('{"level":"public"}')
  })

  /**
   * Values come from the data and are used as keys into the labels. A value
   * that happens to be the name of a built-in object member ("constructor")
   * used to be displayed as that member's source code.
   */
  it('does not mistake a value for a built-in object member', () => {
    expect(formatCell('constructor', {})).toBe('constructor')
    expect(formatCell('constructor')).toBe('constructor')
    expect(formatCell('weather', { weather: 'Weather radar' })).toBe('Weather radar')
  })
})
