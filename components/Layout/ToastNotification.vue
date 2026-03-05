<template>
  <v-snackbar
    v-model="toast.state.value.visible"
    :timeout="toast.state.value.action ? -1 : toast.state.value.duration"
    :color="snackbarColor"
    location="top right"
    :style="{ marginTop: '60px' }"
  >
    <div class="d-flex align-center">
      <v-icon :icon="snackbarIcon" class="mr-2" />
      <span>{{ toast.state.value.message }}</span>
    </div>

    <template #actions>
      <v-btn v-if="toast.state.value.action" color="white" variant="text" @click="handleAction">
        {{ toast.state.value.action.label }}
      </v-btn>
      <v-btn variant="text" icon="mdi-close" @click="toast.hide()" />
    </template>
  </v-snackbar>
</template>

<script setup>
import { computed } from 'vue'

const toast = useToast()

/**
 * Couleur du snackbar selon le type
 */
const snackbarColor = computed(() => {
  const type = toast.state.value.type
  switch (type) {
    case 'success':
      return 'success'
    case 'error':
      return 'error'
    case 'warning':
      return 'warning'
    case 'info':
    default:
      return 'info'
  }
})

/**
 * Icône du snackbar selon le type
 */
const snackbarIcon = computed(() => {
  const type = toast.state.value.type
  switch (type) {
    case 'success':
      return 'mdi-check-circle'
    case 'error':
      return 'mdi-alert-circle'
    case 'warning':
      return 'mdi-alert'
    case 'info':
    default:
      return 'mdi-information'
  }
})

/**
 * Gérer l'action (ex: Undo)
 */
const handleAction = async () => {
  if (toast.state.value.action?.callback) {
    await toast.state.value.action.callback()
    toast.hide()
  }
}
</script>

<style scoped>
/* Styles additionnels si nécessaire */
</style>
