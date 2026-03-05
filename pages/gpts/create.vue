<template>
  <div class="gpts-create-page">
    <div class="page-container">
      <!-- Back Button -->
      <v-btn variant="text" size="small" class="back-btn" @click="handleBackNavigation">
        <v-icon size="20" class="mr-1">mdi-arrow-left</v-icon>
        {{ t('back') }}
      </v-btn>

      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">{{ t('title') }}</h1>
        <div class="header-actions">
          <v-btn
            v-if="isEditMode"
            variant="outlined"
            color="error"
            size="small"
            :loading="deleting"
            :disabled="loading || deleting"
            class="delete-btn-header"
            @click="handleDelete"
          >
            <v-icon size="18" class="mr-1">mdi-delete-outline</v-icon>
            {{ t('actions.delete') }}
          </v-btn>
          <v-btn
            variant="outlined"
            color="grey"
            size="small"
            :disabled="loading || deleting"
            class="cancel-btn"
            @click="handleCancel"
          >
            {{ t('actions.cancel') }}
          </v-btn>
          <v-btn
            class="create-btn"
            :loading="loading"
            :disabled="loading || deleting"
            @click="handleSubmit"
          >
            {{ isEditMode ? t('actions.update') : t('actions.create') }}
          </v-btn>
        </div>
      </div>

      <!-- Main Content: Form + Preview -->
      <div class="content-layout">
        <!-- Left Column: Form -->
        <div class="form-column">
          <!-- Name -->
          <div class="form-field">
            <label class="field-label">{{ t('form.name') }}</label>
            <v-text-field
              v-model="form.name"
              :placeholder="t('form.name_placeholder')"
              hide-details
            />
          </div>

          <!-- Description -->
          <div class="form-field">
            <label class="field-label">{{ t('form.description') }}</label>
            <v-text-field
              v-model="form.description"
              :placeholder="t('form.description_placeholder')"
              hide-details
            />
          </div>

          <!-- Icon -->
          <div class="form-field">
            <label class="field-label">{{ t('form.icon') }}</label>
            <v-select
              v-model="form.icon"
              :items="iconOptions"
              item-title="label"
              item-value="value"
              :placeholder="t('form.icon_placeholder')"
              variant="outlined"
              density="compact"
              hide-details
            >
              <template #prepend-inner>
                <img
                  v-if="form.icon"
                  :src="`/icons/gpts/${form.icon}.svg`"
                  :alt="form.icon"
                  class="gpt-icon-preview"
                />
              </template>
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #prepend>
                    <img
                      :src="`/icons/gpts/${item.raw.value}.svg`"
                      :alt="item.raw.label"
                      class="gpt-icon-preview"
                    />
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </div>

          <!-- Instructions -->
          <div class="form-field">
            <label class="field-label">{{ t('form.instructions') }}</label>
            <v-textarea
              v-model="form.instructions"
              :placeholder="t('form.instructions_placeholder')"
              variant="outlined"
              rows="5"
              counter
              :hint="instructionsHint"
              persistent-hint
              class="instructions-textarea"
            />
          </div>

          <!-- Conversation Starters -->
          <div class="form-field">
            <label class="field-label">{{ t('form.conversation_starters') }}</label>
            <div
              v-for="(starter, index) in form.conversation_starters"
              :key="index"
              class="starter-row"
            >
              <v-text-field
                v-model="form.conversation_starters[index]"
                :placeholder="t('form.conversation_starters_placeholder')"
                hide-details
              >
                <template #append-inner>
                  <v-btn icon size="x-small" variant="text" @click="removeStarter(index)">
                    <v-icon size="20">mdi-close</v-icon>
                  </v-btn>
                </template>
              </v-text-field>
            </div>
            <v-btn
              v-if="form.conversation_starters.length < 4"
              class="add-starter-btn"
              variant="text"
              size="small"
              @click="addStarter"
            >
              <template #prepend>
                <v-icon size="20" color="#00CE7C">mdi-plus-circle-outline</v-icon>
              </template>
              {{ t('actions.add_starter') }}
            </v-btn>
          </div>

          <!-- Knowledge -->
          <div class="form-field knowledge-section">
            <div class="knowledge-header">
              <label class="field-label">{{ t('form.knowledge') }}</label>
              <p class="knowledge-hint">{{ t('form.knowledge_hint') }}</p>
            </div>

            <!-- Hidden file input -->
            <input
              ref="fileInput"
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              style="display: none"
              @change="handleFileUpload"
            />

            <!-- Upload button -->
            <v-btn
              class="upload-btn"
              variant="text"
              size="small"
              :loading="uploading"
              :disabled="uploading"
              @click="$refs.fileInput.click()"
            >
              <template #prepend>
                <v-icon size="20" color="#00CE7C">mdi-plus-circle-outline</v-icon>
              </template>
              {{ t('actions.upload_files') }}
            </v-btn>

            <!-- Info message for create mode -->
            <p v-if="!isEditMode && uploadedFiles.length > 0" class="field-hint">
              {{ t('form.files_pending') }}
            </p>

            <!-- Uploaded files list -->
            <div v-if="uploadedFiles.length > 0" class="uploaded-files-list">
              <div v-for="file in uploadedFiles" :key="file.id" class="uploaded-file-item">
                <v-icon :color="getFileIconColor(file.file_type)" size="20">
                  {{ getFileIcon(file.file_type) }}
                </v-icon>
                <div class="file-info">
                  <span class="file-name">{{ file.filename }}</span>
                  <span class="file-meta">
                    {{ formatFileSize(file.file_size) }} • {{ file.word_count }}
                    {{ t('form.words') }}
                  </span>
                </div>
                <v-btn
                  v-if="isAdmin || isCreator || file.isPending"
                  icon
                  size="x-small"
                  variant="text"
                  :loading="deletingFileId === file.id"
                  @click="handleFileDelete(file.id)"
                >
                  <v-icon size="16">mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
          </div>

          <!-- Recommended Model -->
          <div class="form-field">
            <label class="field-label">{{ t('form.recommended_model') }}</label>
            <v-select
              v-model="form.recommended_model"
              :items="allModels"
              item-title="label"
              item-value="value"
              :placeholder="t('form.model_placeholder')"
              variant="outlined"
              density="compact"
              hide-details
              class="model-select"
            >
              <template #item="{ props, item }">
                <v-list-item :value="item.raw.value" class="model-item" @click="props.onClick">
                  <div class="model-item-content">
                    <span class="provider-badge">{{ item.raw.providerName }}</span>
                    <span class="model-name">{{ item.raw.label }}</span>
                    <v-chip
                      v-if="item.raw.isPremium"
                      size="x-small"
                      color="warning"
                      variant="flat"
                      class="premium-chip"
                    >
                      {{ t('form.premium_credits') }}
                    </v-chip>
                  </div>
                </v-list-item>
              </template>
              <template #selection="{ item }">
                <span class="selected-provider">{{ item.raw.providerName }}</span>
                <span class="selected-model">{{ item.raw.label }}</span>
                <v-chip
                  v-if="item.raw.isPremium"
                  size="x-small"
                  color="warning"
                  variant="flat"
                  class="premium-chip ml-2"
                >
                  {{ t('form.premium_credits') }}
                </v-chip>
              </template>
            </v-select>
            <p v-if="isModelPremium(form.recommended_model)" class="field-hint premium-warning">
              {{ t('form.premium_hint') }}
            </p>
          </div>

          <!-- Reasoning Effort (only for models that support it) -->
          <div v-if="selectedModelSupportsReasoning" class="form-field">
            <label class="field-label">{{ t('form.reasoning_effort') }}</label>
            <v-select
              v-model="form.reasoning_effort"
              :items="reasoningEffortOptions"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="compact"
              hide-details
              class="reasoning-effort-select"
            />
            <p class="field-hint">{{ t('form.reasoning_effort_hint') }}</p>
          </div>

          <!-- Show Reasoning Toggle -->
          <div class="form-field">
            <v-checkbox
              v-model="form.show_reasoning"
              :label="t('form.show_reasoning')"
              hide-details
              density="compact"
              color="#00CE7C"
              class="show-reasoning-checkbox"
            />
            <p class="field-hint">{{ t('form.show_reasoning_hint') }}</p>
          </div>

          <!-- Added Users -->
          <div class="form-field">
            <label class="field-label">{{ t('form.added_users') }}</label>
            <v-autocomplete
              v-model="form.assigned_users"
              :items="availableUsers"
              item-title="display_name"
              item-value="id"
              :placeholder="t('form.none')"
              variant="outlined"
              density="compact"
              multiple
              chips
              :loading="loadingUsers"
              hide-details
            >
              <template #chip="{ props, item }">
                <v-chip
                  v-bind="props"
                  :text="item.raw.display_name"
                  size="small"
                  :closable="!isCreatorUser(item.raw.id)"
                />
              </template>
            </v-autocomplete>
            <p v-if="creatorUser" class="field-hint">
              {{ t('form.creator_note').replace('{name}', creatorUser.display_name) }}
            </p>
          </div>

          <!-- Added Companies -->
          <div class="form-field">
            <label class="field-label">{{ t('form.added_companies') }}</label>
            <v-autocomplete
              v-model="form.assigned_companies"
              :items="availableCompanies"
              item-title="name"
              item-value="id"
              :placeholder="t('form.none')"
              variant="outlined"
              density="compact"
              multiple
              chips
              closable-chips
              :loading="loadingCompanies"
              hide-details
            >
              <template #chip="{ props, item }">
                <v-chip v-bind="props" :text="item.raw.name" size="small" />
              </template>
            </v-autocomplete>
          </div>
        </div>

        <!-- Right Column: Preview -->
        <div class="preview-column">
          <div class="preview-container">
            <div class="preview-content">
              <p class="preview-label">{{ t('preview.title') }}</p>
              <div class="preview-text">
                <p class="preview-instruction-label">{{ t('preview.instruction_label') }}</p>
                <p class="preview-instruction-text">
                  {{ form.instructions || t('preview.instruction_empty') }}
                </p>
              </div>
            </div>

            <!-- Chat Input -->
            <div class="preview-input">
              <v-icon class="input-icon" size="20">mdi-plus-circle-outline</v-icon>
              <span class="input-placeholder">{{ t('preview.input_placeholder') }}</span>
              <v-btn icon size="small" class="send-btn">
                <v-icon size="20">mdi-arrow-up</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

