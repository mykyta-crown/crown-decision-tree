<template>
  <!-- 62px compact -->
  <div
    v-if="!editMode"
    :style="{
      height: props.compact ? '62px' : '78px',
      'min-width': '50px'
    }"
    class="d-flex align-center justify-center text-center"
    :class="props.textClass"
    @click="editModeOn"
  >
    {{ model }}
  </div>

  <v-text-field
    v-else
    ref="editableTextRef"
    v-model="valTxt"
    :density="props.compact ? 'compact' : 'default'"
    class="align-center justify-center"
    variant="outlined"
    placeholder="Type & Press Enter"
    @blur="setValue"
    @keyup.enter="setValue"
  />
</template>

<script setup>
const props = defineProps({ textClass: String, compact: Boolean })
const model = defineModel()

const editMode = ref(false)
const valTxt = ref(model.value)
const editableTextRef = ref(null)

async function editModeOn() {
  editMode.value = true
  await nextTick()
  editableTextRef.value.focus()
}
async function setValue() {
  model.value = valTxt.value
  editableTextRef.value.blur()
  editMode.value = false
}
</script>
