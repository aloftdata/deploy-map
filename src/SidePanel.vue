<script setup lang="ts">
import type { Feature, Point } from 'geojson'
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { formatCell, resolveColumns } from './table'

const props = defineProps<{ feature: Feature<Point> }>()
defineEmits<{ close: [] }>()

const titleId = useId()
const closeButton = ref<HTMLButtonElement>()
// Every plain property of the point, labelled like the table's default columns.
const rows = computed(() => resolveColumns([props.feature]))

// Keyboard users land in the panel when it opens, and go back to where they
// were (a table row) when it closes.
let opener: Element | null = null
onMounted(() => {
  opener = document.activeElement
  closeButton.value?.focus({ preventScroll: true })
})
onBeforeUnmount(() => {
  if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true })
})
</script>

<template>
  <aside class="deploy-map__panel" :aria-labelledby="titleId">
    <div class="deploy-map__panel-header">
      <h2 :id="titleId" class="deploy-map__panel-title">Details</h2>
      <button
        ref="closeButton"
        type="button"
        class="btn btn-sm btn-outline-secondary"
        @click="$emit('close')"
      >
        Close
      </button>
    </div>
    <table class="table table-sm">
      <tbody>
        <tr v-for="row in rows" :key="row.property">
          <th scope="row">{{ row.label }}</th>
          <td>{{ formatCell(feature.properties?.[row.property]) }}</td>
        </tr>
      </tbody>
    </table>
  </aside>
</template>

<style>
.deploy-map__panel {
  flex: 0 0 20rem;
  overflow: auto;
  padding: 0 0 0 0.75rem;
  background: var(--bs-body-bg);
}
.deploy-map__panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
}
.deploy-map__panel-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}
/* Narrow widget: the panel covers the map or table instead of squeezing it. */
@container (max-width: 40rem) {
  .deploy-map__panel {
    position: absolute;
    inset: 0;
    z-index: 1001; /* above Leaflet's controls and the legend */
    padding: 0.5rem;
  }
}
</style>
