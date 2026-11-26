<script setup lang="ts">
import type { Feature, Point } from 'geojson'
import { formatCell, type Column } from './table'

defineProps<{
  features: Feature<Point>[]
  columns: Column[]
  selected?: Feature<Point>
}>()

defineEmits<{ select: [feature: Feature<Point>] }>()
</script>

<template>
  <div>
    <table class="table table-sm table-striped table-hover">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.property" scope="col">{{ column.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(feature, index) in features"
          :key="index"
          class="deploy-map__row"
          :class="{ 'table-active': feature === selected }"
          @click="$emit('select', feature)"
        >
          <td v-for="(column, position) in columns" :key="column.property">
            <!-- A real button in the first cell: rows are reachable by keyboard,
                 which markers drawn on a canvas are not. Its click bubbles to the row. -->
            <button v-if="position === 0" type="button" class="deploy-map__row-button">
              {{ formatCell(feature.properties?.[column.property]) || 'Details' }}
            </button>
            <template v-else>{{ formatCell(feature.properties?.[column.property]) }}</template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style>
.deploy-map__row {
  cursor: pointer;
}
.deploy-map__row-button {
  all: unset;
  color: var(--bs-link-color);
  text-decoration: underline;
}
.deploy-map__row-button:focus-visible {
  outline: 2px solid var(--bs-link-color);
  outline-offset: 2px;
}
</style>
