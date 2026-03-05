<template>
  <div ref="wrapperRef" class="guidance-wrapper">
    <!-- The activator element -->
    <slot :props="activatorProps" :is-highlighted="shouldShow" />

    <!-- Teleport tooltip to body to avoid overflow:hidden issues -->
    <Teleport to="body">
      <div
        v-if="shouldShow && isOpen"
        class="guidance-tooltip-teleported"
        :class="locationClass"
        :style="tooltipStyle"
      >
        <!-- Arrow/tip -->
        <div class="tooltip-arrow" />

        <div class="tooltip-content">
          <!-- Close X button -->
          <button
            v-if="props.showDismiss"
            class="close-btn"
            type="button"
            @click.stop.prevent="handleDismiss"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L13 13M1 13L13 1"
                stroke="#C5C7C9"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>

          <div class="tooltip-text">
            <div v-if="props.title" class="tooltip-title">
              {{ props.title }}
            </div>
            <div class="tooltip-message">
              {{ props.message }}
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
const props = defineProps({
  tooltipId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  location: {
    type: String,
    default: 'top'
  },
  showDismiss: {
    type: Boolean,
    default: true
  },
  // External condition for showing
  condition: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['dismiss'])

const { t } = useTranslations('trainings')

// Ref to the wrapper element for position calculation
const wrapperRef = ref(null)
const tooltipStyle = ref({})

// Try to inject guidance context, fallback to local state
const injectedGuidance = inject('trainingGuidance', null)

// Local state if no injection
const localDismissed = ref(false)
const localTipsEnabled = inject('tipsEnabled', ref(true))

const shouldShow = computed(() => {
  if (!props.condition) return false

  if (injectedGuidance) {
    return injectedGuidance.shouldShowTooltip(props.tooltipId)
  }

  // Fallback to local state
  return localTipsEnabled.value && !localDismissed.value
})

const isOpen = ref(true)
const manuallyDismissed = ref(false)

// Location class for positioning
const locationClass = computed(() => `location-${props.location}`)

// Props to pass to activator slot (for compatibility)
const activatorProps = computed(() => ({}))

// Debounce timeout for position updates
let positionDebounceTimeout = null

// Calculate tooltip position based on wrapper element
function updatePosition() {
  if (!wrapperRef.value) return

  const rect = wrapperRef.value.getBoundingClientRect()

  // Skip if element is not visible or has no dimensions
  if (rect.width === 0 || rect.height === 0) return

  const gap = 12 // Gap between tooltip and activator

  let style = {}

  switch (props.location) {
    case 'top':
      style = {
        left: `${rect.left + rect.width / 2}px`,
        top: `${rect.top - gap}px`,
        transform: 'translate(-50%, -100%)'
      }
      break
    case 'bottom':
      style = {
        left: `${rect.left + rect.width / 2}px`,
        top: `${rect.bottom + gap}px`,
        transform: 'translateX(-50%)'
      }
      break
    case 'start':
      style = {
        left: `${rect.left - gap}px`,
        top: `${rect.top + rect.height / 2}px`,
        transform: 'translate(-100%, -50%)'
      }
      break
    case 'end':
      style = {
        left: `${rect.right + gap}px`,
        top: `${rect.top + rect.height / 2}px`,
        transform: 'translateY(-50%)'
      }
      break
  }

  tooltipStyle.value = style
}

// Debounced version for observers (to avoid too many rapid calls)
function debouncedUpdatePosition() {
  if (positionDebounceTimeout) {
    clearTimeout(positionDebounceTimeout)
  }
  positionDebounceTimeout = setTimeout(() => {
    updatePosition()
  }, 50)
}

// Keep tooltip open when it should show (unless manually dismissed)
watch(
  shouldShow,
  (show) => {
    if (show && !manuallyDismissed.value) {
      isOpen.value = true
      // Update position when shown
      nextTick(() => updatePosition())
    }
  },
  { immediate: true }
)

// Observers for position updates
let resizeObserver = null
let mutationObserver = null
let positionInterval = null

// Update position on scroll and resize
onMounted(() => {
  updatePosition()
  window.addEventListener('scroll', debouncedUpdatePosition, true)
  window.addEventListener('resize', debouncedUpdatePosition)

  // ResizeObserver to detect size changes of the wrapper
  if (wrapperRef.value) {
    resizeObserver = new ResizeObserver(() => {
      debouncedUpdatePosition()
    })
    resizeObserver.observe(wrapperRef.value)

    // MutationObserver to detect DOM changes in ancestors (table re-renders, etc.)
    mutationObserver = new MutationObserver(() => {
      nextTick(() => debouncedUpdatePosition())
    })
    // Observe changes in the document body for layout shifts
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    })
  }

  // Periodic position check to catch any missed layout changes
  positionInterval = setInterval(() => {
    if (shouldShow.value && isOpen.value) {
      updatePosition()
    }
  }, 500)
})

onUnmounted(() => {
  window.removeEventListener('scroll', debouncedUpdatePosition, true)
  window.removeEventListener('resize', debouncedUpdatePosition)

  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  if (mutationObserver) {
    mutationObserver.disconnect()
  }
  if (positionInterval) {
    clearInterval(positionInterval)
  }
  if (positionDebounceTimeout) {
    clearTimeout(positionDebounceTimeout)
  }
})

function handleDismiss() {
  manuallyDismissed.value = true
  isOpen.value = false

  if (injectedGuidance) {
    injectedGuidance.dismissTooltip(props.tooltipId)
  } else {
    localDismissed.value = true
  }
  emit('dismiss', props.tooltipId)
}
</script>

<style scoped>
.guidance-wrapper {
  position: relative;
}
</style>

<style>
/* Teleported tooltip - uses fixed position but recalculates on scroll */
.guidance-tooltip-teleported {
  position: fixed;
  z-index: 1000;
  background-color: #1d1d1b;
  color: white;
  max-width: 300px;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
}

.guidance-tooltip-teleported .tooltip-content {
  position: relative;
  pointer-events: auto;
}

.guidance-tooltip-teleported .tooltip-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 24px;
}

.guidance-tooltip-teleported .tooltip-title {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  color: #ffffff;
}

.guidance-tooltip-teleported .tooltip-message {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #c5c7c9;
  white-space: pre-line;
}

.guidance-tooltip-teleported .close-btn {
  position: absolute;
  top: 0;
  right: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s;
  pointer-events: auto;
}

.guidance-tooltip-teleported .close-btn:hover {
  opacity: 1;
}

/* Arrow/tip element */
.guidance-tooltip-teleported .tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
}

/* Arrow for top position (pointing down) */
.guidance-tooltip-teleported.location-top .tooltip-arrow {
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 8px 6px 0 6px;
  border-color: #1d1d1b transparent transparent transparent;
}

/* Arrow for bottom position (pointing up) */
.guidance-tooltip-teleported.location-bottom .tooltip-arrow {
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 0 6px 8px 6px;
  border-color: transparent transparent #1d1d1b transparent;
}

/* Arrow for start position (pointing right) */
.guidance-tooltip-teleported.location-start .tooltip-arrow {
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 6px 0 6px 8px;
  border-color: transparent transparent transparent #1d1d1b;
}

/* Arrow for end position (pointing left) */
.guidance-tooltip-teleported.location-end .tooltip-arrow {
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 6px 8px 6px 0;
  border-color: transparent #1d1d1b transparent transparent;
}
</style>
