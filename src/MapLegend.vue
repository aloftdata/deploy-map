<script setup lang="ts">
import type { LegendEntry } from './style'

defineProps<{ entries: LegendEntry[] }>()
</script>

<template>
  <ul
    class="deploy-map__legend list-unstyled mb-0 p-2 small border rounded shadow-sm bg-body text-body"
    aria-label="Legend"
  >
    <li v-for="entry in entries" :key="entry.label">
      <!-- Drawn like a marker: coloured ring, lightly tinted inside. -->
      <span
        class="deploy-map__swatch"
        :style="{
          borderColor: entry.color,
          backgroundColor: `color-mix(in srgb, ${entry.color} 20%, transparent)`,
        }"
      ></span>
      {{ entry.label }}
    </li>
  </ul>
</template>

<style>
.deploy-map__legend {
  position: absolute;
  left: 0.5rem;
  bottom: 0.5rem;
  z-index: 1000; /* above the Leaflet panes and controls */
}
.deploy-map__swatch {
  display: inline-block;
  width: 0.85em;
  height: 0.85em;
  margin-right: 0.35em;
  border: 3px solid;
  border-radius: 50%;
  vertical-align: -0.1em;
  box-sizing: border-box;
}
</style>
