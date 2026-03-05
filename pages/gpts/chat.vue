<template>
  <div class="gpts-chat-page">
    <div class="chat-container">
      <!-- Left Sidebar: GPTs + Documents + Projects -->
      <div class="sidebar-left-panel" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <GPTSidebar
          :gpts="gpts"
          :selected-gpt-id="selectedGptId"
          :conversations="conversations"
          :selected-conversation-id="currentConversationId"
          :documents="documents"
          :is-admin="isAdmin"
          :credits-remaining="creditsRemaining"
          :credits-total="creditsTotal"
          :credits-percentage="creditsPercentage"
          @select-gpt="selectGPT"
          @select-conversation="selectConversation"
          @rename-conversation="renameConversation"
          @delete-conversation="deleteConversation"
          @toggle-collapse="handleSidebarCollapse"
          @download-pdf="downloadConversationPDF"
          @rename-gpt="editCurrentGPT"
          @delete-gpt="deleteCurrentGPT"
          @add-gpt="navigateTo('/gpts/create')"
        />
      </div>

      <!-- Main chat area -->
      <div class="chat-area">
        <!-- Empty state -->
        <div v-if="!currentGPT" class="empty-state">
          <!-- Header -->
          <div class="empty-state-header">
            <h3 class="empty-state-title">{{ t('title') }}</h3>
            <v-icon size="20" color="#8E8E8E">mdi-sparkles</v-icon>
          </div>

          <!-- Content -->
          <div class="empty-state-content">
            <!-- Illustration -->
            <div class="empty-state-illustration">
              <svg
                width="131"
                height="115"
                viewBox="0 0 131 115"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="0.275594"
                  y="0.221239"
                  width="68.3162"
                  height="78.232"
                  rx="2.19022"
                  transform="matrix(0.994024 -0.109158 0.108351 0.994113 14.4621 30.1212)"
                  stroke="#1D1D1B"
                  stroke-width="0.5"
                />
                <rect
                  width="14.4248"
                  height="3.07014"
                  rx="1.53507"
                  transform="matrix(0.999102 -0.0423651 0.0418515 0.999124 25.5879 41.8857)"
                  fill="#DCD7FE"
                />
                <rect
                  width="13.3651"
                  height="3.07014"
                  rx="1.53507"
                  transform="matrix(0.999102 -0.0423651 0.0418515 0.999124 26.25 52.3652)"
                  fill="#DCD7FE"
                />
                <path
                  d="M40.8965 16.3906H96.4346C97.6442 16.3906 98.625 17.3714 98.625 18.5811V43.1504C98.625 44.0656 98.056 44.8841 97.1982 45.2031L94.8223 46.0869C93.1387 46.7129 92.5093 48.7907 93.4424 50.2998C94.7255 52.3746 96.532 55.5717 98.293 59.626L98.6445 60.4482C101.985 69.3123 102.532 76.3415 102.897 81.8594C103 83.402 103.003 84.7396 102.539 86.1445C102.075 87.5488 101.135 89.0441 99.3086 90.876C98.4432 91.744 96.8167 92.5307 94.8184 93.2188C92.8309 93.903 90.5146 94.4777 88.3057 94.9395C86.0979 95.401 84.0026 95.7488 82.459 95.9814C81.6873 96.0977 81.0537 96.1848 80.6133 96.2432C80.3931 96.2723 80.2212 96.295 80.1045 96.3096C80.0462 96.3169 80.0016 96.3216 79.9717 96.3252C79.9605 96.3266 79.9514 96.3283 79.9443 96.3291H40.8965C39.6869 96.3291 38.7061 95.3483 38.7061 94.1387V18.5811C38.7061 17.3714 39.6869 16.3906 40.8965 16.3906Z"
                  fill="#F8F8F8"
                  stroke="#1D1D1B"
                  stroke-width="0.5"
                />
                <path
                  d="M4.88236 67.7197L4.94908 68.2651C5.26099 70.815 7.22686 72.8483 9.76472 73.246C7.22686 73.6438 5.26099 75.6771 4.94908 78.227L4.88236 78.7724L4.81564 78.227C4.50372 75.6771 2.53785 73.6438 0 73.246C2.53785 72.8483 4.50372 70.815 4.81564 68.2651L4.88236 67.7197Z"
                  fill="#FDF6B2"
                />
                <path
                  d="M118.099 11.6748C118.783 14.6781 121.041 17.0751 123.983 17.9434C121.041 18.8114 118.783 21.2092 118.099 24.2119C117.414 21.2089 115.155 18.8112 112.213 17.9434C115.155 17.0752 117.415 14.6783 118.099 11.6748Z"
                  fill="#FDF6B2"
                  stroke="#1D1D1B"
                  stroke-width="0.5"
                />
                <path
                  d="M0.3125 114.693H130"
                  stroke="#1D1D1B"
                  stroke-width="0.5"
                  stroke-linecap="round"
                />
                <path
                  d="M69.0513 101.744C71.2236 103.42 71.5999 106.566 69.8848 108.708C68.1544 110.87 64.9844 111.153 62.8979 109.333L43.318 92.2488L39.481 88.8997L44.4966 82.7981L49.0751 86.3323L69.0513 101.744Z"
                  fill="#FFE1CB"
                  stroke="#1D1D1B"
                  stroke-width="0.5"
                />
                <rect
                  x="0.351014"
                  y="-0.0322252"
                  width="23.8154"
                  height="17.1914"
                  transform="matrix(0.637189 -0.770708 0.766866 0.641807 21.0271 85.302)"
                  fill="#FFE1CB"
                  stroke="#1D1D1B"
                  stroke-width="0.5"
                />
                <rect
                  x="0.0480936"
                  y="0.351316"
                  width="25.9311"
                  height="7.88562"
                  rx="3.94281"
                  transform="matrix(0.794695 0.607008 -0.602321 0.798254 36.1512 59.1647)"
                  fill="#FFE1CB"
                  stroke="#1D1D1B"
                  stroke-width="0.5"
                />
                <rect
                  x="0.0480936"
                  y="0.351316"
                  width="25.9311"
                  height="7.88562"
                  rx="3.94281"
                  transform="matrix(0.794695 0.607008 -0.602321 0.798254 19.3172 80.6559)"
                  fill="#FFE1CB"
                  stroke="#1D1D1B"
                  stroke-width="0.5"
                />
                <path
                  d="M15.2627 105.426H36.0176C39.2487 105.426 41.8682 108.045 41.8682 111.276V114.75H9.41211V111.276C9.41211 108.045 12.0315 105.426 15.2627 105.426Z"
                  fill="#FFE1CB"
                  stroke="#1D1D1B"
                  stroke-width="0.5"
                />
                <rect
                  x="48.2207"
                  y="30.2637"
                  width="26.853"
                  height="3.07018"
                  rx="1.53509"
                  fill="#DCD7FE"
                />
                <rect
                  x="48.2207"
                  y="40.0879"
                  width="22.5809"
                  height="3.07018"
                  rx="1.53509"
                  fill="#DCD7FE"
                />
                <rect
                  x="48.2207"
                  y="52.3682"
                  width="23.8015"
                  height="3.07018"
                  rx="1.53509"
                  fill="#DCD7FE"
                />
                <rect
                  x="48.2207"
                  y="61.5791"
                  width="15.8677"
                  height="3.07018"
                  rx="1.53509"
                  fill="#DCD7FE"
                />
                <ellipse cx="14.6855" cy="20.1339" rx="2.14257" ry="2.14762" fill="#DCD7FE" />
                <ellipse cx="118.404" cy="76.93" rx="1.83088" ry="1.84211" fill="#FDE8E8" />
                <path
                  d="M78.7343 47.7632L116.878 46.5352L117.793 48.6843V55.1316L117.183 58.5088L115.657 63.4211L113.216 67.7194L108.944 72.0176L104.672 75.0878L103.451 78.158L104.062 80.6141L107.113 83.6843L110.775 86.4474L113.216 89.2106L115.962 93.5088L117.488 98.1141L118.098 102.719V107.325H78.124L78.4292 100.57L80.2601 94.1229L83.3115 89.2106L87.5836 84.9123L91.2454 81.8422L92.7711 80.0001L93.0762 77.8509L92.466 76.0088L88.8042 72.9387L85.4476 70.1755L81.4806 64.9562L79.3446 59.4299L78.4292 52.9825L78.7343 47.7632Z"
                  fill="#F8F8F8"
                />
                <path
                  d="M78.4541 40.9521H118.074C120.14 40.9521 121.815 42.6271 121.815 44.6934C121.815 46.7596 120.14 48.4346 118.074 48.4346H78.4541C76.3879 48.4346 74.7129 46.7596 74.7129 44.6934C74.7129 42.6272 76.3879 40.9522 78.4541 40.9521Z"
                  fill="#F8F8F8"
                  stroke="#1D1D1B"
                  stroke-width="0.5"
                />
                <path
                  d="M118.099 107.018C118.506 101.39 118.405 91.6674 106.809 83.3779C101.561 79.6267 102.842 76.0095 107.114 73.2464C119.32 65.3515 117.794 52.9832 117.794 48.3779"
                  stroke="#1D1D1B"
                  stroke-width="0.5"
                  stroke-linecap="round"
                />
                <path
                  d="M78.2366 107.018C77.8297 101.39 77.9314 91.6674 89.527 83.3779C94.7744 79.6267 93.4939 76.0095 89.2219 73.2464C77.016 65.3515 78.5417 52.9832 78.5417 48.3779"
                  stroke="#1D1D1B"
                  stroke-width="0.5"
                  stroke-linecap="round"
                />
                <path
                  d="M98.2648 95.9658C92.6501 95.9658 86.364 103.334 83.9229 107.018H112.607C110.166 103.334 103.879 95.9658 98.2648 95.9658Z"
                  fill="#CFE6FF"
                />
                <path
                  d="M98.2648 72.6318C94.0311 72.6318 89.2421 68.6169 86.2267 64.9307C85.0593 63.5036 86.1528 61.5792 87.9965 61.5792H108.063C110.008 61.5792 111.119 63.7116 109.848 65.1852C106.792 68.7299 102.351 72.6318 98.2648 72.6318Z"
                  fill="#CFE6FF"
                />
                <rect
                  x="74.7129"
                  y="107.268"
                  width="47.103"
                  height="7.48246"
                  rx="3.74123"
                  fill="#F8F8F8"
                  stroke="#1D1D1B"
                  stroke-width="0.5"
                />
              </svg>
            </div>

            <!-- Message -->
            <p class="empty-state-message">
              {{ t('welcome.description') }}
            </p>
          </div>
        </div>

        <!-- Chat interface -->
        <div v-else class="chat-interface">
          <!-- Chat header -->
          <div class="chat-header">
            <div class="header-left">
              <h3 class="gpt-title">{{ conversationTitle }}</h3>
              <v-btn
                v-if="currentConversationId"
                icon
                size="small"
                variant="text"
                class="edit-icon-btn"
                @click="
                  renameConversation(conversations.find((c) => c.id === currentConversationId))
                "
              >
                <img src="/icons/edit-line.svg" alt="Edit" class="edit-icon" />
              </v-btn>
            </div>

            <div class="header-right">
              <!-- Model info container -->
              <div class="model-info-container">
                <div class="provider-display disabled">
                  <span class="provider-text">
                    {{ getModelDisplayName(currentGPT?.recommended_model) }}
                  </span>
                </div>
              </div>

              <v-menu v-if="isAdmin" location="bottom end" offset="10">
                <template #activator="{ props }">
                  <v-btn
                    icon="mdi-dots-vertical"
                    variant="text"
                    size="small"
                    v-bind="props"
                    class="gpt-menu-button"
                  />
                </template>

                <v-list class="gpt-actions-menu" density="compact">
                  <v-list-item class="menu-item-primary" disabled @click="downloadConversationPDF">
                    <template #prepend>
                      <img src="/icons/download-dark.svg" alt="Download" class="menu-icon" />
                    </template>
                    <v-list-item-title class="text-body-2">{{
                      t('menu.download_pdf')
                    }}</v-list-item-title>
                  </v-list-item>

                  <v-list-item class="menu-item-primary" disabled>
                    <template #prepend>
                      <v-icon size="20" color="#787878">mdi-wallet-outline</v-icon>
                    </template>
                    <v-list-item-title class="text-body-2">{{
                      t('menu.update_credits')
                    }}</v-list-item-title>
                  </v-list-item>

                  <v-list-item class="menu-item-secondary" @click="editCurrentGPT">
                    <template #prepend>
                      <img src="/icons/edit-line.svg" alt="Edit" class="menu-icon" />
                    </template>
                    <v-list-item-title class="text-body-2">{{ t('menu.edit') }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>

          <!-- Messages area -->
          <div ref="messagesContainer" class="messages-area">
            <div class="messages-content">
              <!-- Messages -->
              <ChatMessage
                v-for="message in messages"
                :key="message.id"
                :message="message"
                :show-reasoning="currentGPT?.show_reasoning !== false"
              />

              <!-- Conversation starters (show after welcome message is complete) -->
              <div
                v-if="
                  messages.length === 1 &&
                  messages[0]?.role === 'assistant' &&
                  messages[0]?.status === 'completed' &&
                  translatedStarters?.length > 0
                "
                class="conversation-starters"
              >
                <p class="suggestions-label">{{ t('chat.suggestions') }}</p>
                <div class="starters-grid">
                  <div
                    v-for="(starter, index) in translatedStarters"
                    :key="index"
                    class="starter-card"
                    @click="sendMessage(starter)"
                  >
                    {{ starter }}
                  </div>
                </div>
              </div>

              <!-- Scroll anchor -->
              <div ref="scrollAnchor" />
            </div>
          </div>

          <!-- Chat input -->
          <div class="chat-input-area">
            <ChatInput
              ref="chatInputRef"
              :disabled="isSending || !hasEnoughCredits || uploading"
              :loading="isSending"
              :uploading="uploading"
              :upload-progress="uploadProgress"
              :uploading-file-name="uploadingFileName"
              :placeholder="inputPlaceholder"
              :documents="documents"
              :show-upload-tooltip="showUploadTooltip"
              @send="sendMessage"
              @upload-document="handleDocumentUpload"
              @remove-document="handleDocumentDelete"
            />
            <p v-if="!hasEnoughCredits" class="text-caption text-error text-center mt-2">
              {{ t('errors.insufficient_credits') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Rename Dialog -->
    <v-dialog v-model="renameDialog" max-width="500" class="rename-dialog">
      <v-card class="rename-card">
        <!-- Header with title and close button -->
        <div class="rename-header">
          <div class="rename-title-row">
            <h3 class="rename-title">{{ t('conversations.rename_title') }}</h3>
            <v-btn icon size="small" variant="text" class="close-btn" @click="renameDialog = false">
              <v-icon size="20" color="#C5C7C9">mdi-close</v-icon>
            </v-btn>
          </div>
          <v-divider class="header-divider" />
        </div>

        <!-- Content -->
        <div class="rename-content">
          <!-- Input Field -->
          <div class="input-field">
            <label class="input-label">{{ t('conversations.rename_label') }}</label>
            <v-text-field
              v-model="newConversationTitle"
              :placeholder="t('conversations.rename_placeholder')"
              variant="outlined"
              density="compact"
              hide-details
              autofocus
              class="title-input"
              @keyup.enter="confirmRename"
            />
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <v-btn
              :text="t('actions.cancel')"
              variant="outlined"
              class="cancel-btn-custom"
              @click="renameDialog = false"
            />
            <v-btn
              :text="t('actions.rename')"
              variant="flat"
              :disabled="!newConversationTitle.trim()"
              class="rename-btn-custom"
              @click="confirmRename"
            />
          </div>
        </div>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="617" class="delete-dialog">
      <v-card class="delete-card">
        <!-- Header with title and close button -->
        <div class="delete-header">
          <div class="delete-title-row">
            <h3 class="delete-title">{{ t('conversations.delete_title') }}</h3>
            <v-btn icon size="small" variant="text" class="close-btn" @click="deleteDialog = false">
              <v-icon size="20" color="#C5C7C9">mdi-close</v-icon>
            </v-btn>
          </div>
          <v-divider class="header-divider" />
        </div>

        <!-- Content -->
        <div class="delete-content">
          <!-- Confirmation Message -->
          <div class="delete-message">
            <p class="delete-main-message">{{ t('conversations.delete_confirmation') }}</p>
            <p class="delete-sub-message">
              {{
                t('conversations.delete_description', { title: conversationToDelete?.title || '' })
              }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <v-btn
              :text="t('actions.cancel')"
              variant="outlined"
              class="cancel-btn-custom"
              @click="deleteDialog = false"
            />
            <v-btn
              :text="t('actions.delete')"
              variant="flat"
              class="delete-btn-custom"
              @click="confirmDelete"
            />
          </div>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import ChatMessage from '~/components/GPT/ChatMessage.vue'
import ChatInput from '~/components/GPT/ChatInput.vue'
import GPTSidebar from '~/components/GPT/GPTSidebar.vue'

definePageMeta({
  middleware: ['gpt-access']
})

const route = useRoute()
const toast = useToast()
const { isAdmin } = useUser()
const { t } = useTranslations('gpts-chat')
const { gpts, fetchGPTs, deleteGPT: deleteGPTFromAPI } = useGPTs()
const {
  conversations,
  messages,
  messagesRaw,
  createConversation,
  fetchConversations,
  fetchMessages,
  sendMessage: sendMsg,
  generateTitle,
  updateConversationTitle,
  deleteConversation: deleteConv,
  restoreConversation,
  listenToConversation,
  listenToMessageStream,
  stopListening
} = useConversations()
const {
  creditsRemaining,
  creditsTotal,
  creditsPercentage,
  hasEnoughCredits,
  listenToCredits,
  stopListening: stopCreditsListening
} = useCredits()
const {
  documents,
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  validateFile,
  uploading,
  uploadProgress,
  reset: resetDocuments
} = useDocuments()

const selectedGptId = ref(null)
const currentConversationId = ref(null)
const currentGPT = ref(null)
const isSending = ref(false)
const messagesContainer = ref(null)
const scrollAnchor = ref(null)
const chatInputRef = ref(null)
const sidebarCollapsed = ref(false)
const showUploadTooltip = ref(false)
const uploadingFileName = ref('')
const translatedStarters = ref([])

// Get user locale
const getUserLocale = () => {
  if (import.meta.client) {
    return localStorage.getItem('crown-locale') || 'en'
  }
  return 'en'
}

// Translate conversation starters if needed
const translateStarters = async (starters, gpt) => {
  if (!starters || starters.length === 0) {
    translatedStarters.value = []
    return
  }

  const locale = getUserLocale()

  try {
    const { translations } = await $fetch('/api/translate', {
      method: 'POST',
      body: {
        texts: starters,
        targetLocale: locale,
        context: gpt ? { name: gpt.name, instructions: gpt.instructions } : null
      }
    })
    translatedStarters.value = translations || starters
  } catch (error) {
    console.error('Failed to translate starters:', error)
    translatedStarters.value = starters
  }
}

// Rename dialog state
const renameDialog = ref(false)
const conversationToRename = ref(null)
const newConversationTitle = ref('')

// Delete dialog state
const deleteDialog = ref(false)
const conversationToDelete = ref(null)

const creditsColor = computed(() => {
  if (creditsPercentage.value < 20) return 'error'
  if (creditsPercentage.value < 50) return 'warning'
  return 'success'
})

const conversationTitle = computed(() => {
  if (currentConversationId.value) {
    const conv = conversations.value.find((c) => c.id === currentConversationId.value)
    return conv?.title || t('conversations.empty')
  }
  return currentGPT.value?.name || t('gpts.select')
})

const inputPlaceholder = computed(() => {
  if (!hasEnoughCredits.value) return t('credits.empty')
  if (isSending.value) return t('chat.generating')
  return t('chat.placeholder')
})

const getProviderColor = (provider) => {
  const colors = {
    openai: '#10A37F',
    anthropic: '#CC785C',
    gemini: '#4285F4'
  }
  return colors[provider] || 'grey'
}

const getProviderName = (provider) => {
  const names = {
    openai: 'Chat GPT',
    anthropic: 'Claude',
    gemini: 'Gemini',
    google: 'Gemini',
    mistral: 'Mistral',
    xai: 'Grok'
  }
  return names[provider] || 'Chat GPT'
}

const getModelDisplayName = (recommendedModel) => {
  if (!recommendedModel) return ''

  // Extract model name from format "provider/model-name"
  const modelPart = recommendedModel.split('/')[1]
  if (!modelPart) return ''

  // Convert to readable format
  const modelNames = {
    o3: 'OpenAI o3',
    o1: 'OpenAI o1',
    'o1-pro': 'OpenAI o1-pro',
    'gpt-5': 'GPT-5',
    'gpt-5.1-chat': 'GPT-5.1 Chat',
    'gpt-5-mini': 'GPT-5 Mini',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'claude-sonnet-4.5': 'Claude Sonnet 4.5',
    'claude-sonnet-4': 'Claude Sonnet 4',
    'claude-3.5-sonnet': 'Claude 3.5 Sonnet',
    'claude-3-opus': 'Claude 3 Opus',
    'claude-3-sonnet': 'Claude 3 Sonnet',
    'gemini-3-pro-preview': 'Gemini 3 Pro Preview',
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'gemini-2.0-flash-exp:free': 'Gemini 2.0 Flash',
    'gemini-flash-1.5-8b': 'Gemini Flash 1.5 8B',
    'gemini-flash-1.5': 'Gemini Flash 1.5',
    'mistral-7b-instruct': 'Mistral 7B Instruct',
    'grok-3': 'Grok 3',
    'grok-3-mini': 'Grok 3 Mini',
    'grok-4': 'Grok 4',
    'grok-beta': 'Grok Beta',
    grok: 'Grok'
  }

  return modelNames[modelPart] || modelPart
}

// All models grouped by provider (most recent models only)
// Note: Model selector removed from UI, but kept for reference
const allModels = [
  { label: 'ChatGPT 5', value: 'openai/gpt-5', provider: 'openai' },
  { label: 'ChatGPT 5 Mini', value: 'openai/gpt-5-mini', provider: 'openai' },
  { label: 'Claude Sonnet 4.5', value: 'anthropic/claude-sonnet-4.5', provider: 'anthropic' },
  { label: 'Grok 4', value: 'x-ai/grok-4', provider: 'x-ai' },
  { label: 'Gemini 3 Pro Preview', value: 'google/gemini-3-pro-preview', provider: 'google' },
  { label: 'Gemini 2.5 Flash', value: 'google/gemini-2.5-flash', provider: 'google' }
]

const handleModelChange = async (modelValue) => {
  if (!currentGPT.value?.id) return

  try {
    // Extract provider from model value
    const provider = modelValue.split('/')[0]

    // Update via API
    const response = await $fetch(`/api/gpts/${currentGPT.value.id}`, {
      method: 'PATCH',
      body: {
        recommended_model: modelValue,
        provider: provider
      }
    })

    // Update local state
    currentGPT.value.recommended_model = modelValue
    currentGPT.value.provider = provider

    // Update in gpts list
    const gptIndex = gpts.value.findIndex((g) => g.id === currentGPT.value.id)
    if (gptIndex !== -1) {
      gpts.value[gptIndex].recommended_model = modelValue
      gpts.value[gptIndex].provider = provider
    }

    toast.success('Model updated successfully')
  } catch (error) {
    console.error('Failed to update model:', error)
    toast.error('Failed to update model')
  }
}

const selectGPT = async (gpt) => {
  selectedGptId.value = gpt.id
  currentGPT.value = gpt
  currentConversationId.value = null // Pas de conversation pour le moment

  // Arrêter l'écoute Realtime de l'ancienne conversation
  stopListening()

  // Vider les messages de l'ancienne conversation
  messagesRaw.value = []

  // Reset documents when switching to a new GPT
  documents.value = []

  // Translate conversation starters to user's language
  translateStarters(gpt.conversation_starters, gpt)

  // Show upload tooltip for new conversations
  showUploadTooltip.value = true

  // Afficher un message en cours de génération (loader)
  messagesRaw.value = [
    {
      id: 'welcome-loading',
      role: 'assistant',
      content: '',
      status: 'generating',
      created_at: new Date().toISOString()
    }
  ]

  // Scroll to bottom
  await nextTick()
  scrollToBottom()

  // Créer immédiatement la conversation pour générer le message d'accueil par l'IA
  try {
    const conversation = await createConversation(selectedGptId.value)
    currentConversationId.value = conversation.id

    // IMPORTANT : Vider les messages avant de charger pour éviter les doublons
    messagesRaw.value = []

    // Charger les messages AVANT de setup le listener pour éviter les doublons
    await fetchMessages(conversation.id)

    // Setup Realtime listener APRÈS avoir chargé les messages
    listenToConversation(conversation.id)
  } catch (error) {
    console.error('Error creating conversation:', error)
    // En cas d'erreur, afficher un message par défaut en deux phrases avec emoji et retour à la ligne
    const fallbackExample =
      gpt.conversation_starters && gpt.conversation_starters.length > 0
        ? `Par exemple, je peux vous aider avec : ${gpt.conversation_starters[0].toLowerCase()}.`
        : "Comment puis-je vous assister aujourd'hui ?"

    const fallbackMessage = `Bonjour 👋, je suis ${gpt.name}, ${gpt.description || 'votre assistant spécialisé'}.\n\n${fallbackExample}`
    messagesRaw.value = [
      {
        id: 'welcome-fallback',
        role: 'assistant',
        content: fallbackMessage,
        status: 'completed',
        created_at: new Date().toISOString()
      }
    ]
  }

  // Scroll to bottom
  await nextTick()
  scrollToBottom()
}

const selectConversation = async (conversation) => {
  currentConversationId.value = conversation.id
  currentGPT.value = conversation.gpts
  selectedGptId.value = conversation.gpt_id

  // Hide upload tooltip for existing conversations (unless no documents)
  showUploadTooltip.value = documents.value.length === 0

  // Arrêter l'écoute Realtime de l'ancienne conversation
  stopListening()

  // Vider les messages de l'ancienne conversation
  messagesRaw.value = []

  // Charger les messages
  await fetchMessages(conversation.id)

  // Setup Realtime listener
  listenToConversation(conversation.id)

  // Scroll to bottom
  await nextTick()
  scrollToBottom()
}

const createNewConversation = async () => {
  // Réinitialiser l'état pour permettre de sélectionner un nouveau GPT
  // La conversation sera créée lors du premier message
  currentConversationId.value = null
  selectedGptId.value = null
  currentGPT.value = null
  messagesRaw.value = []

  // Arrêter l'écoute Realtime si active
  if (realtimeChannel) {
    realtimeChannel.unsubscribe()
    realtimeChannel = null
  }
}

const sendMessage = async (content) => {
  if (!content.trim()) {
    resetDocuments()
    return
  }

  // La conversation devrait déjà exister à ce stade (créée lors de la sélection du GPT)
  if (!currentConversationId.value) {
    console.error('No conversation ID found')
    resetDocuments()
    return
  }

  isSending.value = true

  // IMPORTANT: Setup watcher AVANT d'envoyer le message
  // pour capturer le message assistant dès qu'il est créé
  let streamChannel = null
  let cleanupWatcher = null

  const unwatchInsert = watch(
    messages,
    (newMessages) => {
      // Chercher un nouveau message assistant avec status='generating'
      const assistantMessage = newMessages.find(
        (m) =>
          m.role === 'assistant' &&
          m.status === 'generating' &&
          m.conversation_id === currentConversationId.value
      )

      if (assistantMessage && !streamChannel) {
        console.log(
          '📡 Message assistant détecté, souscription immédiate au Broadcast:',
          assistantMessage.id
        )

        // Souscrire au Broadcast stream IMMÉDIATEMENT
        streamChannel = listenToMessageStream(assistantMessage.id)

        // Créer le watcher de cleanup
        cleanupWatcher = watch(
          () => messages.value.find((m) => m.id === assistantMessage.id),
          async (currentMsg) => {
            if (
              currentMsg &&
              (currentMsg.status === 'completed' || currentMsg.status === 'failed')
            ) {
              console.log('📡 Message terminé, fermeture du stream')
              if (streamChannel) {
                streamChannel.unsubscribe()
              }
              if (cleanupWatcher) {
                cleanupWatcher()
              }

              // Auto-focus input after AI response completes successfully
              if (currentMsg.status === 'completed') {
                await nextTick()
                chatInputRef.value?.focusInput()
              }
            }
          }
        )

        // Arrêter le watcher d'insertion
        unwatchInsert()
      }
    },
    { deep: true, immediate: true }
  )

  try {
    // Extract document IDs to attach to the message
    const documentIds = documents.value.map((doc) => doc.id)

    // Clear documents immediately after extracting IDs (before sending)
    resetDocuments()

    // Envoyer le message (le watcher ci-dessus capturera le message assistant dès sa création)
    await sendMsg(currentConversationId.value, content, documentIds)

    // Auto-generate title after 1st exchange for better UX
    // Wait for 3 messages: welcome + 1st user message + 1st assistant response
    setTimeout(async () => {
      // Check if we have 3 messages (1st complete exchange)
      if (messages.value.length === 3) {
        const lastMessage = messages.value[messages.value.length - 1]
        // Ensure it's a completed assistant message
        if (lastMessage.role === 'assistant' && lastMessage.status === 'completed') {
          try {
            const newTitle = await generateTitle(currentConversationId.value)
            // Emit event for typing animation (will be handled by ConversationList)
            window.dispatchEvent(
              new CustomEvent('conversation-title-updated', {
                detail: { conversationId: currentConversationId.value, title: newTitle }
              })
            )
          } catch (error) {
            console.error('Failed to generate title:', error)
          }
        }
      }
    }, 1000) // Wait 1s for assistant message to complete

    // Scroll to bottom after sending
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Error sending message:', error)
  } finally {
    // Clear documents after sending message (always, even if error)
    resetDocuments()
    isSending.value = false
  }
}

const renameConversation = (conversation) => {
  conversationToRename.value = conversation
  newConversationTitle.value = conversation.title
  renameDialog.value = true
}

const confirmRename = async () => {
  if (!conversationToRename.value || !newConversationTitle.value.trim()) {
    return
  }

  try {
    await updateConversationTitle(conversationToRename.value.id, newConversationTitle.value.trim())

    // Emit event for typing animation
    window.dispatchEvent(
      new CustomEvent('conversation-title-updated', {
        detail: {
          conversationId: conversationToRename.value.id,
          title: newConversationTitle.value.trim()
        }
      })
    )

    toast.success(t('toast.conversation_renamed'))
    renameDialog.value = false
  } catch (error) {
    console.error('Failed to rename conversation:', error)
    toast.error(t('errors.rename_conversation'))
  }
}

const deleteConversation = (conversation) => {
  conversationToDelete.value = conversation
  deleteDialog.value = true
}

const confirmDelete = async () => {
  if (!conversationToDelete.value) {
    return
  }

  try {
    // Delete immediately from UI
    await deleteConv(conversationToDelete.value.id)

    // If deleted conversation was active, select first available
    if (currentConversationId.value === conversationToDelete.value.id) {
      if (conversations.value.length > 0) {
        await selectConversation(conversations.value[0])
      } else {
        currentConversationId.value = null
        messagesRaw.value = []
      }
    }

    toast.success(t('toast.conversation_deleted'))
    deleteDialog.value = false
    conversationToDelete.value = null
  } catch (error) {
    console.error('Failed to delete conversation:', error)
    toast.error(t('errors.delete_conversation'))
  }
}

const editCurrentGPT = (gpt = null) => {
  // If gpt is an Event object (from @click), ignore it and use currentGPT
  const gptToEdit = gpt && gpt.id ? gpt : currentGPT.value
  if (gptToEdit?.id) {
    navigateTo(`/gpts/create?id=${gptToEdit.id}`)
  }
}

const downloadConversationPDF = () => {
  // TODO: Implement PDF download functionality
  toast.info(t('toast.pdf_coming_soon'))
}

const scrollToBottom = () => {
  if (scrollAnchor.value) {
    scrollAnchor.value.scrollIntoView({ behavior: 'smooth' })
  }
}

const handleDocumentUpload = async (file) => {
  // Validate
  const validation = validateFile(file)
  if (!validation.valid) {
    toast.error(validation.error)
    return
  }

  // Store filename for upload indicator
  uploadingFileName.value = file.name

  // La conversation devrait déjà exister (créée lors de la sélection du GPT)
  if (!currentConversationId.value) {
    toast.error('Please select a GPT first')
    uploadingFileName.value = ''
    return
  }

  // Upload
  try {
    await uploadDocument(currentConversationId.value, file)
    // Hide tooltip after successful upload
    showUploadTooltip.value = false
  } catch (err) {
    console.error('Upload failed:', err)
    toast.error('Failed to upload document')
  } finally {
    // Clear filename after upload completes
    uploadingFileName.value = ''
  }
}

const handleDocumentDelete = async (docId) => {
  try {
    await deleteDocument(currentConversationId.value, docId)
  } catch (err) {
    console.error('Delete failed:', err)
    toast.error('Failed to delete document')
  }
}

// Handle sidebar collapse
const handleSidebarCollapse = (isCollapsed) => {
  sidebarCollapsed.value = isCollapsed
}

// Watch currentConversationId to reset documents
// Documents should only show pending uploads, not documents from previous messages
watch(currentConversationId, () => {
  resetDocuments()
})

// Watch documents to update tooltip visibility
watch(documents, (newDocs) => {
  if (newDocs.length > 0) {
    showUploadTooltip.value = false
  }
})

// Watch messages for auto-scroll and auto-focus
watch(
  messages,
  async (newMessages, oldMessages) => {
    // Check if a new assistant message was completed
    if (newMessages.length > (oldMessages?.length || 0)) {
      const lastMessage = newMessages[newMessages.length - 1]
      if (lastMessage.role === 'assistant' && lastMessage.status === 'completed') {
        await nextTick()
        scrollToBottom()

        // Focus input after assistant response
        setTimeout(() => {
          chatInputRef.value?.focusInput()
        }, 300)
        return
      }
    }

    // Default scroll behavior
    await nextTick()
    scrollToBottom()
  },
  { deep: true }
)

// Initialize
onMounted(async () => {
  // Fetch GPTs
  await fetchGPTs()

  // Fetch conversations
  await fetchConversations()

  // Check if GPT ID in query params (afficher le message d'accueil sans créer de conversation)
  const gptId = route.query.gpt

  if (gptId) {
    const gpt = gpts.value.find((g) => g.id === gptId)

    if (gpt) {
      await selectGPT(gpt)
    }
  }

  // Listen to credits updates
  listenToCredits()
})

// Cleanup
onUnmounted(() => {
  stopListening()
  stopCreditsListening()
})
</script>

<style scoped lang="scss">
.gpts-chat-page {
  height: 100vh;
  max-height: 100vh;
  width: 100%;
  overflow: hidden;
}

.chat-container {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.sidebar-left-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  width: 305px;
  min-width: 305px;
  flex-shrink: 0;
  transition: all 0.3s ease;

  &.sidebar-collapsed {
    width: 54px;
    min-width: 54px;
  }
}

.chat-area {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  overflow: hidden;

  .empty-state {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #f8f8f8;
  }

  .empty-state-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 20px;
    background-color: #ffffff;
    border-bottom: 1px solid #e9eaec;
    height: 58px;
  }

  .empty-state-title {
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 600;
    line-height: normal;
    color: #1d1d1b;
    margin: 0;
  }

  .empty-state-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 48px;
    gap: 32px;
  }

  .empty-state-illustration {
    width: 130px;
    height: 115px;
  }

  .empty-state-message {
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    font-weight: 400;
    line-height: normal;
    color: #787878;
    text-align: center;
    max-width: 248px;
    margin: 0;
  }

  .chat-interface {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;

    .chat-header {
      flex-shrink: 0;
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: #ffffff;
      border-bottom: 1px solid #e9eaec;
      height: 58px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f5f5f5;
        padding: 8px 12px;
        margin: -8px -12px;
        border-radius: 4px;
      }
    }

    .gpt-title {
      font-family: 'Poppins', sans-serif;
      font-size: 16px;
      font-weight: 600;
      line-height: normal;
      color: #1d1d1b;
      margin: 0;
    }

    .edit-icon-btn {
      opacity: 0.8;
      transition: opacity 0.2s;

      &:hover {
        opacity: 1;
      }

      .edit-icon {
        width: 20px;
        height: 20px;
        display: block;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .model-info-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .gpt-name-small {
      font-family: 'Poppins', sans-serif;
      font-size: 12px;
      font-weight: 400;
      color: #8e8e8e;
    }

    .provider-display {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.2s;

      &:hover:not(.disabled) {
        background-color: rgba(0, 0, 0, 0.04);
      }

      &.disabled {
        cursor: not-allowed;
        opacity: 1;
      }
    }

    .provider-text {
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 400;
      line-height: 1.5;
      color: #1d1d1b;

      .model-name {
        color: #787878;
        font-weight: 400;
      }
    }

    .messages-area {
      flex: 1;
      overflow-y: auto;
      background-color: #fafafa;
      padding-bottom: 20px;

      &::-webkit-scrollbar {
        width: 8px;
      }

      &::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
      }

      .messages-content {
        max-width: 691px;
        margin: 0 auto;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;

        @media (min-width: 1400px) {
          max-width: 900px;
        }

        .conversation-starters {
          margin-top: 16px;

          .suggestions-label {
            font-family: 'Poppins', sans-serif;
            font-size: 12px;
            font-weight: 400;
            line-height: normal;
            color: #8e8e8e;
            margin: 0 0 12px 0;
          }

          .starters-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px 20px;
            max-width: 590px;

            .starter-card {
              background-color: #ffffff;
              border: 1px solid transparent;
              border-radius: 4px;
              padding: 12px;
              cursor: pointer;
              transition: all 0.2s ease;
              font-family: 'Poppins', sans-serif;
              font-size: 14px;
              font-weight: 400;
              line-height: 1.5;
              color: #1d1d1b;
              display: flex;
              align-items: center;
              white-space: normal;
              word-wrap: break-word;

              &:hover {
                border-color: #00ce7c;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              }
            }
          }
        }
      }
    }

    .chat-input-area {
      flex-shrink: 0;
      padding: 24px 122px;
      background-color: white;
      border-top: 1px solid #e9eaec;

      :deep(.chat-input-wrapper) {
        max-width: 691px;
        margin: 0 auto;
        width: 100%;
      }

      @media (min-width: 1400px) {
        padding: 24px;

        :deep(.chat-input-wrapper) {
          max-width: 900px;
        }
      }
    }
  }
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

      .menu-icon {
        width: 20px;
        height: 20px;
        display: block;
        margin-right: 8px;
      }

      .v-icon {
        font-size: 20px;
        margin-right: 8px !important;
      }
    }

    .v-list-item__spacer {
      display: none !important;
    }

    &.menu-item-primary {
      background-color: #ffffff;

      &:first-child {
        border-radius: 4px 4px 0 0;
      }

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

        .menu-icon {
          opacity: 0.5;
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

      &:hover:not(.v-list-item--disabled) {
        background-color: #eeeeee;
      }

      &.v-list-item--disabled {
        opacity: 0.6;
        cursor: not-allowed;

        .v-list-item-title,
        .v-icon {
          color: #8e8e8e;
        }
      }

      &:last-child {
        border-radius: 0 0 4px 4px;
      }
    }
  }
}

.gpt-menu-button {
  background-color: transparent;
  border-radius: 100% !important;
  width: 20px;
  height: 20px;
  min-width: 20px;

  :deep(.v-icon) {
    color: #aeb0b2;
  }

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    border-radius: 100px;
  }
}

