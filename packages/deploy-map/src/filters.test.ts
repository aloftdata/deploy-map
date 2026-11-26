import { describe, expect, it } from 'vitest'
import type { Feature, Point } from 'geojson'
import { initialState, matches, resolveFilters } from './filters'

/** A point feature with the given properties; the position is irrelevant here. */
function feature(properties: Record<string, unknown>): Feature<Point> {
  return { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties }
}

const weatherBE = feature({ type: 'weather', country: 'Belgium' })
const weatherNL = feature({ type: 'weather', country: 'Netherlands' })
const birdscanNL = feature({ type: 'birdscan', country: 'Netherlands' })
const unknownNL = feature({ type: null, country: 'Netherlands' })
const all = [weatherBE, weatherNL, birdscanNL, unknownNL]

describe('resolveFilters', () => {
  /**
   * A filter must be usable from just a property name: the options come from
   * the data (distinct, sorted, missing values left out so there is no "null"
   * checkbox) and id and label are derived. This is the "simple deploy" path.
   */
  it('derives id, label and options from a bare property name', () => {
    expect(resolveFilters(all, ['type'])).toEqual([
      { id: 'type', label: 'Type', property: 'type', options: ['birdscan', 'weather'] },
    ])
  })

  /**
   * Explicit id and label override the derived ones, so two filters can target
   * the same property or carry a nicer name ("Radar type") without renaming data.
   */
  it('keeps an explicit id and label', () => {
    const [filter] = resolveFilters(all, [{ property: 'type', id: 'kind', label: 'Radar type' }])
    expect(filter).toMatchObject({ id: 'kind', label: 'Radar type', property: 'type' })
  })
})

describe('matches', () => {
  const filters = resolveFilters(all, ['type', 'country'])
  const select = (state: Record<string, string[]>) =>
    all.filter((f) => matches(f, filters, { ...initialState(filters), ...state }))

  /**
   * The starting state (everything ticked) must show every feature, including
   * the ones with no value for a filtered property. Otherwise adding a filter
   * to the config would silently drop incomplete records from the map.
   */
  it('matches everything while all options are selected', () => {
    expect(select({})).toEqual(all)
  })

  /**
   * Within one filter the selected options are alternatives (OR): ticking both
   * radar types shows both. Once the filter restricts, a feature with no value
   * is excluded, since it is not known to be one of the selected options.
   */
  it('combines options of one filter with OR and drops unknown values when restricting', () => {
    expect(select({ type: ['weather'] })).toEqual([weatherBE, weatherNL])
    expect(select({ country: ['Netherlands'] })).toEqual([weatherNL, birdscanNL, unknownNL])
  })

  /**
   * Different filters narrow each other (AND): "weather" plus "Netherlands"
   * must not return Belgian weather radars or Dutch BirdScans.
   */
  it('combines filters with AND', () => {
    expect(select({ type: ['weather'], country: ['Netherlands'] })).toEqual([weatherNL])
  })

  /**
   * Unticking every option of a filter means "none of these", so nothing
   * matches. It must not be read as "no restriction".
   */
  it('matches nothing when a filter has no option selected', () => {
    expect(select({ type: [] })).toEqual([])
  })
})
