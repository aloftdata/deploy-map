import { describe, expect, it } from 'vitest'
import { PRESET, withPresets } from './presets'

describe('withPresets', () => {
  /**
   * The registry must work from `data` alone: every preset is applied, and an
   * option explicitly set to undefined (a host passing through an unset
   * variable) must not wipe its preset.
   */
  it('keeps every preset when the host gives only data', () => {
    const config = withPresets({ data: 'registry.json', filters: undefined })
    expect(config).toEqual({ ...PRESET, data: 'registry.json' })
  })

  /**
   * A host tweaking one thing must not have to restate the rest: adding one
   * value label keeps the others, and changing the panel title keeps the
   * metadata sections. Replacing whole options made such tweaks lose presets.
   */
  it('merges object options key by key and value labels label by label', () => {
    const config = withPresets({
      data: 'registry.json',
      valueLabels: { type: { other: 'Miscellaneous' }, country: { BE: 'Belgium' } },
      panel: { titleProperty: 'radar_id' },
    })
    expect(config.valueLabels).toEqual({
      type: { ...PRESET.valueLabels.type, other: 'Miscellaneous' },
      country: { BE: 'Belgium' },
    })
    expect(config.panel).toEqual({ titleProperty: 'radar_id', sections: PRESET.panel.sections })
    expect(config.style).toEqual(PRESET.style)
  })

  /**
   * Lists are the host's to replace as a whole, and plain values simply win:
   * a host that wants its own filters or no permalinks gets exactly that.
   */
  it('replaces lists and plain values', () => {
    const config = withPresets({ data: 'registry.json', filters: ['country'], permalink: false })
    expect(config.filters).toEqual(['country'])
    expect(config.permalink).toBe(false)
  })
})