// Model Selector Menu Styling
:deep(.model-selector-menu) {
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0px 4px 20px 0px rgba(177, 177, 177, 0.4);
  padding: 4px 0;
  max-height: 400px;
  overflow-y: auto;

  .v-list-subheader {
    font-family: 'Poppins', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: #8e8e8e;
    padding: 8px 16px 4px;
    min-height: auto;
    line-height: 1.2;
  }

  .v-list-item {
    padding: 8px 16px;
    min-height: auto;

    .v-list-item-title {
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 400;
      line-height: 1.5;
      color: #1d1d1b;
    }

    &.v-list-item--active {
      background-color: #f8f8f8;

      .v-list-item-title {
        color: #1d1d1b;
        font-weight: 500;
      }
    }
  }
}

// Dialog Actions Styling
:deep(.dialog-actions) {
  padding: 16px 24px;

  .cancel-btn {
    text-transform: none;
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
  }

  .confirm-btn {
    text-transform: none;
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
  }
}

// Rename Dialog Styling (matching Figma design)
:deep(.rename-dialog) {
  .v-overlay__content {
    box-shadow: 0px 4px 20px 0px rgba(177, 177, 177, 0.4);
  }
}

.rename-card {
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0px 4px 20px 0px rgba(177, 177, 177, 0.4);
  padding: 20px 24px 64px 24px;
}

