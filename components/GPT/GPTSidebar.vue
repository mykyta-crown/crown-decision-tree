<template>
  <div class="gpt-sidebar" :class="{ 'gpt-sidebar--collapsed': collapsed }">
    <!-- Header with collapse button -->
    <div class="sidebar-header">
      <v-btn icon size="small" variant="text" class="ml-auto" @click="toggleCollapse">
        <v-icon size="20" color="#AEB0B2">
          {{ collapsed ? 'mdi-arrow-expand-right' : 'mdi-arrow-collapse-left' }}
        </v-icon>
      </v-btn>
    </div>

    <!-- Collapsed view - Icons only -->
    <div v-if="collapsed" class="sidebar-collapsed-content">
      <!-- GPT Icons -->
      <div class="collapsed-section">
        <v-tooltip v-for="gpt in gpts" :key="gpt.id" location="right" :text="gpt.name">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              size="small"
              variant="text"
              :class="{ 'icon-active': selectedGptId === gpt.id }"
              @click="$emit('select-gpt', gpt)"
            >
              <img
                :src="`/icons/gpts/${gpt.icon || 'diamond'}.svg`"
                :alt="gpt.name"
                class="gpt-icon-img"
              />
            </v-btn>
          </template>
        </v-tooltip>
      </div>

      <v-divider class="my-2" />

      <!-- Conversation Icons -->
      <div class="collapsed-section conversations-collapsed">
        <v-tooltip
          v-for="conversation in sortedConversations.slice(0, 5)"
          :key="conversation.id"
          location="right"
          :text="conversation.title"
        >
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              size="small"
              variant="text"
              :class="{ 'icon-active': selectedConversationId === conversation.id }"
              @click="$emit('select-conversation', conversation)"
            >
              <v-icon size="16" color="grey-darken-2"> mdi-message-text-outline </v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </div>
    </div>

    <!-- Expanded view - Full content -->
    <div v-if="!collapsed" class="sidebar-content">
      <!-- CROWN AI Section -->
      <div class="sidebar-section crown-ai-section">
        <div class="crown-ai-header">
          <h3 class="section-title">{{ t('gpts.title') }}</h3>
          <v-btn
            v-if="isAdmin"
            icon
            size="x-small"
            variant="text"
            class="add-gpt-btn-inline"
            @click="$emit('add-gpt')"
          >
            <img src="@/assets/icons/basic/plus-circle.svg" alt="Add GPT" width="20" height="20" />
          </v-btn>
        </div>
        <div class="gpt-items">
          <div
            v-for="gpt in gpts"
            :key="gpt.id"
            class="gpt-item"
            :class="{ 'gpt-item--active': selectedGptId === gpt.id }"
            @click="$emit('select-gpt', gpt)"
          >
            <div class="gpt-item-content">
              <img
                :src="`/icons/gpts/${gpt.icon || 'diamond'}.svg`"
                :alt="gpt.name"
                class="gpt-icon-img"
              />
              <span class="gpt-name">{{ gpt.name }}</span>
            </div>
            <div v-if="isAdmin" class="gpt-actions">
              <v-btn
                icon
                size="x-small"
                variant="text"
                class="edit-btn"
                @click.stop="$emit('rename-gpt', gpt)"
              >
                <v-icon size="14">mdi-pencil-outline</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
      </div>

      <!-- CHATS Section -->
      <div class="sidebar-section chats-section">
        <div class="section-header">
          <h3 class="section-title">{{ t('conversations.title') }}</h3>
          <v-btn
            icon
            size="x-small"
            variant="text"
            :class="['chevron-btn', { rotated: !projectsExpanded }]"
            @click="toggleProjects"
          >
            <img src="/icons/arrow-down.svg" alt="Toggle" class="chevron-icon" />
          </v-btn>
        </div>

        <div v-show="projectsExpanded" class="section-content chats-scrollable">
          <div
            v-for="conversation in sortedConversations"
            :key="conversation.id"
            class="chat-item"
            :class="{ 'chat-item--active': selectedConversationId === conversation.id }"
            @click="$emit('select-conversation', conversation)"
          >
            <span class="chat-name">{{ conversation.title }}</span>
            <div class="chat-actions">
              <v-btn
                icon
                size="x-small"
                variant="text"
                class="rename-btn"
                @click.stop="$emit('rename-conversation', conversation)"
              >
                <v-icon size="14">mdi-pencil-outline</v-icon>
              </v-btn>
              <v-btn
                icon
                size="x-small"
                variant="text"
                class="delete-btn"
                @click.stop="$emit('delete-conversation', conversation)"
              >
                <v-icon size="14">mdi-close</v-icon>
              </v-btn>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="!conversations.length" class="empty-state">
            <span class="text-caption text-grey">{{ t('conversations.empty') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Credits badge (absolute positioned at bottom within sidebar) -->
    <div v-if="!collapsed" class="credits-badge-fixed">
      <v-icon size="16" :color="creditsColor">mdi-wallet-outline</v-icon>
      <span class="credits-text">{{ creditsRemaining }} / {{ creditsTotal }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  gpts: {
    type: Array,
    default: () => []
  },
  selectedGptId: {
    type: String,
    default: null
  },
  conversations: {
    type: Array,
    default: () => []
  },
  selectedConversationId: {
    type: String,
    default: null
  },
  documents: {
    type: Array,
    default: () => []
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  creditsRemaining: {
    type: Number,
    default: 0
  },
  creditsTotal: {
    type: Number,
    default: 0
  },
  creditsPercentage: {
    type: Number,
    default: 100
  }
})

const emit = defineEmits([
  'select-gpt',
  'select-conversation',
  'rename-conversation',
  'delete-conversation',
  'toggle-collapse',
  'download-pdf',
  'rename-gpt',
  'delete-gpt',
  'add-gpt'
])

const { t } = useTranslations('gpts-chat')

const creditsColor = computed(() => {
  if (props.creditsPercentage < 20) return 'error'
  if (props.creditsPercentage < 50) return 'warning'
  return '#00CE7C'
})

const collapsed = ref(false)
const documentsExpanded = ref(true)
const projectsExpanded = ref(true)

const sortedConversations = computed(() => {
  return [...props.conversations].sort((a, b) => {
    return new Date(b.updated_at) - new Date(a.updated_at)
  })
})

const toggleDocuments = () => {
  documentsExpanded.value = !documentsExpanded.value
}

const toggleProjects = () => {
  projectsExpanded.value = !projectsExpanded.value
}

const getDocumentIcon = (fileType) => {
  if (fileType === 'application/pdf') return 'mdi-file-pdf-box'
  if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    return 'mdi-file-word-box'
  if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) return 'mdi-file-excel-box'
  return 'mdi-file-document'
}

const getDocumentColor = (fileType) => {
  if (fileType === 'application/pdf') return '#F05252'
  if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    return '#2B6CB0'
  if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) return '#2FD895'
  return 'grey'
}

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
  emit('toggle-collapse', collapsed.value)
}
</script>

