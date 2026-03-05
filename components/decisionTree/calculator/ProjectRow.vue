<script setup lang="ts">
import { computed, ref } from 'vue'
import { fmtDate } from '~/utils/decisionTree/formatting'

interface ProjectState {
  lots?: any[]
  [key: string]: any
}

interface Project {
  id: string | number
  name: string
  client?: string
  lastActive?: string | null
  topFamily?: string
  owner?: string
  status?: string
  favorite?: boolean
  state?: ProjectState
}

const props = defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  click: []
  toggleFavorite: []
  edit: []
  archive: []
  duplicate: []
  delete: []
}>()

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  eAuction: { bg: '#DEF7EC', text: '#065F46' },
  Closed: { bg: '#DEF7EC', text: '#065F46' },
  Recommended: { bg: '#DEF7EC', text: '#065F46' },
  Upcoming: { bg: '#DEF7EC', text: '#065F46' },
  'In progress': { bg: '#FDF6B2', text: '#723B13' },
  Draft: { bg: '#F3F4F6', text: '#6B7280' },
}

const statusStyle = computed(() => {
  const s = props.project.status || 'Draft'
  const colors = STATUS_COLORS[s] || STATUS_COLORS.Draft
  return {
    backgroundColor: colors.bg,
    color: colors.text,
  }
})

const hasMultipleLots = computed(() => {
  return (props.project.state?.lots?.length ?? 0) > 1
})

/* Star click animation */
const starAnimating = ref(false)

function onRowClick() {
  emit('click')
}

function onToggleFavorite(e: Event) {
  e.stopPropagation()
  starAnimating.value = true
  emit('toggleFavorite')
  setTimeout(() => {
    starAnimating.value = false
  }, 400)
}

function onMenuAction(action: 'edit' | 'archive' | 'duplicate' | 'delete') {
  emit(action)
}
</script>

<template>
  <div class="project-row" @click="onRowClick">
    <!-- Col 1: Checkbox -->
    <div class="col-checkbox" @click.stop>
      <v-checkbox hide-details density="compact" />

    <!-- Col 2: Project name -->
    <div class="col-name">
      <span class="name-text">{{ project.name }}</span>
    </div>

    <!-- Col 3: Client -->
    <div class="col-cell">
      {{ project.client || 'Crown' }}
    </div>

    <!-- Col 4: Last active date -->
    <div class="col-cell">
      {{ fmtDate(project.lastActive) }}
    </div>

    <!-- Col 5: Top family -->
    <div class="col-cell col-family">
      <span>{{ project.topFamily || '\u2014' }}</span>
      <v-icon v-if="hasMultipleLots" size="14" color="grey-ligthen-1">mdi-view-grid-outline</v-icon>
    </div>

    <!-- Col 6: Owner -->
    <div class="col-cell">
      {{ project.owner || 'You' }}
    </div>

    <!-- Col 7: Status chip -->
    <div class="col-status">
      <v-chip size="small" :style="statusStyle">
        {{ project.status || 'Draft' }}
      </v-chip>
    </div>

    <!-- Col 8: Star / Favorite -->
    <div class="col-star" @click="onToggleFavorite">
      <v-icon
        :icon="project.favorite ? 'mdi-star' : 'mdi-star-outline'"
        :color="project.favorite ? 'green' : 'grey-ligthen-1'"
        size="18"
        :class="{ 'star-animating': starAnimating }"
      />
    </div>

    <!-- Col 9: Three-dot menu -->
    <div class="col-menu" @click.stop>
      <v-menu location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn icon variant="text" size="x-small" v-bind="menuProps">
            <v-icon size="18">mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list density="compact" min-width="180">
          <v-list-item prepend-icon="mdi-pencil-outline" @click="onMenuAction('edit')">
            <v-list-item-title class="text-body-2">Edit</v-list-item-title>
          </v-list-item>
          <v-list-item prepend-icon="mdi-archive-outline" @click="onMenuAction('archive')">
            <v-list-item-title class="text-body-2">Archive</v-list-item-title>
          </v-list-item>
          <v-list-item prepend-icon="mdi-content-copy" @click="onMenuAction('duplicate')">
            <v-list-item-title class="text-body-2">Duplicate</v-list-item-title>
          </v-list-item>
          <v-divider class="my-1" />
          <v-list-item prepend-icon="mdi-delete-outline" class="text-red" @click="onMenuAction('delete')">
            <v-list-item-title class="text-body-2">Delete</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>

<style scoped>
/* ================================================================
   PROJECT ROW — Premium SaaS table row
   ================================================================ */

.project-row {
  display: grid;
  grid-template-columns: 48px 2fr 1fr 1fr 1fr 1fr 140px 40px 44px;
  align-items: center;
  padding: 0 20px;
  height: 48px;
  border-bottom: 1px solid #F3F4F6;
  cursor: pointer;
  transition:
    background-color 0.15s ease;
}

.project-row:last-child {
  border-bottom: none;
}

.project-row:hover {
  background-color: #FAFAFA;
}

/* ----------------------------------------------------------------
   Checkbox
   ---------------------------------------------------------------- */

.col-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ----------------------------------------------------------------
   Name column
   ---------------------------------------------------------------- */

.col-name {
  overflow: hidden;
  padding-right: 12px;
}

.name-text {
  font-size: 14px;
  font-weight: 400;
  color: #1D1D1B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

/* ----------------------------------------------------------------
   Data cells
   ---------------------------------------------------------------- */

.col-cell {
  font-size: 14px;
  color: #1D1D1B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 8px;
}

.col-family {
  display: flex;
  align-items: center;
  gap: 6px;
}

.multi-lot-icon {
  flex-shrink: 0;
  color: #8E8E8E;
  opacity: 0.6;
}

/* ----------------------------------------------------------------
   Status chip
   ---------------------------------------------------------------- */

.col-status {
  display: flex;
  align-items: center;
}

/* ----------------------------------------------------------------
   Favorite star
   ---------------------------------------------------------------- */

.col-star {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

@keyframes star-spring {
  0% { transform: scale(1); }
  20% { transform: scale(0.9); }
  50% { transform: scale(1.18); }
  75% { transform: scale(0.97); }
  100% { transform: scale(1); }
}

.star-animating {
  animation: star-spring 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* ----------------------------------------------------------------
   Three-dot menu
   ---------------------------------------------------------------- */

.col-menu {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