definePageMeta({
  middleware: ['gpt-admin']
})

const { t, pending: translationsPending } = useTranslations('gpts-create')

// Computed for instructions hint with fallback
const instructionsHint = computed(() => {
  const hint = t('form.instructions_hint')
  // Return empty string if translation not loaded yet
  if (hint === 'MISSING TRANSLATION' || hint === 'DEV MODE MISSING TRANSLATION') {
    return ''
  }
  return hint
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const supabase = useSupabaseClient()
const { gpts, createGPT, updateGPT, deleteGPT, fetchGPTById } = useGPTs()

// State
const loading = ref(false)
const deleting = ref(false)
const formRef = ref(null)
const loadingUsers = ref(false)
const loadingCompanies = ref(false)
const availableUsers = ref([])
const availableCompanies = ref([])
const creatorId = ref(null)
const currentUserId = ref(null)
const uploading = ref(false)
const uploadedFiles = ref([])
const pendingFiles = ref([]) // Files to upload after GPT creation
const deletingFileId = ref(null)
const fileInput = ref(null)

// Edit mode detection
const gptId = computed(() => route.query.id)
const isEditMode = computed(() => !!gptId.value)
const isCreator = computed(() => creatorId.value === currentUserId.value)
const isAdmin = computed(() => {
  // TODO: Get from user profile or auth store
  return true // For now, assume all users can be admins
})

// Form data
const form = ref({
  name: '',
  description: '',
  instructions: '',
  welcome_message: '',
  conversation_starters: [''],
  icon: 'diamond', // Default icon
  provider: 'openai',
  recommended_model: '',
  reasoning_effort: 'medium', // Default reasoning effort: 'low', 'medium', 'high'
  show_reasoning: true, // Default to showing reasoning tokens
  knowledge_files: [],
  assigned_users: [],
  assigned_companies: []
})

// Provider display names
const providerNames = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  'x-ai': 'xAI',
  mistralai: 'Mistral'
}

// Curated models list organized by provider
// isPremium: true means the model costs more credits
// supportsReasoning: true means the model supports reasoning effort configuration
const allModels = [
  // OpenAI
  {
    label: 'GPT-4o',
    value: 'openai/gpt-4o',
    provider: 'openai',
    providerName: 'OpenAI',
    isPremium: false,
    supportsReasoning: false
  },
  {
    label: 'o3',
    value: 'openai/o3',
    provider: 'openai',
    providerName: 'OpenAI',
    isPremium: true,
    supportsReasoning: true
  },
  {
    label: 'GPT-5',
    value: 'openai/gpt-5',
    provider: 'openai',
    providerName: 'OpenAI',
    isPremium: true,
    supportsReasoning: true
  },
  {
    label: 'GPT-5.1 Chat',
    value: 'openai/gpt-5.1-chat',
    provider: 'openai',
    providerName: 'OpenAI',
    isPremium: false,
    supportsReasoning: true
  },
  {
    label: 'o1',
    value: 'openai/o1',
    provider: 'openai',
    providerName: 'OpenAI',
    isPremium: true,
    supportsReasoning: true
  },
  {
    label: 'o1-pro',
    value: 'openai/o1-pro',
    provider: 'openai',
    providerName: 'OpenAI',
    isPremium: true,
    supportsReasoning: true
  },
  // Anthropic
  {
    label: 'Claude Sonnet 4',
    value: 'anthropic/claude-sonnet-4',
    provider: 'anthropic',
    providerName: 'Anthropic',
    isPremium: false,
    supportsReasoning: false
  },
  {
    label: 'Claude 3.5 Sonnet',
    value: 'anthropic/claude-3.5-sonnet',
    provider: 'anthropic',
    providerName: 'Anthropic',
    isPremium: false,
    supportsReasoning: false
  },
  {
    label: 'Claude Sonnet 4.5',
    value: 'anthropic/claude-sonnet-4.5',
    provider: 'anthropic',
    providerName: 'Anthropic',
    isPremium: true,
    supportsReasoning: true
  },
  // Google
  {
    label: 'Gemini 2.5 Pro',
    value: 'google/gemini-2.5-pro',
    provider: 'google',
    providerName: 'Google',
    isPremium: false,
    supportsReasoning: true
  },
  {
    label: 'Gemini 3 Pro Preview',
    value: 'google/gemini-3-pro-preview',
    provider: 'google',
    providerName: 'Google',
    isPremium: true,
    supportsReasoning: true
  },
  // xAI
  {
    label: 'Grok 3',
    value: 'x-ai/grok-3',
    provider: 'x-ai',
    providerName: 'xAI',
    isPremium: false,
    supportsReasoning: false
  },
  {
    label: 'Grok 3 Mini',
    value: 'x-ai/grok-3-mini',
    provider: 'x-ai',
    providerName: 'xAI',
    isPremium: true,
    supportsReasoning: true
  },
  // Mistral
  {
    label: 'Mistral 7B Instruct',
    value: 'mistralai/mistral-7b-instruct',
    provider: 'mistralai',
    providerName: 'Mistral',
    isPremium: false,
    supportsReasoning: false
  }
]

// Reference for model lookups (same as allModels now, no subheaders)
const selectableModels = allModels

// Helper to check if a model is premium
const isModelPremium = (modelValue) => {
  const model = selectableModels.find((m) => m.value === modelValue)
  return model?.isPremium ?? false
}

// Helper to check if selected model supports reasoning
const selectedModelSupportsReasoning = computed(() => {
  const model = selectableModels.find((m) => m.value === form.value.recommended_model)
  return model?.supportsReasoning ?? false
})

// Reasoning effort options
const reasoningEffortOptions = computed(() => [
  { label: t('form.reasoning_effort_low'), value: 'low' },
  { label: t('form.reasoning_effort_medium'), value: 'medium' },
  { label: t('form.reasoning_effort_high'), value: 'high' }
])

// Icon options for GPT customization (computed to use translations)
const iconOptions = computed(() => [
  { label: t('icons.diamond'), value: 'diamond' },
  { label: t('icons.ruby'), value: 'ruby' },
  { label: t('icons.emerald'), value: 'emerald' },
  { label: t('icons.sapphire'), value: 'sapphire' },
  { label: t('icons.topaz'), value: 'topaz' },
  { label: t('icons.heart'), value: 'heart' },
  { label: t('icons.crystal_blue'), value: 'crystal-blue' },
  { label: t('icons.crystal_purple'), value: 'crystal-purple' }
])

// Creator management
const isCreatorUser = (userId) => {
  return userId === creatorId.value
}

const creatorUser = computed(() => {
  if (!creatorId.value) return null
  return availableUsers.value.find((u) => u.id === creatorId.value)
})

// Watch assigned_users to ensure creator is always included
watch(
  () => form.value.assigned_users,
  (newUsers) => {
    if (creatorId.value && !newUsers.includes(creatorId.value)) {
      form.value.assigned_users.push(creatorId.value)
    }
  },
  { deep: true }
)

// Conversation starters
const addStarter = () => {
  if (form.value.conversation_starters.length < 4) {
    form.value.conversation_starters.push('')
  }
}

const removeStarter = (index) => {
  form.value.conversation_starters.splice(index, 1)
}

// User & Company fetching
const fetchUsers = async () => {
  loadingUsers.value = true
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role')
      .in('role', ['admin', 'buyer', 'super_buyer'])
      .order('email')

    if (error) throw error

    availableUsers.value = (data || []).map((user) => ({
      ...user,
      display_name:
        user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name} (${user.email})`
          : user.email
    }))
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    loadingUsers.value = false
  }
}

const fetchCompanies = async () => {
  loadingCompanies.value = true
  try {
    const { data, error } = await supabase.from('companies').select('id, name').order('name')

    if (error) throw error
    availableCompanies.value = data || []
  } catch (error) {
    console.error('Error fetching companies:', error)
  } finally {
    loadingCompanies.value = false
  }
}

const filterUsers = (item, queryText) => {
  const searchText = queryText.toLowerCase()
  return item.raw.display_name.toLowerCase().includes(searchText)
}

const filterCompanies = (item, queryText) => {
  const searchText = queryText.toLowerCase()
  return item.raw.name.toLowerCase().includes(searchText)
}

const getInitials = (user) => {
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
  }
  return user.email[0].toUpperCase()
}

// Knowledge files functions
const handleFileUpload = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  // In create mode: store files temporarily
  if (!isEditMode.value) {
    uploading.value = true

    try {
      for (const file of files) {
        // Store the actual File object
        pendingFiles.value.push(file)

        // Add to display list with temporary ID and metadata
        uploadedFiles.value.push({
          id: `temp-${Date.now()}-${Math.random()}`,
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
          word_count: 0,
          estimated_tokens: 0,
          isPending: true
        })
      }

      toast.success(t('toast.files_added').replace('{count}', files.length))
    } catch (error) {
      console.error('Error adding files:', error)
      toast.error(t('toast.failed_add_files'))
    } finally {
      uploading.value = false
    }

    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
    return
  }

  // In edit mode: upload directly
  uploading.value = true

  try {
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)

      const response = await $fetch(`/api/gpts/${gptId.value}/knowledge/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.success) {
        uploadedFiles.value.push(response.file)
      }
    }

    toast.success(t('toast.files_uploaded').replace('{count}', files.length))

    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } catch (error) {
    console.error('Error uploading files:', error)
    toast.error(error.data?.message || t('toast.failed_upload'))
  } finally {
    uploading.value = false
  }
}