.rename-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 32px;
}

.rename-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rename-title {
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: #c5c7c9;
  text-transform: uppercase;
  margin: 0;
}

.close-btn {
  margin: 0;
  padding: 0;

  &:hover {
    background-color: transparent;
  }
}

.header-divider {
  border-color: #e9eaec;
}

.rename-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.input-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-label {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: normal;
  color: #1d1d1b;
}

:deep(.title-input) {
  .v-field {
    border: 1px solid #8e8e8e;
    border-radius: 4px;
    background-color: #ffffff;
    height: 40px;

    .v-field__input {
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 400;
      line-height: 1.5;
      color: #363633;
      padding: 8px 12px;
      min-height: 40px;
    }

    &:hover {
      border-color: #1d1d1b;
    }

    &.v-field--focused {
      border-color: #1d1d1b;
    }
  }

  .v-field__outline {
    display: none;
  }
}

.action-buttons {
  display: flex;
  gap: 20px;
  align-items: center;
}

.cancel-btn-custom {
  border: 1px solid #1d1d1b;
  border-radius: 4px;
  background-color: #ffffff;
  width: 204px;
  height: 40px;
  text-transform: none;

  :deep(.v-btn__content) {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: normal;
    color: #1d1d1b;
  }

  &:hover {
    background-color: #f8f8f8;
  }
}

