<template>
  <div
    class="guidance-highlight-wrapper"
    :class="{
      'highlight-active': isHighlighted,
      'highlight-pulse': props.pulse && isHighlighted
    }"
  >
    <slot />
  </div>
</template>

<script setup>
const props = defineProps({
  // Whether to show the highlight
  active: {
    type: Boolean,
    default: false
  },
  // Enable pulse animation
  pulse: {
    type: Boolean,
    default: true
  },
  // Border color (Vuetify color name or CSS color)
  color: {
    type: String,
    default: 'error'
  }
})

// Computed to handle both prop and injected state
const isHighlighted = computed(() => props.active)
</script>

<style scoped>
.guidance-highlight-wrapper {
  position: relative;
  transition: all 0.3s ease;
  border-radius: 4px;
}

.highlight-active {
  outline: 2px solid rgb(var(--v-theme-error));
  outline-offset: 2px;
  border-radius: 4px;
}

.highlight-pulse {
  animation: pulse-border 1.5s ease-in-out infinite;
}

@keyframes pulse-border {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-error), 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(var(--v-theme-error), 0);
  }
}
</style>