const handleFileDelete = async (fileId) => {
  // Check if it's a pending file (temp ID starts with "temp-")
  const isPendingFile = typeof fileId === 'string' && fileId.startsWith('temp-')

  if (isPendingFile) {
    // Remove from pending files and uploaded files list
    const fileIndex = uploadedFiles.value.findIndex((f) => f.id === fileId)
    if (fileIndex !== -1) {
      uploadedFiles.value.splice(fileIndex, 1)
      pendingFiles.value.splice(fileIndex, 1)
      toast.success(t('toast.file_removed'))
    }
    return
  }

  // For already uploaded files in edit mode
  if (!confirm(t('confirm.delete_file'))) {
    return
  }

  deletingFileId.value = fileId

  try {
    await $fetch(`/api/gpts/${gptId.value}/knowledge/${fileId}`, {
      method: 'DELETE'
    })

    uploadedFiles.value = uploadedFiles.value.filter((f) => f.id !== fileId)
    toast.success(t('toast.file_deleted'))
  } catch (error) {
    console.error('Error deleting file:', error)
    toast.error(error.data?.message || t('toast.failed_delete_file'))
  } finally {
    deletingFileId.value = null
  }
}

const loadKnowledgeFiles = async () => {
  if (!isEditMode.value) return

  try {
    const response = await $fetch(`/api/gpts/${gptId.value}/knowledge`)
    if (response.success) {
      uploadedFiles.value = response.files
    }
  } catch (error) {
    console.error('Error loading knowledge files:', error)
  }
}

