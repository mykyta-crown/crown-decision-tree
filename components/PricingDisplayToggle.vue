<template>
  <div class="d-flex border-custom">
    <v-btn
      value="totalPrice"
      size="small"
      width="50%"
      class="text-grey max-height"
      :class="!model ? 'active-btn extended-inactive-border' : ' border-none'"
      @click="model = false"
    >
      <span class="text-body-2">{{ t('pricing.totalPrice') }}</span>
    </v-btn>
    <v-btn
      value="pricePerUnit"
      size="small"
      width="50%"
      class="text-grey max-height"
      :class="model ? 'active-btn extended-inactive-border' : ' border-none'"
      @click="model = true"
    >
      <span class="text-body-2">{{ t('pricing.pricePerUnit') }}</span>
    </v-btn>
  </div>
</template>
<script setup>
const { t } = useTranslations()
const model = defineModel()
</script>
<style scoped>
.max-btn-height {
  color: black !important;
  max-width: 130px;
}
.max-btn-height:deep(.v-field__overlay) {
  color: black !important;
  border: 1px solid black !important;
}
.max-btn-height:deep(.v-field, .v-field__input) {
  max-height: 30px !important;
  display: flex;
  align-items: center;
}
.max-height {
  max-height: 30px;
}
.active-btn {
  color: black !important;
}
.v-selection-control {
  justify-content: flex-end;
}
.border-custom {
  display: flex;
  border: 1px solid #ffffff;
  box-shadow: 0px 0px 0px 1px #e0e0e0 inset;
  border-radius: 4px;
  overflow: hidden;
}

.extended-inactive-border {
  border: 1px solid #000 !important;
  border-radius: 4px !important;
}
</style>
