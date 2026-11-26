<script setup lang="ts">
import type { Feature, Point } from 'geojson'
import { computed, onBeforeUnmount, onMounted, ref, useId, watchEffect } from 'vue'
import { resolvePanel, type PanelConfig } from './panel'
import type { ValueLabels } from './table'

const props = defineProps<{
  feature: Feature<Point>
  config?: PanelConfig
  valueLabels?: ValueLabels
}>()
defineEmits<{ close: [] }>()

const titleId = useId()
const closeButton = ref<HTMLButtonElement>()
const custom = ref<HTMLElement>()
const panel = computed(() => resolvePanel(props.feature, props.config, props.valueLabels))

// The host's own content: an element, never markup, so that text coming from
// the data cannot end up being parsed as HTML.
watchEffect(() => {
  if (custom.value && props.config?.content) {
    custom.value.replaceChildren(props.config.content(props.feature))
  }
})

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
      <h2 :id="titleId" class="deploy-map__panel-title">{{ panel.title }}</h2>
      <button
        ref="closeButton"
        type="button"
        class="btn btn-sm btn-outline-secondary"
        @click="$emit('close')"
      >
        Close
      </button>
    </div>
    <slot>
      <div v-if="config?.content" ref="custom"></div>
      <template v-for="(section, index) in panel.sections" v-else :key="index">
        <h3 v-if="section.title" class="deploy-map__section-title">{{ section.title }}</h3>
        <table class="table table-sm">
          <tbody>
            <tr v-for="row in section.rows" :key="row.property">
              <th scope="row">{{ row.label }}</th>
              <td>{{ row.value }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </slot>
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
.deploy-map__section-title {
  margin: 0.75rem 0 0.25rem;
  font-size: 0.875rem;
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