const getFileIcon = (fileType) => {
  if (fileType === 'application/pdf') return 'mdi-file-pdf-box'
  if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileType === 'application/msword'
  )
    return 'mdi-file-word-box'
  return 'mdi-file-document'
}

const getFileIconColor = (fileType) => {
  if (fileType === 'application/pdf') return '#F05252'
  if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileType === 'application/msword'
  )
    return '#2B6CB0'
  return '#8E8E8E'
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Submit
const handleSubmit = async () => {
  // Validation
  if (!form.value.name.trim()) {
    toast.error(t('validation.name_required'))
    return
  }
  if (!form.value.instructions.trim()) {
    toast.error(t('validation.instructions_required'))
    return
  }
  if (!form.value.recommended_model) {
    toast.error(t('validation.model_required'))
    return
  }

  loading.value = true

  try {
    const gptData = {
      name: form.value.name,
      description: form.value.description || null,
      icon: form.value.icon || 'diamond',
      instructions: form.value.instructions,
      welcome_message: form.value.welcome_message || null,
      conversation_starters: form.value.conversation_starters.filter((s) => s.trim()),
      provider: form.value.provider,
      recommended_model: form.value.recommended_model,
      reasoning_effort: form.value.reasoning_effort || 'medium',
      show_reasoning: form.value.show_reasoning,
      knowledge_files: form.value.knowledge_files
    }

    // Track the GPT ID for redirect
    let targetGptId = null

    if (isEditMode.value) {
      await updateGPT(gptId.value, gptData)

      // Always update assignments in edit mode (even if empty - will keep only creator)
      try {
        await $fetch('/api/gpts/assign-users', {
          method: 'POST',
          body: {
            gpt_id: gptId.value,
            user_ids: form.value.assigned_users,
            company_ids: form.value.assigned_companies
          }
        })
      } catch (error) {
        console.error('Error updating assignments:', error)
        toast.error(t('toast.failed_update_assignments') || 'Failed to update assignments')
      }

      toast.success(t('toast.gpt_updated'))
      targetGptId = gptId.value
    } else {
      const newGPT = await createGPT(gptData)
      targetGptId = newGPT.id

      // Handle assignments if any
      if (form.value.assigned_users.length > 0 || form.value.assigned_companies.length > 0) {
        try {
          await $fetch('/api/gpts/assign-users', {
            method: 'POST',
            body: {
              gpt_id: newGPT.id,
              user_ids: form.value.assigned_users,
              company_ids: form.value.assigned_companies
            }
          })
        } catch (error) {
          console.error('Error assigning users:', error)
        }
      }

      // Upload pending files if any
      if (pendingFiles.value.length > 0) {
        try {
          uploading.value = true
          let uploadedCount = 0

          for (const file of pendingFiles.value) {
            const formData = new FormData()
            formData.append('file', file)

            try {
              await $fetch(`/api/gpts/${newGPT.id}/knowledge/upload`, {
                method: 'POST',
                body: formData
              })
              uploadedCount++
            } catch (uploadError) {
              console.error(`Error uploading file ${file.name}:`, uploadError)
              toast.error(t('toast.failed_upload_file').replace('{name}', file.name))
            }
          }

          if (uploadedCount > 0) {
            toast.success(t('toast.gpt_created_with_files').replace('{count}', uploadedCount))
          } else {
            toast.success(t('toast.gpt_created'))
          }
        } catch (error) {
          console.error('Error uploading files:', error)
          toast.success(t('toast.gpt_created_files_failed'))
        } finally {
          uploading.value = false
        }
      } else {
        toast.success(t('toast.gpt_created'))
      }
    }

    // Redirect to chat with this GPT
    navigateTo(`/gpts/chat?gpt=${targetGptId}`)
  } catch (error) {
    console.error('Error saving GPT:', error)
    toast.error(t('toast.failed_save'))
  } finally {
    loading.value = false
  }
}

