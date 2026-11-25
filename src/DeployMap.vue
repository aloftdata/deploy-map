<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { loadData, type PointCollection } from './data'
import { createMap, type TileLayerConfig } from './leaflet'

const props = defineProps<{
  /** URL of a GeoJSON FeatureCollection of points, or the collection itself. */
  data: string | PointCollection
  /** Defaults to the OpenStreetMap standard layer. */
  tileLayer?: TileLayerConfig
}>()

const mapEl = ref<HTMLElement>()
const error = ref('')
let destroyMap: (() => void) | undefined

onMounted(async () => {
  try {
    const points = await loadData(props.data)
    // mapEl is gone if the component was unmounted while the data was loading.
    if (mapEl.value) destroyMap = createMap(mapEl.value, points, props.tileLayer)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
})

onBeforeUnmount(() => destroyMap?.())
</script>

<template>
  <div class="deploy-map">
    <p v-if="error" role="alert">{{ error }}</p>
    <div v-else ref="mapEl" class="deploy-map__map"></div>
  </div>
</template>

<style>
/* Fills its container when the host gives it a height, 400px otherwise. */
.deploy-map {
  height: 100%;
  min-height: 400px;
}
.deploy-map__map {
  height: 100%;
  min-height: inherit;
}
</style>
