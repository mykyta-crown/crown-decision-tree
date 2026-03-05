<template>
  <v-menu :close-on-content-click="false" location="bottom">
    <template #activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        variant="text"
        size="small"
        :class="['text-caption header-btn', isActive ? 'header-active' : 'text-grey']"
      >
        {{ column.title }}
        <v-img src="@/assets/icons/basic/sorting-01.svg" width="16" height="16" class="ml-2" />
      </v-btn>
    </template>
    <div class="filter-panel">
      <div class="filter-panel-header">
        <!-- Search field (optional) -->
        <v-text-field
          v-if="hasSearch"
          :model-value="searchValue"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          :placeholder="t('components.auctionsDatatable.search') || 'Search'"
          @update:model-value="$emit('update:searchValue', $event)"
        />

        <!-- Sort options -->
        <div
          class="sort-option"
          :class="{ active: isSortedAsc }"
          @click="$emit('sort', column.key, 'asc')"
        >
          <v-icon>{{ sortAscIcon }}</v-icon>
          <span>{{ sortAscLabel }}</span>
        </div>
        <div
          class="sort-option"
          :class="{ active: isSortedDesc }"
          @click="$emit('sort', column.key, 'desc')"
        >
          <v-icon>{{ sortDescIcon }}</v-icon>
          <span>{{ sortDescLabel }}</span>
        </div>
      </div>

      <!-- Date filter panel -->
      <DateFilterPanel
        v-if="filterType === 'date'"
        :model-value="dateFilter"
        @update:model-value="$emit('update:dateFilter', $event)"
      />

      <!-- Checkbox filter items -->
      <div v-else class="filter-panel-items">
        <div v-for="item in displayItems" :key="getItemValue(item)" class="filter-item">
          <v-checkbox
            :model-value="selectedItems"
            :value="getItemValue(item)"
            :label="getItemLabel(item)"
            hide-details
            density="compact"
            color="primary"
            @update:model-value="$emit('update:selectedItems', $event)"
          />
        </div>
      </div>

      <div class="filter-panel-footer" @click="handleClear">
        <span>{{ t('components.auctionsDatatable.clearFilter') || 'Clear' }}</span>
      </div>
    </div>
  </v-menu>
</template>

<script setup>
import { computed } from 'vue'
import DateFilterPanel from '~/components/Home/DateFilterPanel.vue'

