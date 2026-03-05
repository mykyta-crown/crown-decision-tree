<template>
  <div class="conversation-list">
    <v-list-subheader class="text-overline"> CHATS </v-list-subheader>

    <v-list v-if="conversations.length > 0">
      <v-list-item
        v-for="conversation in sortedConversations"
        :key="conversation.id"
        :value="conversation.id"
        :active="selectedConversationId === conversation.id"
        class="conversation-item"
        @click="$emit('select', conversation)"
      >
        <v-list-item-title
          class="text-body-2 font-weight-medium"
          :class="{ 'typing-animation': titleBeingAnimated === conversation.id }"
        >
          {{ titleBeingAnimated === conversation.id ? displayedTitle : conversation.title }}
        </v-list-item-title>

        <v-list-item-subtitle class="text-caption">
          {{ formatDate(conversation.updated_at) }}
        </v-list-item-subtitle>

        <template #append>
          <v-btn
            icon
            size="small"
            variant="flat"
            color="error"
            class="delete-btn"
            @click.stop="$emit('delete', conversation)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-list-item>
    </v-list>

    <!-- Empty state -->
    <div v-else class="empty-state text-center pa-4">
      <v-icon size="48" color="grey-lighten-1">mdi-chat-outline</v-icon>
      <p class="text-caption text-grey-darken-1 mt-2">No conversations yet</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  conversations: {
    type: Array,
    default: () => []
  },
  selectedConversationId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['select', 'rename', 'delete'])

// Animation state
const titleBeingAnimated = ref(null)
const displayedTitle = ref('')

const sortedConversations = computed(() => {
  return [...props.conversations].sort((a, b) => {
    return new Date(b.updated_at) - new Date(a.updated_at)
  })
})

/**
 * Typing animation effect for title updates
 */
const animateTyping = async (conversationId, newTitle) => {
  titleBeingAnimated.value = conversationId
  displayedTitle.value = ''

  // Type each character with 30ms delay
  for (let i = 0; i <= newTitle.length; i++) {
    displayedTitle.value = newTitle.substring(0, i)
    await new Promise((resolve) => setTimeout(resolve, 30))
  }

  // Keep highlight for 1s after typing completes
  setTimeout(() => {
    titleBeingAnimated.value = null
  }, 1000)
}

/**
 * Listen for title update events
 */
const handleTitleUpdate = (event) => {
  const { conversationId, title } = event.detail
  animateTyping(conversationId, title)
}

// Setup event listener
onMounted(() => {
  window.addEventListener('conversation-title-updated', handleTitleUpdate)
})

onUnmounted(() => {
  window.removeEventListener('conversation-title-updated', handleTitleUpdate)
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes === 0 ? 'Just now' : `${minutes}m ago`
    }
    return `${hours}h ago`
  }

  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString()
}
</script>

<style scoped lang="scss">
.conversation-list {
  .conversation-item {
    border-radius: 8px;
    margin-bottom: 4px;
    transition: all 0.2s;
    position: relative;

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);

      :deep(.delete-btn) {
        opacity: 1 !important;
      }
    }

    :deep(.v-list-item__append) {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      margin: 0 !important;
      z-index: 10;
    }

    :deep(.delete-btn) {
      opacity: 0 !important;
      transition: opacity 0.2s ease;
      color: #1d1d1b !important;
      background-color: rgba(255, 255, 255, 0.9) !important;

      &:hover {
        background-color: rgba(0, 0, 0, 0.05) !important;
      }
    }
  }

  .empty-state {
    opacity: 0.6;
  }

  .typing-animation {
    background: linear-gradient(90deg, #00d072 0%, transparent 100%);
    background-size: 200% 100%;
    animation: highlight 2s ease-out;
    padding: 2px 4px;
    border-radius: 4px;
  }

  @keyframes highlight {
    0% {
      background-position: 0% 50%;
      opacity: 0.3;
    }
    50% {
      background-position: 100% 50%;
      opacity: 0.5;
    }
    100% {
      background-position: 200% 50%;
      opacity: 0;
    }
  }
}
</style>