const handleDelete = async () => {
  if (!confirm(t('confirm.delete_gpt'))) {
    return
  }

  deleting.value = true

  try {
    await deleteGPT(gptId.value)
    toast.success(t('toast.gpt_deleted'))
    navigateTo('/gpts/chat')
  } catch (error) {
    console.error('Error deleting GPT:', error)
    toast.error(t('toast.failed_delete'))
  } finally {
    deleting.value = false
  }
}

// Handle back navigation
const handleBackNavigation = () => {
  router.back()
}

const handleCancel = () => {
  navigateTo('/gpts/chat')
}

// Watch for model changes to extract provider
watch(
  () => form.value.recommended_model,
  (newModel) => {
    if (newModel) {
      // Extract provider from model value (format: "provider/model-name")
      const provider = newModel.split('/')[0]
      form.value.provider = provider
    }
  }
)

// Load GPT data if in edit mode
onMounted(async () => {
  // Get current user
  const {
    data: { user }
  } = await supabase.auth.getUser()
  currentUserId.value = user?.id

  fetchUsers()
  fetchCompanies()

  if (isEditMode.value) {
    loading.value = true
    try {
      const gpt = await fetchGPTById(gptId.value)

      // Set creator ID
      creatorId.value = gpt.created_by

      // Populate form with GPT data
      form.value.name = gpt.name
      form.value.description = gpt.description || ''
      form.value.icon = gpt.icon || 'diamond'
      form.value.instructions = gpt.instructions
      form.value.welcome_message = gpt.welcome_message || ''
      form.value.conversation_starters =
        gpt.conversation_starters?.length > 0 ? gpt.conversation_starters : ['']
      form.value.provider = gpt.provider
      form.value.recommended_model = gpt.recommended_model
      form.value.reasoning_effort = gpt.reasoning_effort || 'medium'
      form.value.show_reasoning = gpt.show_reasoning !== false // Default to true if undefined
      form.value.knowledge_files = gpt.knowledge_files || []

      // Load knowledge files
      await loadKnowledgeFiles()

      // Fetch current assignments
      try {
        const { data: assignments } = await supabase
          .from('gpt_access')
          .select('user_id, company_id')
          .eq('gpt_id', gptId.value)

        if (assignments && assignments.length > 0) {
          form.value.assigned_users = assignments.filter((a) => a.user_id).map((a) => a.user_id)
          form.value.assigned_companies = assignments
            .filter((a) => a.company_id)
            .map((a) => a.company_id)
        }

        // Ensure creator is always in assigned users
        if (creatorId.value && !form.value.assigned_users.includes(creatorId.value)) {
          form.value.assigned_users.push(creatorId.value)
        }
      } catch (error) {
        console.error('Error loading assignments:', error)
      }
    } catch (error) {
      console.error('Error loading GPT:', error)
      toast.error(t('toast.failed_load'))
      navigateTo('/gpts/chat')
    } finally {
      loading.value = false
    }
  } else {
    // In create mode, set current user as creator
    creatorId.value = currentUserId.value
    if (creatorId.value) {
      form.value.assigned_users = [creatorId.value]
    }
  }
})
</script>

