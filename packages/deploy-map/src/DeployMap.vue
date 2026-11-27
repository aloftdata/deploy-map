<script setup lang="ts">
import type { Feature, Point } from 'geojson'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import DataTable from './DataTable.vue'
import FilterBar from './FilterBar.vue'
import MapLegend from './MapLegend.vue'
import SidePanel from './SidePanel.vue'
import { ensureBootstrap, type BootstrapMode } from './bootstrap'
import { loadData, type PointCollection } from './data'
import {
  initialState,
  matches,
  resolveFilters,
  type FilterConfig,
  type FilterState,
} from './filters'
import {
  createMap,
  type MapHandle,
  type MatchBehaviour,
  type ScrollZoom,
  type TileLayerConfig,
} from './leaflet'
import { resolveStyle, type StyleConfig } from './style'
import type { PanelConfig } from './panel'
import { decodeLink, encodeLink, featureId, isLink } from './permalink'
import { resolveColumns, type ColumnConfig, type ValueLabels } from './table'

const VIEWS = [
  { id: 'map', label: 'Map' },
  { id: 'table', label: 'Table' },
] as const
type View = (typeof VIEWS)[number]['id']

const props = withDefaults(
  defineProps<{
    /** URL of a GeoJSON FeatureCollection of points, or the collection itself. Read once. */
    data: string | PointCollection
    /** Defaults to the Esri Light Gray Canvas layer. Read once. */
    tileLayer?: TileLayerConfig
    /** Table view settings. Columns default to every property holding a plain value. */
    table?: { columns?: ColumnConfig[] }
    /** Filters to offer. A property name is enough; none by default. */
    filters?: FilterConfig[]
    /** What the map does with points that do not match the filters. */
    matchBehaviour?: MatchBehaviour
    /** Marker colours. One colour for all points by default. */
    style?: StyleConfig
    /** Text to show instead of the data's values, per property: filters, legend, table, panel. */
    valueLabels?: ValueLabels
    /** The panel of a selected point. Default: every property holding a plain value. */
    panel?: PanelConfig
    /**
     * Keep selection, filters and view in the page's URL fragment, and restore
     * them from it. Off by default: the fragment belongs to the host page.
     */
    permalink?: boolean
    /** Property identifying a point in links. Default: the GeoJSON id, else `id`, else the position. */
    idProperty?: string
    /** Where the Bootstrap styles come from. Read once, when the widget mounts. */
    bootstrap?: BootstrapMode
    /** When the scroll wheel zooms the map. Read once, when the widget mounts. */
    scrollZoom?: ScrollZoom
  }>(),
  { matchBehaviour: 'hide', bootstrap: 'auto', scrollZoom: 'afterClick' },
)

const emit = defineEmits<{
  /** The user changed a filter. Payload: selected options per filter id. */
  filterChange: [state: FilterState]
  /** The user switched between map and table. */
  viewChange: [view: View]
  /** The user selected a point (its panel opened), or closed the panel: null. */
  select: [feature: Feature<Point> | null]
}>()

const view = ref<View>('map')
const mapEl = ref<HTMLElement>()
const points = shallowRef<PointCollection>()
// Shallow: the state is replaced, never mutated, and is handed to the host's
// callback as plain arrays instead of Vue proxies.
const filterState = shallowRef<FilterState>({})
// Not touched by the filters: a selected point that is filtered out keeps its panel.
const selected = shallowRef<Feature<Point>>()
const error = ref('')
let map: MapHandle | undefined
// True once the widget has read the URL and may write to it.
let linked = false

const features = computed(() => points.value?.features ?? [])
const columns = computed(() => resolveColumns(features.value, props.table?.columns))
const filters = computed(() => resolveFilters(features.value, props.filters))
const style = computed(() => resolveStyle(features.value, props.style, props.valueLabels))
// The table always lists matching points only, whatever `matchBehaviour` is.
const matching = computed(() =>
  features.value.filter((feature) => matches(feature, filters.value, filterState.value)),
)

function updateMap() {
  map?.update(
    (feature) => matches(feature, filters.value, filterState.value),
    props.matchBehaviour,
  )
}

function onFilterChange(state: FilterState) {
  filterState.value = state
  emit('filterChange', state)
}

function select(feature: Feature<Point> | undefined, center = false) {
  if (feature === selected.value) return
  selected.value = feature
  map?.select(feature, center)
  emit('select', feature ?? null)
}

function onEscape(event: KeyboardEvent) {
  // Escape in an open filter list closes that list, not the panel.
  if (!(event.target as Element).closest(':popover-open')) select(undefined)
}

// Position of each feature in the data: a stable key for its table row.
const positions = computed(() => new Map(features.value.map((feature, index) => [feature, index])))

/** Link id of each feature, and the feature each id leads to. */
const links = computed(() => {
  const idOf = new Map<Feature<Point>, string>()
  const byId = new Map<string, Feature<Point>>()
  let duplicates = 0
  features.value.forEach((feature, index) => {
    const id = featureId(feature, index, props.idProperty)
    if (id === undefined) return
    idOf.set(feature, id)
    if (byId.has(id)) duplicates++
    else byId.set(id, feature)
  })
  if (duplicates && props.permalink) {
    console.warn(`deploy-map: ${duplicates} point(s) share a link id with an earlier point; links open the first one`)
  }
  return { idOf, byId }
})