<style scoped lang="scss">
.gpt-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-right: 1px solid #e9eaec;
  transition: width 0.3s ease;
  position: relative;

  &--collapsed {
    width: 54px !important;
    min-width: 54px !important;
  }
}

.sidebar-header {
  padding: 0 12px;
  border-bottom: 1px solid #e9eaec;
  flex-shrink: 0;
  height: 58px;
  display: flex;
  align-items: center;
}

.sidebar-collapsed-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #c5c7c9;
    border-radius: 4px;
  }
}

.collapsed-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  &.conversations-collapsed {
    flex: 1;
    overflow-y: auto;
  }
}

.icon-active {
  background-color: #f3f2ff !important;

  :deep(.v-icon) {
    color: rgb(var(--v-theme-primary)) !important;
  }
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 80px; // Extra padding for credits badge
  display: flex;
  flex-direction: column;
  gap: 24px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #c5c7c9;
    border-radius: 4px;
  }
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.crown-ai-section {
  gap: 4px;
}

.chats-section {
  gap: 4px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 20px;
}

.crown-ai-header {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 20px;
}

.add-gpt-btn-inline {
  margin-left: auto;
  padding: 0;
}

.section-title {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  color: #8e8e8e;
  text-transform: uppercase;
  margin: 0;
  height: 20px;
  display: flex;
  align-items: center;
}

.section-content {
  display: flex;
  flex-direction: column;
}

.chats-scrollable {
  // No max-height or overflow - let parent handle scrolling
  display: flex;
  flex-direction: column;
}

// GPT Items
.gpt-items {
  display: flex;
  flex-direction: column;
}

