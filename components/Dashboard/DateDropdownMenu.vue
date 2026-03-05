<template>
  <v-menu contained :location="'left'" max-height="300">
    <template #activator="{ props }">
      <v-btn
        color="primary"
        variant="text"
        class="bg-grey-ligthen-3 font-weight-regular neg-margin"
        height="29"
        v-bind="props"
      >
        {{ selectedMonth ? selectedMonth.text : t('months.all') }}
        <template #append>
          <v-img
            src="@/assets/icons/basic/Chevron_down.svg"
            width="20"
            height="20"
            style="filter: brightness(0)"
            :style="{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }"
          />
        </template>
      </v-btn>
    </template>
    <v-list>
      <v-list-item
        v-for="(month, index) in months"
        :key="index"
        :value="index"
        @click="selectMonth(month)"
      >
        <v-list-item-title>{{ month.text }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
// import dayjs from 'dayjs'
const model = defineModel()
const { t } = useTranslations()

const months = computed(() => [
  { value: 0, text: t('months.all') },
  { value: 1, text: t('months.january') },
  { value: 2, text: t('months.february') },
  { value: 3, text: t('months.march') },
  { value: 4, text: t('months.april') },
  { value: 5, text: t('months.may') },
  { value: 6, text: t('months.june') },
  { value: 7, text: t('months.july') },
  { value: 8, text: t('months.august') },
  { value: 9, text: t('months.september') },
  { value: 10, text: t('months.october') },
  { value: 11, text: t('months.november') },
  { value: 12, text: t('months.december') }
])

const selectedMonth = ref(null)
const selectMonth = (month) => {
  selectedMonth.value = month
  model.value = selectedMonth.value.value
}
</script>

<style scoped>
.neg-margin {
  margin-top: -4px;
}
</style>
