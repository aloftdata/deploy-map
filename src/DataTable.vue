<script setup lang="ts">
import type { Feature, Point } from 'geojson'
import { formatCell, type Column } from './table'

defineProps<{
  features: Feature<Point>[]
  columns: Column[]
}>()
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
        <tr v-for="(feature, index) in features" :key="index">
          <td v-for="column in columns" :key="column.property">
            {{ formatCell(feature.properties?.[column.property]) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