.rename-btn-custom {
  background-color: #1d1d1b;
  border-radius: 4px;
  width: 204px;
  height: 40px;
  text-transform: none;

  :deep(.v-btn__content) {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: normal;
    color: #ffffff;
  }

  &:hover {
    background-color: #363633;
  }

  &:disabled {
    background-color: #c5c7c9;
    opacity: 0.5;

    :deep(.v-btn__content) {
      color: #ffffff;
    }
  }
}

// Delete Dialog Styling (matching Figma design)
:deep(.delete-dialog) {
  .v-overlay__content {
    box-shadow: 0px 4px 20px 0px rgba(177, 177, 177, 0.4);
  }
}

.delete-card {
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0px 4px 20px 0px rgba(177, 177, 177, 0.4);
  padding: 20px 24px 64px 24px;
}

.delete-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 32px;
}

.delete-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.delete-title {
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: #aeb0b2;
  text-transform: uppercase;
  margin: 0;
}

.delete-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
  align-items: center;

  .action-buttons {
    justify-content: center;
  }
}

.delete-message {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: center;
}

.delete-main-message {
  font-family: 'Poppins', sans-serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 27px;
  color: #1d1d1b;
  margin: 0;
}

.delete-sub-message {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #787878;
  margin: 0;
}

.delete-btn-custom {
  background-color: #1d1d1b;
  border-radius: 4px;
  width: 204px;
  height: 40px;
  text-transform: none;

  :deep(.v-btn__content) {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: normal;
    color: #ffffff;
  }

  &:hover {
    background-color: #363633;
  }
}
</style>
