<template>
  <div class="d-flex justify-center">
    <video
      ref="videoRef"
      :key="videoSource"
      class="video-class"
      controls
      preload="metadata"
      :src="videoSource"
      @error="onVideoError"
      @loadedmetadata="onVideoLoaded"
    >
      Your browser does not support the video tag.
    </video>
    <div v-if="error" style="color: red">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  step: {
    type: Number,
    required: true
  }
})

const { locale } = useTranslations()
const videoRef = ref(null)
const error = ref('')

const videoSource = computed(() => {
  return locale.value === 'fr'
    ? '/onboarding/crown-presentation-french-version.mp4'
    : '/onboarding/crown-presentation-english-version.mp4'
})

const onVideoError = (event) => {
  // console.error('Video loading error:', event)
  error.value = `Error loading video: ${event.target.error?.message || 'Unknown error'}`
  // console.log('Video element:', event.target)
  // console.log('Error code:', event.target.error?.code)
}

const onVideoLoaded = () => {
  // console.log('Video loaded successfully!', videoSource.value)
}

// Watch for step changes to pause/stop the video when leaving step 3
watch(
  () => props.step,
  (newStep, oldStep) => {
    // If we're leaving step 3 (where the video is), pause it
    if (oldStep === 3 && newStep !== 3 && videoRef.value) {
      videoRef.value.pause()
    }
  }
)

// Pause video when component is unmounted
onUnmounted(() => {
  if (videoRef.value) {
    videoRef.value.pause()
  }
})

// onMounted(() => {
//   console.log('Video component mounted')
//   console.log('Current locale:', locale.value)
//   console.log('Video source:', videoSource.value)
// })
</script>

<style scoped>
.video-class {
  min-height: 438px !important;
  width: 100% !important;
  max-width: 685px !important;
  border-radius: 8px;
}
</style>
