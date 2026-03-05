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
        <div
          class="sort-option"
          :class="{ active: isSortedAsc }"
          @click="$emit('sort', column.key, 'asc')"
        >
          <v-icon>mdi-sort-alphabetical-ascending</v-icon>
          <span>{{ t('components.auctionsDatatable.sortAtoZ') }}</span>
        </div>
        <div
          class="sort-option"
          :class="{ active: isSortedDesc }"
          @click="$emit('sort', column.key, 'desc')"
        >
          <v-icon>mdi-sort-alphabetical-descending</v-icon>
          <span>{{ t('components.auctionsDatatable.sortZtoA') }}</span>
        </div>
      </div>
    </div>
  </v-menu>
</template>

<script setup>
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
  }
})

defineEmits(['sort'])

const { t } = useTranslations()
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
</style>
