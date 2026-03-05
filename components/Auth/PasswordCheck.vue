<template>
  <div class="d-flex align-center py-1">
    <div class="check-img mr-1">
      <img v-show="success" src="@/assets/img/auth/check.png" />
    </div>
    <span :class="success ? 'text-grey' : 'text-primary'">{{ text }}</span>
  </div>
</template>

<script setup>
defineProps({
  success: Boolean,
  text: {
    type: String,
    default() {
      return ''
    }
  }
})
</script>

<style>
.check-img {
  display: inline-block;
  min-width: 20px;
  width: 20px;
  height: 20px;
}
</style>
