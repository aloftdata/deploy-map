// Shared by index.html (host has Bootstrap) and bare.html (no Bootstrap).
// Only `data` is required. Without `table`, every plain property becomes a column.
const widget = DeployMap.mount('#map', {
  data: 'registry.json',
  filters: [{ property: 'type', label: 'Radar type' }, 'country'],
  style: { colorBy: 'type' },
  onFilterchange: (state) => console.log('filterchange', state),
  onViewchange: (view) => console.log('viewchange', view),
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
