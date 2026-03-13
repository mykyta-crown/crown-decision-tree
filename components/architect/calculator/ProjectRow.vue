<script setup lang="ts">
import { computed, ref } from 'vue'
import { fmtDate } from '~/utils/decisionTree/formatting'
import useTranslations from '~/composables/useTranslations'

const { t } = useTranslations('decisiontree')

interface ProjectState {
  lots?: any[]
  [key: string]: any
}

interface Project {
  id: string | number
  name: string
  client?: string
  created?: string | null
  lastActive?: string | null
  topFamily?: string
  owner?: string
  status?: string
  favorite?: boolean
  state?: ProjectState
}

const props = defineProps<{
  project: Project
  selected?: boolean
}>()

const emit = defineEmits<{
  click: []
  toggleSelect: []
  toggleFavorite: []
  edit: []
  archive: []
  duplicate: []
  delete: []
}>()

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Recommended: { bg: '#DDFBEE', text: '#007C4A' },
  eAuction: { bg: '#DFF0FF', text: '#1A49A9' },
  Closed: { bg: '#DFF0FF', text: '#1A49A9' },
  Upcoming: { bg: '#DFF0FF', text: '#1A49A9' },
  'In progress': { bg: '#FDFFD2', text: '#9F580A' },
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
      <v-checkbox :model-value="props.selected" hide-details density="compact" color="#1D1D1B" @update:model-value="emit('toggleSelect')" />
    </div>

    <!-- Col 2: Project name -->
    <div class="col-name">
      <span class="name-text">{{ project.name }}</span>
    </div>

    <!-- Col 3: Client -->
    <div class="col-cell">
      {{ project.client || 'Crown' }}
    </div>

    <!-- Col 4: Created date -->
    <div class="col-cell">
      {{ fmtDate(project.created) }}
    </div>

    <!-- Col 5: Last modified date -->
    <div class="col-cell">
      {{ fmtDate(project.lastActive) }}
    </div>

    <!-- Col 6: Top family -->
    <div class="col-cell col-family">
      <span>{{ project.topFamily || '\u2014' }}</span>
      <v-icon v-if="hasMultipleLots" size="14" color="grey-ligthen-1">mdi-view-grid-outline</v-icon>
    </div>

    <!-- Col 7: Owner -->
    <div class="col-cell">
      {{ project.owner || 'You' }}
    </div>

    <!-- Col 8: Status badge -->
    <div class="col-status">
      <span class="status-badge" :style="statusStyle">
        {{ project.status || 'Draft' }}
      </span>
    </div>

    <!-- Col 9: Star / Favorite -->
    <div class="col-star" @click="onToggleFavorite">
      <v-icon
        :icon="project.favorite ? 'mdi-star' : 'mdi-star-outline'"
        :color="project.favorite ? 'green' : 'grey-ligthen-1'"
        size="18"
        :class="{ 'star-animating': starAnimating }"
      />
    </div>

    <!-- Col 10: Three-dot menu -->
    <div class="col-menu" @click.stop>
      <v-menu location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn icon variant="text" size="x-small" v-bind="menuProps">
            <v-icon size="18">mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list density="compact" min-width="180">
          <v-list-item prepend-icon="mdi-pencil-outline" @click="onMenuAction('edit')">
            <v-list-item-title class="text-body-2">{{ t('page.menuEdit') }}</v-list-item-title>
          </v-list-item>
          <v-list-item prepend-icon="mdi-archive-outline" @click="onMenuAction('archive')">
            <v-list-item-title class="text-body-2">{{ t('page.menuArchive') }}</v-list-item-title>
          </v-list-item>
          <v-list-item prepend-icon="mdi-content-copy" @click="onMenuAction('duplicate')">
            <v-list-item-title class="text-body-2">{{ t('page.menuDuplicate') }}</v-list-item-title>
          </v-list-item>
          <v-divider class="my-1" />
          <v-list-item prepend-icon="mdi-delete-outline" class="text-red" @click="onMenuAction('delete')">
            <v-list-item-title class="text-body-2">{{ t('page.menuDelete') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>

<style scoped>
.project-row {
  display: grid;
  grid-template-columns: 48px 2fr 1fr 1fr 1fr 1fr 1fr 140px 40px 44px;
  align-items: center;
  padding: 0 20px;
  height: 44px;
  border-bottom: 1px solid #F3F4F6;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.project-row:last-child {
  border-bottom: none;
}

.project-row:hover {
  background-color: #FAFAFA;
}

.col-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
}

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

.col-status {
  display: flex;
  align-items: center;
}

.status-badge {
  display: flex;
  height: 24px;
  width: 100px;
  padding: 4px 8px;
  justify-content: center;
  align-items: center;
  gap: 4px;
  border-radius: 4px;
  font-family: Poppins;
  font-size: 12px;
  font-weight: 400;
  white-space: nowrap;
  flex-shrink: 0;
  box-sizing: border-box;
}

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

.col-menu {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Responsive ── */
@media (max-width: 1100px) {
  .project-row {
    grid-template-columns: 40px 2fr 1fr 1fr 1fr 1fr 1fr 100px 36px 40px;
  }
}

@media (max-width: 900px) {
  .project-row {
    grid-template-columns: 36px 1fr auto auto;
    gap: 8px;
    height: auto;
    padding: 10px 12px;
  }
  /* Hide less important columns on mobile */
  .col-cell:nth-child(3),  /* client */
  .col-cell:nth-child(4),  /* created */
  .col-cell:nth-child(5),  /* modified */
  .col-cell:nth-child(6),  /* type */
  .col-cell:nth-child(7) { /* owner */
    display: none;
  }
  .col-star {
    display: none;
  }
}
</style>
