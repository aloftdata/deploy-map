<script setup lang="ts">
import { useId } from 'vue'
import { isRestricting, type Filter, type FilterState } from './filters'
import { own, type ValueLabels } from './table'

const props = defineProps<{
  filters: Filter[]
  /** Selected options per filter id. */
  modelValue: FilterState
  /** Text shown for the options; the state keeps the data's values. */
  valueLabels?: ValueLabels
}>()
const emit = defineEmits<{ 'update:modelValue': [state: FilterState] }>()

// Element ids must be unique on the host page, also with several widgets on it.
const uid = useId()

/** CSS anchor name tying a filter's popover to its button. */
function anchor(filter: Filter) {
  return `--${uid}-${filter.id}`.replace(/[^\w-]/g, '-')
}

function toggle(filter: Filter, option: string, checked: boolean) {
  const selected = new Set(props.modelValue[filter.id])
  if (checked) selected.add(option)
  else selected.delete(option)
  // Keep the options' own order, so the same selection always gives the same state.
  const ordered = filter.options.filter((candidate) => selected.has(candidate))
  emit('update:modelValue', { ...props.modelValue, [filter.id]: ordered })
}
</script>

<template>
  <div class="deploy-map__filters">
    <template v-for="filter in filters" :key="filter.id">
      <!-- Native popover: opens, closes on outside click and Escape, with no script. -->
      <button
        type="button"
        class="deploy-map__filter-button btn btn-sm btn-outline-secondary"
        :popovertarget="`${uid}-${filter.id}`"
        :style="{ anchorName: anchor(filter) }"
      >
        {{ filter.label }}
        <span v-if="isRestricting(filter, modelValue)" class="badge text-bg-secondary">
          {{ modelValue[filter.id].length }}/{{ filter.options.length }}
        </span>
      </button>
      <div
        :id="`${uid}-${filter.id}`"
        popover
        class="deploy-map__popover border rounded shadow-sm p-2 bg-body text-body"
        :style="{ positionAnchor: anchor(filter) }"
      >
        <fieldset>
          <legend class="visually-hidden">{{ filter.label }}</legend>
          <div v-for="(option, index) in filter.options" :key="option" class="form-check">
            <input
              :id="`${uid}-${filter.id}-${index}`"
              class="form-check-input"
              type="checkbox"
              :checked="modelValue[filter.id]?.includes(option)"
              @change="toggle(filter, option, ($event.target as HTMLInputElement).checked)"
            />
            <label class="form-check-label" :for="`${uid}-${filter.id}-${index}`">
              {{ own(own(valueLabels, filter.property), option) ?? option }}
            </label>
          </div>
        </fieldset>
      </div>
    </template>
  </div>
</template>

<style>
.deploy-map__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
/* A small caret: the button opens a list. */
.deploy-map__filter-button::after {
  content: '';
  display: inline-block;
  margin-left: 0.35em;
  vertical-align: 0.15em;
  border: 0.3em solid transparent;
  border-top-color: currentColor;
  border-bottom: 0;
}
/* Placed under its button with CSS anchor positioning; the anchor names are
   set inline, one per filter. */
.deploy-map__popover {
  position: fixed;
  inset: auto;
  top: anchor(bottom);
  left: anchor(left);
  margin: 0.25rem 0 0;
  min-width: 10rem;
}
</style>