<style scoped lang="scss">
.gpts-create-page {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 20px;
  overflow-x: auto;
}

.page-container {
  background-color: #ffffff;
  border: 1px solid #e9eaec;
  border-radius: 4px;
  padding: 32px 40px;
  max-width: 1200px;
  min-width: 900px;
  margin: 0 auto;
}

.back-btn {
  text-transform: none;
  letter-spacing: normal;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1b;
  padding: 4px 8px;
  margin-bottom: 12px;
  height: auto;
  min-height: auto;

  :deep(.v-btn__content) {
    display: flex;
    align-items: center;
  }

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  height: 40px;
}

.page-title {
  font-family: 'Poppins', sans-serif;
  font-size: 20px;
  font-weight: 600;
  line-height: normal;
  color: #1d1d1b;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.delete-btn-header {
  text-transform: none;
  letter-spacing: normal;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 500;
  height: 40px;
  padding: 0 16px;
  background-color: #ffffff !important;
  border-radius: 4px;

  :deep(.v-btn__content) {
    display: flex;
    align-items: center;
  }

  &:hover {
    background-color: #fff5f5 !important;
  }
}

.cancel-btn {
  text-transform: none;
  letter-spacing: normal;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 600;
  height: auto;
  padding: 8px 32px;
  background-color: #ffffff !important;
  border: 1px solid #1d1d1b !important;
  border-radius: 4px;
  color: #1d1d1b !important;

  &:hover {
    background-color: #f8f8f8 !important;
  }
}

