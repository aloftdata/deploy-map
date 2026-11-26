import { describe, expect, it } from 'vitest'
import type { Feature, Point } from 'geojson'
import { resolvePanel } from './panel'

const feature: Feature<Point> = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [0, 0] },
  properties: { radar_id: 'nldhl', type: 'weather', end: null, datasets: [] },
}

describe('resolvePanel', () => {
  /**
   * Selecting a point must give a useful panel with no `panel` config at all:
   * one untitled section with the point's plain properties (empty and nested
   * ones left out, as in the default table), under a neutral title.
   */
  it('lists the plain properties under a default title when not configured', () => {
    expect(resolvePanel(feature)).toEqual({
      title: 'Details',
      sections: [
        {
          title: undefined,
          rows: [
            { property: 'radar_id', label: 'Radar id', value: 'nldhl' },
            { property: 'type', label: 'Type', value: 'weather' },
          ],
        },
      ],
    })
  })

  /**
   * A configured panel is how the radar registry gets its metadata blocks:
   * sections keep their order and titles, properties their labels, value
   * labels replace raw values, and a listed property without a value still
   * gets its row (empty), so the panel has the same shape for every point.
   */
  it('builds the configured sections, with value labels and empty rows', () => {
    const panel = resolvePanel(
      feature,
      {
        titleProperty: 'radar_id',
        sections: [
          { title: 'Radar', properties: [{ property: 'type', label: 'Kind' }] },
          { title: 'Deployment', properties: ['end'] },
        ],
      },
      { type: { weather: 'Weather radar' } },
    )
    expect(panel).toEqual({
      title: 'nldhl',
      sections: [
        { title: 'Radar', rows: [{ property: 'type', label: 'Kind', value: 'Weather radar' }] },
        { title: 'Deployment', rows: [{ property: 'end', label: 'End', value: '' }] },
      ],
    })
  })

  /**
   * A point may lack the property used for the title; the panel must then
   * fall back to the default title instead of showing an empty heading, which
   * would also leave the panel without an accessible name.
   */
  it('falls back to the default title when the title property is empty', () => {
    expect(resolvePanel(feature, { titleProperty: 'end' }).title).toBe('Details')
  })
})
