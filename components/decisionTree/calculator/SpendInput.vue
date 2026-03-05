<template>
  <input
    v-if="editing"
    ref="inputRef"
    type="text"
    class="spend-edit"
    :value="draft"
    @input="onInput"
    @blur="commit"
    @keydown.enter="($event.target as HTMLInputElement).blur()"
  />
  <div
    v-else
    class="spend-display"
    @click="startEdit"
  >
    {{ display }}
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

const props = defineProps<{
  modelValue: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const editing = ref(false)
const draft = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const display = computed(() => {
  return props.modelValue ? props.modelValue.toLocaleString('en-US') : '0'
})

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, '')
  draft.value = raw
}

function startEdit() {
  draft.value = String(props.modelValue || '')
  editing.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function commit() {
  const val = Math.min(Number(draft.value) || 0, 15000000)
  emit('update:modelValue', val)
  editing.value = false
}
</script>

<style scoped>
.spend-edit {
  border: none;
  outline: none;
  font-size: 18px;
  font-weight: 600;
  width: 130px;
  text-align: right;
  font-family: inherit;
  background: transparent;
}

.spend-display {
  font-size: 18px;
  font-weight: 600;
  width: 130px;
  text-align: right;
  cursor: text;
  font-family: inherit;
}
</style>
