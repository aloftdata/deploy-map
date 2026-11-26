import { describe, expect, it } from 'vitest'
import type { Feature, Point } from 'geojson'
import type { Filter } from './filters'
import { decodeLink, encodeLink, featureId } from './permalink'

const FILTERS: Filter[] = [
  { id: 'type', label: 'Type', property: 'type', options: ['birdscan', 'weather'] },
  { id: 'country', label: 'Country', property: 'country', options: ['Belgium', 'C\u00f4te d\'Ivoire'] },
]
const ALL = { type: ['birdscan', 'weather'], country: ['Belgium', 'C\u00f4te d\'Ivoire'] }

/** A point feature with the given properties and optional GeoJSON id. */
function feature(properties: Record<string, unknown>, id?: string | number): Feature<Point> {
  return { type: 'Feature', id, geometry: { type: 'Point', coordinates: [0, 0] }, properties }
}

describe('featureId', () => {
  /**
   * Links must work without configuration, so the id is found in the usual
   * places in order of how deliberate they are: the configured property, the
   * GeoJSON id, a property called "id", and only then the position.
   */
  it('prefers the configured property, then the GeoJSON id, then "id", then the position', () => {
    expect(featureId(feature({ code: 'nldhl', id: 'p' }, 'g'), 4, 'code')).toBe('nldhl')
    expect(featureId(feature({ code: 'nldhl', id: 'p' }, 'g'), 4)).toBe('g')
    expect(featureId(feature({ code: 'nldhl', id: 'p' }), 4)).toBe('p')
    expect(featureId(feature({ code: 'nldhl' }), 4)).toBe('4')
  })

  /**
   * A numeric id of 0 is a valid id; it must not be mistaken for "no id" and
   * silently replaced by the position.
   */
  it('accepts 0 as an id', () => {
    expect(featureId(feature({}, 0), 7)).toBe('0')
  })
})

describe('encodeLink / decodeLink', () => {
  /**
   * A widget nobody touched must not put anything in the page's address:
   * the untouched state encodes to nothing, and an empty or foreign fragment
   * (the host page's own "#section" anchor) decodes back to that state.
   */
  it('keeps the untouched state out of the URL', () => {
    const untouched = { view: 'map' as const, filters: ALL }
    expect(encodeLink(untouched, FILTERS)).toBe('')
    expect(decodeLink('', FILTERS)).toEqual({ point: undefined, ...untouched })
    expect(decodeLink('#section', FILTERS)).toEqual({ point: undefined, ...untouched })
  })

  /**
   * The point of a permalink: whatever the user set up comes back exactly,
   * including values with spaces, accents and quotes, and the distinction
   * between "everything selected" (not written) and "nothing selected".
   */
  it('round-trips selection, view and filters', () => {
    const state = {
      point: 'nldhl-1',
      view: 'table' as const,
      filters: { type: [], country: ['C\u00f4te d\'Ivoire'] },
    }
    const fragment = encodeLink(state, FILTERS)
    expect(fragment).toContain('point=nldhl-1')
    expect(decodeLink(`#${fragment}`, FILTERS)).toEqual(state)
  })

  /**
   * Links outlive the data they were made for. A filter option that no longer
   * exists, or a mistyped view, must be dropped instead of producing a state
   * the widget cannot show.
   */
  it('ignores options and views that do not exist', () => {
    expect(decodeLink('#view=globe&f.type=weather&f.type=airport', FILTERS)).toEqual({
      point: undefined,
      view: 'map',
      filters: { type: ['weather'], country: ALL.country },
    })
  })
})