.gpt-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  height: 37px;
  min-height: 37px;
  max-height: 37px;
  position: relative;

  &:hover {
    background-color: transparent;
  }

  &--active {
    background-color: #f8f8f8;
  }

  .gpt-actions {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
    background-color: rgba(255, 255, 255, 0.95);
    padding: 2px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 10;
  }

  &:hover .gpt-actions {
    opacity: 1;
  }

  .edit-btn {
    :deep(.v-icon) {
      color: #aeb0b2;
    }

    &:hover {
      background-color: rgba(0, 0, 0, 0.05);

      :deep(.v-icon) {
        color: #1d1d1b;
      }
    }
  }
}

.gpt-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.gpt-item-menu-btn {
  opacity: 1;
  flex-shrink: 0;

  :deep(.v-icon) {
    color: #1d1d1b;
  }
}

.gpt-icon-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  display: block;
  flex-shrink: 0;
}

.gpt-name {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #1d1d1b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.add-gpt-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 20px;
  margin-top: 4px;
}

.add-gpt-btn {
  width: 20px;
  height: 20px;
  min-width: 20px;
  padding: 0;

  :deep(.v-btn__content) {
    width: 20px;
    height: 20px;
  }
}

// Document List
.document-list {
  display: flex;
  flex-direction: column;
}

.document-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-radius: 4px;

  &:hover {
    background-color: #f5f5f5;
  }
}

.document-info {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.document-name {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: normal;
  color: #1d1d1b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// Chat List
.chat-item {
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
  height: 37px;
  min-height: 37px;
  max-height: 37px;

  &:hover {
    background-color: transparent;

    .delete-btn {
      opacity: 1 !important;
    }
  }

  &--active {
    background-color: #f8f8f8;
  }

  .chat-actions {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
    background-color: rgba(255, 255, 255, 0.95);
    padding: 2px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 10;
  }

  &:hover .chat-actions {
    opacity: 1;
  }

  .rename-btn,
  .delete-btn {
    :deep(.v-icon) {
      color: #aeb0b2;
    }

    &:hover {
      background-color: rgba(0, 0, 0, 0.05);

      :deep(.v-icon) {
        color: #1d1d1b;
      }
    }
  }
}

.chat-name {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #1d1d1b;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.empty-state {
  padding: 16px;
  text-align: center;
}

// Credits Badge (absolute positioned at bottom within sidebar)
.credits-badge-fixed {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #ffffff;
  padding: 8px 16px;
  border-radius: 100px;
  border: 1px solid #e9eaec;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  width: fit-content;

  .credits-text {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 500;
    line-height: normal;
    color: #1d1d1b;
    white-space: nowrap;
  }
}

.chevron-btn {
  transition: transform 0.2s ease;

  &.rotated {
    transform: rotate(180deg);
  }
}

.chevron-icon {
  width: 20px;
  height: 20px;
  display: block;
}

// GPT Actions Menu Styling (matching Figma design)
:deep(.gpt-actions-menu) {
  background-color: #f8f8f8;
  border-radius: 4px;
  box-shadow: 0px 4px 20px 0px rgba(177, 177, 177, 0.4);
  padding: 0;

  .v-list-item {
    padding: 8px 12px;
    min-height: auto;

    .v-list-item__prepend {
      margin-inline-end: 0 !important;
    }

    &.menu-item-primary {
      .v-list-item__prepend {
        .v-icon {
          margin-right: 8px;
        }
      }
    }

    &.menu-item-secondary {
      .v-list-item__prepend {
        .v-icon {
          margin-right: 8px;
        }
      }
    }

    &.menu-item-primary {
      background-color: #ffffff;
      border-radius: 4px 4px 0 0;

      .v-list-item-title {
        color: #1d1d1b;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
        font-weight: 400;
        line-height: 1.5;
      }

      .v-icon {
        color: #1d1d1b;
      }

      &:hover:not(.v-list-item--disabled) {
        background-color: #fafafa;
      }

      &.v-list-item--disabled {
        opacity: 0.5;
        cursor: not-allowed;

        .v-list-item-title,
        .v-icon {
          color: #8e8e8e;
        }
      }
    }

    &.menu-item-secondary {
      background-color: #f8f8f8;

      .v-list-item-title {
        color: #787878;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
        font-weight: 400;
        line-height: 1.5;
      }

      .v-icon {
        color: #787878;
      }

      &:hover {
        background-color: #eeeeee;
      }

      &:last-child {
        border-radius: 0 0 4px 4px;
      }
    }
  }
}
</style>