const props = defineProps({
  column: {
    type: Object,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isSortedAsc: {
    type: Boolean,
    default: false
  },
  isSortedDesc: {
    type: Boolean,
    default: false
  },
  filterType: {
    type: String,
    default: 'checkbox', // 'checkbox' | 'date'
    validator: (value) => ['checkbox', 'date'].includes(value)
  },
  hasSearch: {
    type: Boolean,
    default: false
  },
  searchValue: {
    type: String,
    default: ''
  },
  items: {
    type: Array,
    default: () => []
  },
  selectedItems: {
    type: Array,
    default: () => []
  },
  dateFilter: {
    type: Object,
    default: () => ({
      type: null,
      date: null,
      startDate: null,
      endDate: null
    })
  },
  sortAscIcon: {
    type: String,
    default: 'mdi-sort-alphabetical-ascending'
  },
  sortDescIcon: {
    type: String,
    default: 'mdi-sort-alphabetical-descending'
  },
  sortAscLabel: {
    type: String,
    default: ''
  },
  sortDescLabel: {
    type: String,
    default: ''
  },
  itemValueKey: {
    type: String,
    default: null // If null, items are primitives (strings, numbers)
  },
  itemLabelKey: {
    type: String,
    default: null // If null, items are primitives
  }
})

const emit = defineEmits([
  'sort',
  'clear',
  'update:searchValue',
  'update:selectedItems',
  'update:dateFilter'
])

const { t } = useTranslations()

// Filter items based on search
const displayItems = computed(() => {
  if (!props.hasSearch || !props.searchValue) return props.items

  const search = props.searchValue.toLowerCase()
  return props.items.filter((item) => {
    const label = getItemLabel(item).toLowerCase()
    return label.includes(search)
  })
})

const getItemValue = (item) => {
  if (props.itemValueKey) {
    return item[props.itemValueKey]
  }
  return item
}

const getItemLabel = (item) => {
  if (props.itemLabelKey) {
    return item[props.itemLabelKey]
  }
  return item
}

const handleClear = () => {
  emit('clear')
}
</script>

<style scoped>
/* Text caption base */
.text-caption {
  font-size: 14px !important;
  font-weight: 400 !important;
}

/* Header button base styling */
.header-btn {
  padding: 8px 12px !important;
  min-width: unset !important;
  letter-spacing: normal !important;
  border-radius: 4px !important;
  height: 40px !important;
  text-transform: none !important;
  position: relative !important;
  left: -12px !important;
}

/* Header inactive state */
.header-btn.text-grey {
  color: #787878 !important;
  background-color: transparent !important;
}

.header-btn.text-grey .v-icon {
  color: #787878 !important;
}

/* Header active state */
.header-btn.header-active {
  color: #1d1d1b !important;
  background-color: #e9eaec !important;
}

.header-btn.header-active .v-icon {
  color: #1d1d1b !important;
}

/* Icon sizing */
.header-btn .v-icon {
  font-size: 16px !important;
  width: 16px !important;
  height: 16px !important;
}

/* SVG icon styling */
.header-btn .v-img {
  flex-shrink: 0;
  --stroke-0: #787878;
}

.header-btn.header-active .v-img {
  --stroke-0: #1d1d1b;
}

.header-btn .v-img:deep(svg) {
  --stroke-0: inherit;
}

.header-btn.text-grey .v-img:deep(svg path) {
  stroke: #787878 !important;
}

.header-btn.header-active .v-img:deep(svg path) {
  stroke: #1d1d1b !important;
}

/* Panel container */
.filter-panel {
  min-width: 260px;
  max-height: 400px;
  background: white;
  border-radius: 4px;
  box-shadow: 0px 4px 20px 0px rgba(177, 177, 177, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header section avec search et sorts */
.filter-panel-header {
  padding: 20px 20px 12px 20px;
  border-bottom: 1px solid #e9eaec;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Search field styling */
.filter-panel-header .v-text-field {
  height: 40px;
}

.filter-panel-header .v-text-field:deep(.v-field) {
  height: 40px;
  border: 1px solid #c5c7c9;
  border-radius: 4px;
}

.filter-panel-header .v-text-field:deep(.v-field__input) {
  padding: 8px 12px;
  font-size: 14px;
  color: #8e8e8e;
}

/* Sort options (comme rangées) */
.sort-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 0;
  transition: opacity 0.2s;
}

.sort-option:hover {
  opacity: 0.7;
}

.sort-option .v-icon:first-child {
  font-size: 20px;
  color: #787878;
  width: 20px;
  height: 20px;
}

.sort-option span {
  flex: 1;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #787878;
}

.sort-option.active span {
  color: #1d1d1b;
}

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
}

.filter-item:first-child {
  padding-top: 12px;
}

.filter-item:hover {
  background: #f8f8f8;
}

/* Custom checkbox styling */
.filter-item .v-checkbox:deep(.v-selection-control) {
  min-height: auto;
}

.filter-item .v-checkbox:deep(.v-selection-control__wrapper) {
  width: 20px;
  height: 20px;
}

.filter-item .v-checkbox:deep(.v-selection-control__input) {
  width: 20px;
  height: 20px;
}

.filter-item .v-checkbox:deep(.v-icon) {
  font-size: 20px;
  width: 20px;
  height: 20px;
}

.filter-item .v-checkbox:deep(.v-label) {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #1d1d1b;
  margin-left: 8px;
}

/* Footer avec Clear button */
.filter-panel-footer {
  border-top: 1px solid #e9eaec;
  padding: 12px 20px;
  cursor: pointer;
  transition: opacity 0.2s;
  text-align: left;
}

.filter-panel-footer:hover {
  opacity: 0.7;
}

.filter-panel-footer span {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #1d1d1b;
}

/* Scrollbar styling */
.filter-panel-items::-webkit-scrollbar {
  width: 4px;
}

.filter-panel-items::-webkit-scrollbar-track {
  background: #f8f8f8;
  border-radius: 4px;
}

.filter-panel-items::-webkit-scrollbar-thumb {
  background: #dbdcdd;
  border-radius: 4px;
}
</style>
