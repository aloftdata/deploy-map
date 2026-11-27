// Shared by index.html (host has Bootstrap) and bare.html (no Bootstrap).
// Only `data` is required. Without `table`, every plain property becomes a column.
const widget = DeployMap.mount('#map', {
  data: 'registry.json',
  filters: [{ property: 'type', label: 'Radar type' }, 'country'],
  style: { colourBy: 'type' },
  // The page's address follows selection, filters and view, and restores them.
  permalink: true,
  idProperty: 'deployment_id',
  // Display text for raw values, used by the filters, legend, table and panel.
  valueLabels: { type: { weather: 'Weather radar', birdscan: 'BirdScan radar' } },
  // Without `panel`, the panel lists every plain property.
  panel: {
    titleProperty: 'location',
    sections: [
      {
        title: 'Radar metadata',
        properties: [
          { property: 'radar_id', label: 'Code' },
          'type',
          'country',
          'band',
          { property: 'frequency', label: 'Frequency (GHz)' },
          'polarization',
          { property: 'max_range', label: 'Max range (km)' },
        ],
      },
      { title: 'Deployment metadata', properties: ['deployment_id', 'start', 'end'] },
    ],
  },
  onFilterChange: (state) => console.log('filterChange', state),
  onViewChange: (view) => console.log('viewChange', view),
  onSelect: (feature) => console.log('select', feature && feature.properties.deployment_id),
  table: {
    columns: [
      { property: 'radar_id', label: 'Code' },
      'type',
      'country',
      'location',
      'start',
      'end',
    ],
  },
})
for (const radio of document.querySelectorAll('input[name=match]')) {
  radio.addEventListener('change', () => widget.update({ matchBehaviour: radio.value }))
}
