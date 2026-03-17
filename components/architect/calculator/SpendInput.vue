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
.spend-edit,
.spend-display {
  font-size: 16px;
  font-weight: 600;
  color: #363633;
  font-feature-settings: 'liga' off, 'clig' off;
  width: 80px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  font-family: inherit;
  white-space: nowrap;
}

.spend-edit {
  border: none;
  outline: none;
  background: transparent;
  padding: 0;
}

.spend-display {
  cursor: text;
}

@media (max-width: 600px) {
  .spend-edit,
  .spend-display {
    font-size: 20px;
    width: 110px;
    height: 28px;
    line-height: 28px;
  }
}
</style>