.create-btn {
  background-color: #1d1d1b !important;
  color: #ffffff !important;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
  height: 40px;
  padding: 8px 32px;
  border-radius: 4px;

  &:hover {
    background-color: #000000 !important;
  }
}

.content-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.form-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.instructions-textarea {
  :deep(.v-field) {
    overflow: visible;
  }

  :deep(.v-field__field) {
    overflow: visible;
  }

  :deep(.v-field__outline) {
    overflow: visible;
  }

  :deep(textarea) {
    min-height: 80px;
    max-height: 600px;
    overflow-y: auto !important;
    resize: vertical;
    padding-right: 20px !important;
    padding-bottom: 20px !important;
  }

  // Ensure the resize handle is visible and positioned correctly
  :deep(.v-field__input) {
    position: relative;
  }
}

.field-label {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 600;
  line-height: normal;
  color: #1d1d1b;
}

.field-hint {
  font-family: 'Poppins', sans-serif;
  font-size: 11px;
  font-weight: 400;
  line-height: normal;
  color: #8e8e8e;
  margin-top: 4px;
  margin-bottom: 0;
}

.starter-row {
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.add-starter-btn {
  text-transform: none;
  letter-spacing: normal;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  color: #1d1d1b;
  padding: 4px 0;
  height: auto;
  min-height: auto;
}

.knowledge-section {
  gap: 12px;
}

.knowledge-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.knowledge-hint {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: normal;
  color: #787878;
  margin: 0;
}

.upload-btn {
  text-transform: none;
  letter-spacing: normal;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  color: #1d1d1b;
  padding: 4px 0;
  height: auto;
  min-height: auto;
  justify-content: flex-start;
}

.preview-column {
  flex: 1;
  padding-top: 22px;
}

.preview-container {
  background-color: #f8f8f8;
  border: 1px solid #e9eaec;
  border-radius: 4px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 36px;
}

.preview-label {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #aeb0b2;
  text-align: center;
  margin: 0;
}

.preview-text {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #1d1d1b;
  white-space: pre-wrap;
}

.preview-instruction-label {
  margin-bottom: 10px;
}

.preview-instruction-text {
  margin: 0;
}

.preview-input {
  background-color: #ffffff;
  border: 1px solid #e9eaec;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 56px;
}

.input-icon {
  color: #00ce7c;
  flex-shrink: 0;
}

.input-placeholder {
  flex: 1;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #8e8e8e;
}

.send-btn {
  background-color: #1d1d1b !important;
  color: #ffffff !important;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 100px;

  &:hover {
    background-color: #000000 !important;
  }
}

// All Vuetify overrides removed for testing

:deep(.model-dropdown-menu) {
  background-color: #f8f8f8;
  border-radius: 4px;
  box-shadow: 0px 4px 20px 0px rgba(177, 177, 177, 0.4);
  padding: 0;
}

:deep(.model-dropdown-header) {
  background-color: #ffffff;
  font-family: 'Poppins', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #1d1d1b;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 12px 16px 6px 16px;
  min-height: auto;
  height: auto;
  border-bottom: 1px solid #e9eaec;
  margin-top: 4px;

  &:first-child {
    margin-top: 0;
  }
}

:deep(.model-dropdown-item) {
  background-color: #f8f8f8;
  border-radius: 0;
  padding: 10px 16px 10px 32px;
  min-height: auto;
  margin: 2px 0;

  .v-list-item-title {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: #1d1d1b;
    line-height: 1.5;
  }

  &:hover {
    background-color: #ffffff;

    .v-list-item-title {
      color: #1d1d1b;
      font-weight: 500;
    }
  }

  &.v-list-item--active {
    background-color: #ffffff;

    .v-list-item-title {
      color: #1d1d1b;
      font-weight: 400;
    }
  }
}

// First and last items rounded corners
:deep(.model-dropdown-menu .v-list) {
  padding: 0;
}

:deep(.model-dropdown-item:first-of-type) {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

:deep(.model-dropdown-item:last-of-type) {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

// Uploaded files list
.uploaded-files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.uploaded-file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background-color: #f8f8f8;
  border: 1px solid #e9eaec;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f0f0f0;
  }
}

.file-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.file-name {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #8e8e8e;
}

.show-reasoning-checkbox {
  :deep(.v-label) {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #1d1d1b;
  }
}

.premium-chip {
  font-family: 'Poppins', sans-serif;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.premium-warning {
  color: #d97706 !important;
}

// Model select dropdown styles
:deep(.model-item) {
  padding: 8px 16px !important;
  min-height: 44px;
  cursor: pointer;

  &:hover {
    background-color: #f5f5f5;
  }
}

:deep(.model-item-content) {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

:deep(.provider-badge) {
  font-family: 'Poppins', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: #ffffff;
  background-color: #787878;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  min-width: 75px;
  text-align: center;
  flex-shrink: 0;
}

:deep(.model-name) {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1b;
  flex: 1;
}

.selected-provider {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #787878;
  margin-right: 6px;
}

.selected-model {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1b;
}

.gpt-icon-preview {
  width: 24px;
  height: 24px;
  object-fit: contain;
}
</style>
