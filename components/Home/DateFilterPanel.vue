<template>
  <div class="filter-panel-items">
    <div class="filter-item" @click="selectType('before')">
      <div class="date-filter-option">
        <div class="custom-radio" :class="{ active: modelValue.type === 'before' }">
          <div v-if="modelValue.type === 'before'" class="radio-dot" />
        </div>
        <span class="filter-label">{{ t('components.auctionsDatatable.dateFilterBefore') }}</span>
      </div>
    </div>

    <div class="filter-item" @click="selectType('after')">
      <div class="date-filter-option">
        <div class="custom-radio" :class="{ active: modelValue.type === 'after' }">
          <div v-if="modelValue.type === 'after'" class="radio-dot" />
        </div>
        <span class="filter-label">{{ t('components.auctionsDatatable.dateFilterAfter') }}</span>
      </div>
    </div>

    <div class="filter-item" @click="selectType('between')">
      <div class="date-filter-option">
        <div class="custom-radio" :class="{ active: modelValue.type === 'between' }">
          <div v-if="modelValue.type === 'between'" class="radio-dot" />
        </div>
        <span class="filter-label">{{ t('components.auctionsDatatable.dateFilterBetween') }}</span>
      </div>
    </div>

    <!-- Date inputs section -->
    <div
      v-if="modelValue.type === 'before' || modelValue.type === 'after'"
      class="date-input-section"
    >
      <label class="date-input-label">
        {{
          modelValue.type === 'before'
            ? t('components.auctionsDatatable.dateFilterStartDate')
            : t('components.auctionsDatatable.dateFilterEndDate')
        }}
      </label>
      <input
        :value="modelValue.date"
        type="date"
        class="custom-date-input"
        placeholder="jj/mm/aaaa"
        @input="updateDate($event.target.value)"
      />
    </div>

    <div v-if="modelValue.type === 'between'" class="date-input-section">
      <label class="date-input-label">{{
        t('components.auctionsDatatable.dateFilterStartDate')
      }}</label>
      <input
        :value="modelValue.startDate"
        type="date"
        class="custom-date-input"
        placeholder="jj/mm/aaaa"
        @input="updateStartDate($event.target.value)"
      />
      <label class="date-input-label mt-2">{{
        t('components.auctionsDatatable.dateFilterEndDate')
      }}</label>
      <input
        :value="modelValue.endDate"
        type="date"
        class="custom-date-input"
        placeholder="jj/mm/aaaa"
        @input="updateEndDate($event.target.value)"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useTranslations()

const selectType = (type) => {
  if (props.modelValue.type === type) {
    // Si on clique sur le même type, on le désélectionne
    emit('update:modelValue', {
      type: null,
      date: null,
      startDate: null,
      endDate: null
    })
  } else {
    // Sinon on change le type et on réinitialise les dates
    emit('update:modelValue', {
      type,
      date: null,
      startDate: null,
      endDate: null
    })
  }
}

const updateDate = (value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    date: value
  })
}

const updateStartDate = (value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    startDate: value
  })
}

const updateEndDate = (value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    endDate: value
  })
}
</script>

<style scoped>
/* Filter items section avec scroll */
.filter-panel-items {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* Individual filter item */
.filter-item {
  display: flex;
  align-items: center;
  padding: 8px 20px;
  background: white;
  transition: background-color 0.2s;
  cursor: pointer;
}

.filter-item:first-child {
  padding-top: 12px;
}

.filter-item:hover {
  background: #f8f8f8;
}

/* Date filter custom radio buttons */
.date-filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.custom-radio {
  width: 20px;
  height: 20px;
  border: 1px solid #1d1d1b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    background-color 0.2s,
    border-color 0.2s;
}

.custom-radio.active {
  background-color: #1d1d1b;
  border-color: #1d1d1b;
}

.radio-dot {
  width: 8px;
  height: 8px;
  background-color: white;
  border-radius: 50%;
}

.filter-label {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #1d1d1b;
}

/* Date inputs section */
.date-input-section {
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid #e9eaec;
}

.date-input-label {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #787878;
  margin: 0;
}

.custom-date-input {
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  border: 1px solid #c5c7c9;
  border-radius: 4px;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  color: #1d1d1b;
  background-color: white;
  outline: none;
  transition: border-color 0.2s;
}

.custom-date-input:focus {
  border-color: #1d1d1b;
}

.custom-date-input::placeholder {
  color: #8e8e8e;
}

/* Style pour le sélecteur de date natif */
.custom-date-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
}

.custom-date-input::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

.mt-2 {
  margin-top: 8px;
}
</style>