/**
 * Put the widget in the state the URL describes, telling the host about what
 * changed like for a user action. A fragment that is not ours is left alone.
 */
function readLink() {
  if (!isLink(location.hash, filters.value)) return
  const link = decodeLink(location.hash, filters.value)
  if (JSON.stringify(link.filters) !== JSON.stringify(filterState.value)) onFilterChange(link.filters)
  setView(link.view)
  select(link.point === undefined ? undefined : links.value.byId.get(link.point), true)
}

function writeLink() {
  const fragment = encodeLink(
    {
      point: selected.value && links.value.idOf.get(selected.value),
      view: view.value,
      filters: filterState.value,
    },
    filters.value,
  )
  if (fragment === location.hash.slice(1)) return
  // replaceState: no history entry per click, and no hashchange event to loop on.
  history.replaceState(history.state, '', fragment ? `#${fragment}` : location.pathname + location.search)
}

function setView(next: View) {
  if (next === view.value) return
  view.value = next
  emit('viewChange', next)
}

onMounted(async () => {
  ensureBootstrap(props.bootstrap)
  try {
    const loaded = await loadData(props.data)
    // mapEl is gone if the component was unmounted while the data was loading.
    if (!mapEl.value) return
    points.value = loaded
    filterState.value = initialState(filters.value)
    map = createMap(mapEl.value, loaded, {
      colorOf: style.value.colorOf,
      onSelect: select,
      tileLayer: props.tileLayer,
      scrollZoom: props.scrollZoom,
    })
    if (props.permalink) {
      readLink()
      // The user edited the address, or followed a link to this same page.
      // ponytail: one fragment per page, so one widget with `permalink` per page.
      window.addEventListener('hashchange', readLink)
      linked = true
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
})

watch([filterState, () => props.matchBehaviour], updateMap)
watch(style, (next) => map?.recolour(next.colorOf))
// A new list of filters starts with everything selected. Watching the option,
// not the resolved filters: those also change when the data arrives, and a
// reset then would undo the state restored from a link.
watch(
  () => props.filters,
  () => (filterState.value = initialState(filters.value)),
)
// Registered here, not after the data has loaded: a watcher created after an
// `await` is not tied to the component and would outlive it.
watch([selected, view, filterState], () => {
  if (linked) writeLink()
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', readLink)
  map?.destroy()
})
</script>

<template>
  <div class="deploy-map" @keydown.esc="onEscape">
    <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>
    <template v-else>
      <div class="deploy-map__toolbar">
        <FilterBar
          :filters="filters"
          :model-value="filterState"
          :value-labels="valueLabels"
          @update:model-value="onFilterChange"
        />
        <div class="btn-group btn-group-sm" role="group" aria-label="View">
          <button
            v-for="option in VIEWS"
            :key="option.id"
            type="button"
            class="btn btn-outline-primary"
            :class="{ active: view === option.id }"
            :aria-pressed="view === option.id"
            @click="setView(option.id)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      <div class="deploy-map__body">
        <!-- Hidden, not removed, in table view: the map keeps its position and zoom.
             Leaflet tracks the size change itself; calling invalidateSize() here as
             well makes it lose the markers until the next zoom (2.0.0-beta.5). -->
        <div v-show="view === 'map'" class="deploy-map__map">
          <div ref="mapEl" class="deploy-map__leaflet"></div>
          <MapLegend v-if="style.legend.length" :entries="style.legend" />
        </div>
        <DataTable
          v-if="view === 'table'"
          class="deploy-map__table"
          :features="matching"
          :columns="columns"
          :selected="selected"
          :row-key="(feature) => positions.get(feature) ?? -1"
          :value-labels="valueLabels"
          @select="select"
        />
        <SidePanel
          v-if="selected"
          :feature="selected"
          :config="panel"
          :value-labels="valueLabels"
          @close="select(undefined)"
        >
          <!-- For hosts using the Vue component: their own panel content. -->
          <slot v-if="$slots.panel" name="panel" :feature="selected" />
        </SidePanel>
      </div>
    </template>
  </div>
</template>

<style>
/* Fills its container when the host gives it a height, 400px otherwise.
   Map and table share the same area, so toggling does not move the page. */
.deploy-map {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
  container-type: inline-size; /* the panel adapts to the widget's width, not the window's */
}
.deploy-map__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
}
.deploy-map__body {
  position: relative; /* the panel covers it when the widget is narrow */
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  /* One frame around map, table and panel. */
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius);
  overflow: hidden;
}
.deploy-map__map,
.deploy-map__table {
  flex: 1 1 0;
  min-width: 0;
}
.deploy-map__map {
  position: relative; /* the legend is placed over the map */
}
.deploy-map__leaflet {
  height: 100%;
}
.deploy-map__table {
  overflow: auto;
  padding: 0 0.5rem;
}
.deploy-map__table .table {
  margin-bottom: 0;
}
/* The column names stay in sight while the rows scroll. */
.deploy-map__table thead th {
  position: sticky;
  top: 0;
}
</style>
