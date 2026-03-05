<template>
  <div class="no-rank-illustration" :style="containerStyle">
    <!-- Question mark card -->
    <div class="question-card" :style="questionCardStyle">
      <div class="card-shadow" :style="cardShadowStyle" />
      <div class="card-main" :style="cardMainStyle">
        <span class="question-mark" :style="questionMarkStyle">?</span>
      </div>
    </div>

    <!-- Platform/Podium -->
    <div class="platform" :style="platformStyle">
      <img
        src="/images/no-rank-platform.svg"
        alt="Platform"
        class="platform-img"
        :style="platformImgStyle"
      />
      <img src="/images/no-rank-medal.svg" alt="Medal" class="medal-img" :style="medalImgStyle" />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  size: {
    type: Number,
    default: 80 // Default height in pixels
  }
})

// Scale factor based on default height of 80px
const scale = computed(() => props.size / 80)

const containerStyle = computed(() => ({
  width: `${137 * scale.value}px`,
  height: `${80 * scale.value}px`
}))

const questionCardStyle = computed(() => ({
  left: `${38 * scale.value}px`,
  width: `${58 * scale.value}px`,
  height: `${37 * scale.value}px`
}))

const cardShadowStyle = computed(() => ({
  height: `${36 * scale.value}px`,
  left: `${2.4 * scale.value}px`,
  top: `${3.2 * scale.value}px`,
  width: `${58 * scale.value}px`,
  borderRadius: `${6 * scale.value}px`
}))

const cardMainStyle = computed(() => ({
  height: `${37 * scale.value}px`,
  width: `${58 * scale.value}px`,
  borderRadius: `${6 * scale.value}px`
}))

const questionMarkStyle = computed(() => ({
  fontSize: `${28 * scale.value}px`
}))

const platformStyle = computed(() => ({
  left: `${25.4 * scale.value}px`,
  top: `${47 * scale.value}px`
}))

const platformImgStyle = computed(() => ({
  width: `${86.3 * scale.value}px`,
  height: `${42.2 * scale.value}px`
}))

const medalImgStyle = computed(() => ({
  width: `${27.4 * scale.value}px`,
  height: `${27.4 * scale.value}px`,
  left: `${28.6 * scale.value}px`,
  top: `${8 * scale.value}px`
}))
</script>

<style scoped>
.no-rank-illustration {
  position: relative;
  margin: 0 auto;
}

/* Question mark card */
.question-card {
  position: absolute;
  top: 0;
}

.card-shadow {
  position: absolute;
  background: #ecdaf6;
  border: 0.5px solid black;
}

.card-main {
  position: absolute;
  background: white;
  border: 0.5px solid black;
  display: flex;
  align-items: center;
  justify-content: center;
}

.question-mark {
  font-family: 'SF Pro', sans-serif;
  font-weight: bold;
  line-height: 1.3;
  color: #dcd7fe;
  user-select: none;
}

/* Platform section */
.platform {
  position: absolute;
}

.platform-img {
  display: block;
}

.medal-img {
  position: absolute;
}
</style>
