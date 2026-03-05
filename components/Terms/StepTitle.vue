<template>
  <v-row class="text-h1">
    <v-col
      cols="12"
      class="d-flex align-center"
      :class="{ 'mt-8': !props.builder, 'mt-0': props.builder, 'px-2': props.builder }"
    >
      <div
        class="step-box d-flex align-center justify-center rounded-lg"
        :class="{
          'bg-primary text-surface': !props.builder || (props.builder && model),
          'bg-transparent text-primary light-border': props.builder && !model,
          'step-box-builder': props.builder
        }"
      >
        <div :class="{ 'text-subtitle-2': props.builder }">
          <slot name="numero" />
        </div>
      </div>

      <div
        class="ml-4"
        :class="{ 'text-h4 font-weight-semibold': props.builder }"
        style="width: 100%"
      >
        <slot name="title" />
      </div>
      <v-spacer />
      <svg
        width="24"
        height="24"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.83301 10.0004L9.9578 14.1252L18.7966 5.28638"
          :stroke="doneColor"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M1.70898 10.0429L5.83377 14.1677M10.2532 9.74827L14.6726 5.32886"
          :stroke="doneColor"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </v-col>
  </v-row>
</template>

<script setup>
const props = defineProps(['builder', 'isSelected'])
const model = defineModel()

const doneColor = computed(() => {
  if (props.isSelected) {
    return model.value ? 'rgb(var(--v-theme-success))' : 'rgb(var(--v-theme-primary))'
  } else {
    return model.value ? 'rgb(var(--v-theme-success))' : 'rgb(var(--v-theme-grey))'
  }
})
</script>

<style scoped>
.step-box {
  width: 50px;
  height: 50px;
}
.step-box-builder {
  width: 26px;
  height: 24px;
}
.light-border {
  border: 1px solid rgb(var(--v-theme-primary));
}
/* .step-border-bottom{
    border-bottom: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
  } */
</style>
