<template>
  <v-btn
    class="d-flex align-center ga-4 cursor-pointer py-12"
    block
    variant="text"
    max-height="64"
    :disabled="!isStepAccessible"
    @click="handleClick"
  >
    <div class="d-flex align-center justify-start ga-4 cursor-pointer full-width">
      <v-chip
        v-if="!stepValidated"
        tile
        variant="outlined"
        :text="number"
        :class="currentStep === +number ? 'bg-primary' : 'white'"
        class="font-weight-bold rounded-lg d-flex align-center justify-center absolute"
        :style="{
          width: '24px',
          height: '24px'
        }"
      />
      <v-chip
        v-else
        tile
        variant="text"
        class="font-weight-bold rounded-lg d-flex align-center justify-center bg-primary absolute"
        :style="{
          width: '24px',
          height: '24px'
        }"
      >
        <template #prepend>
          <v-icon size="20" icon="mdi-check" />
        </template>
      </v-chip>

      <div class="d-flex flex-column align-start ga-1">
        <span
          class="text-h6 font-weight-semibold text-primary text-left"
          :class="{ 'text-grey': !isStepAccessible }"
        >
          {{ title }}
        </span>
        <span class="text-body-1 text-grey text-left">
          {{ description }}
        </span>
      </div>
    </div>
  </v-btn>
</template>
<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  number: {
    type: [Number, String],
    required: true
  },
  stepValidated: {
    type: Boolean,
    default: false
  },
  isStepAccessible: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click'])
const currentStep = defineModel()

const handleClick = () => {
  if (props.isStepAccessible) {
    emit('click')
  }
}
</script>
<style scoped>
:deep(.v-btn__content) {
  width: 100% !important;
}
.full-width {
  width: 100% !important;
}
</style>
