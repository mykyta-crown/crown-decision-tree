<template>
  <div class="d-flex align-center ga-2">
    <v-switch
      v-model="localEnabled"
      hide-details
      density="compact"
      color="primary"
      class="tips-toggle"
    />
    <span class="text-body-2 text-grey-darken-1">
      {{ t('guidance.showTips') }}
    </span>
  </div>
</template>

<script setup>
const props = defineProps({
  // Allow external control of tips state
  modelValue: {
    type: Boolean,
    default: undefined
  }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useTranslations('trainings')

// Try to use injected guidance, fallback to local/prop state
const injectedGuidance = inject('trainingGuidance', null)

const localEnabled = computed({
  get() {
    // Priority: prop > injected > default true
    if (props.modelValue !== undefined) {
      return props.modelValue
    }
    if (injectedGuidance) {
      return injectedGuidance.tipsEnabled.value
    }
    return true
  },
  set(value) {
    if (props.modelValue !== undefined) {
      emit('update:modelValue', value)
    }
    if (injectedGuidance) {
      injectedGuidance.setTipsEnabled(value)
    }
  }
})

// Provide tips state for child components
provide('tipsEnabled', localEnabled)
</script>

<style scoped>
.tips-toggle {
  flex: none;
}

.tips-toggle :deep(.v-switch__track) {
  height: 20px;
  width: 36px;
}

.tips-toggle :deep(.v-switch__thumb) {
  height: 16px;
  width: 16px;
}

.tips-toggle :deep(.v-selection-control) {
  min-height: 24px;
}
</style>
