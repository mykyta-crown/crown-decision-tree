<script setup lang="ts">
import useTranslations from '~/composables/useTranslations'
const { t } = useTranslations('decisiontree')

const emit = defineEmits<{
  create: []
}>()

function onCreate() {
  emit('create')
}
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon-wrapper">
      <div class="empty-icon-bg">
        <svg
          width="48"
          height="48"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M50 8L62 28L80 20L74 42L96 50L74 58L80 80L62 72L50 92L38 72L20 80L26 58L4 50L26 42L20 20L38 28L50 8Z"
            fill="white"
            fill-opacity="0.95"
          />
          <path
            d="M50 24L56 36L68 32L65 46L80 50L65 54L68 68L56 64L50 76L44 64L32 68L35 54L20 50L35 46L32 32L44 36L50 24Z"
            fill="white"
            fill-opacity="0.6"
          />
        </svg>
      </div>
    </div>

    <h2 class="empty-title">{{ t('calc.empty.title') }}</h2>

    <p class="empty-description">
      {{ t('calc.empty.desc') }}
    </p>

    <v-btn
      class="empty-btn"
      color="primary"
      rounded="pill"
      size="large"
      @click="onCreate"
    >
      {{ t('calc.empty.newScenario') }}
    </v-btn>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}

.empty-icon-wrapper {
  margin-bottom: 28px;
}

.empty-icon-bg {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: linear-gradient(135deg, #34D399 0%, #10B981 50%, #059669 100%);
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #1D1D1B;
  margin: 0 0 12px 0;
  letter-spacing: -0.01em;
}

.empty-description {
  font-size: 14px;
  color: #61615F;
  line-height: 1.6;
  max-width: 420px;
  margin: 0 0 32px 0;
}

.empty-btn {
  text-transform: none;
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0;
  padding: 0 32px;
}
</style>
