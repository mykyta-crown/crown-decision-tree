<template>
  <div class="filter-badge" @click="$emit('remove')">
    <span class="filter-badge-text">{{ label }}</span>
    <div class="filter-badge-close">
      <svg width="16" height="16" viewBox="0 0 16 16">
        <line x1="4" y1="4" x2="12" y2="12" stroke="#1D1D1B" stroke-width="1.5" />
        <line x1="12" y1="4" x2="4" y2="12" stroke="#1D1D1B" stroke-width="1.5" />
      </svg>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true
  }
})

defineEmits(['remove'])
</script>

<style scoped>
.filter-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 4px 8px;
  background: #e9eaec;
  border: 1px solid #e9eaec;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.filter-badge:hover {
  opacity: 0.7;
}

.filter-badge-text {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: normal;
  color: #1d1d1b;
  white-space: nowrap;
}

.filter-badge-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}
</style>
