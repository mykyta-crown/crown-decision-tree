<template>
  <v-col cols="12" class="d-flex justify-center">
    <v-btn-primary width="184" height="40" @click="emit('click')">
      <template #append>
        <v-img
          src="@/assets/icons/basic/Chevron_down.svg"
          width="20"
          height="20"
          style="filter: brightness(20)"
        />
      </template>
      <div class="font-weight-bold">
        {{ t('actions.continue') }}
      </div>
    </v-btn-primary>
  </v-col>
</template>

<script setup>
const emit = defineEmits(['click'])
const { t } = useTranslations()
</script>
