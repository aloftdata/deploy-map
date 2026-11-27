import type { Feature, Point } from 'geojson'
import { formatCell, own, resolveColumns, type ColumnConfig, type ValueLabels } from './table'

export interface PanelSectionConfig {
  /** Heading above the section. */
  title?: string
  /** Properties to list, like table columns: a name, optionally with a label. */
  properties: ColumnConfig[]
}

/** What the panel of a selected point shows. Everything is optional. */
export interface PanelConfig {
  /** Property whose value is the panel's title. Default: the title is "Details". */
  titleProperty?: string
  /** Default: one untitled section with every property holding a plain value. */
  sections?: PanelSectionConfig[]
  /**
   * For content a list of properties cannot express: return the element to
   * show, instead of the sections. It is called for each selected point.
   */
  content?: (feature: Feature<Point>) => Element
}

export interface PanelSection {
  title?: string
  rows: { property: string; label: string; value: string }[]
}

export const DEFAULT_PANEL_TITLE = 'Details'

/** Title and sections of the panel for `feature`, as text ready to display. */
export function resolvePanel(
  feature: Feature<Point>,
  config: PanelConfig = {},
  valueLabels: ValueLabels = {},
): { title: string; sections: PanelSection[] } {
  const text = (property: string) =>
    formatCell(feature.properties?.[property], own(valueLabels, property))
  const sections: Partial<PanelSectionConfig>[] = config.sections ?? [{}]
  return {
    title: (config.titleProperty && text(config.titleProperty)) || DEFAULT_PANEL_TITLE,
    sections: sections.map(({ title, properties }) => ({
      title,
      rows: resolveColumns([feature], properties).map((column) => ({
        ...column,
        value: text(column.property),
      })),
    })),
  }
}
