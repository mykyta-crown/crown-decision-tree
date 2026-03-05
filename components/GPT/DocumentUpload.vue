<template>
  <div class="document-upload">
    <v-card flat>
      <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-file-document-multiple</v-icon>
          <span class="text-subtitle-1">Documents</span>
          <v-chip v-if="documents.length" size="small" class="ml-2" color="primary">
            {{ documents.length }}
          </v-chip>
        </div>
        <v-tooltip text="Add PDF or Word document" location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-plus"
              size="small"
              variant="text"
              :disabled="uploading"
              @click="openFileDialog"
            />
          </template>
        </v-tooltip>
      </v-card-title>

      <v-divider />

      <!-- Drop Zone -->
      <div
        v-if="!documents.length && !loading"
        ref="dropZone"
        class="drop-zone pa-6"
        :class="{ 'drop-zone--active': isOverDropZone }"
      >
        <div class="text-center">
          <v-icon size="48" color="grey-lighten-1">mdi-cloud-upload-outline</v-icon>
          <p class="text-body-2 text-grey mt-2 mb-1">Drag & drop PDF or Word files here</p>
          <p class="text-caption text-grey-lighten-1">or</p>
          <v-btn
            variant="outlined"
            size="small"
            prepend-icon="mdi-file-upload"
            class="mt-2"
            :disabled="uploading"
            @click="openFileDialog"
          >
            Browse files
          </v-btn>
          <p class="text-caption text-grey-lighten-1 mt-3">Max 10MB • PDF, DOCX</p>
        </div>
      </div>

      <!-- Document List -->
      <v-list v-if="documents.length" class="pa-2">
        <v-list-item v-for="doc in documents" :key="doc.id" class="document-item mb-1" rounded="lg">
          <template #prepend>
            <v-icon :color="getFileColor(doc.file_type)">
              {{ getFileIcon(doc.file_type) }}
            </v-icon>
          </template>

          <v-list-item-title class="text-body-2">
            {{ doc.filename }}
          </v-list-item-title>

          <v-list-item-subtitle class="text-caption">
            {{ formatFileSize(doc.file_size) }} • {{ doc.word_count }} words • ~{{
              doc.estimated_tokens
            }}
            tokens
          </v-list-item-subtitle>

          <template #append>
            <v-btn
              icon="mdi-delete-outline"
              size="small"
              variant="text"
              color="error"
              :loading="deletingDocId === doc.id"
              @click="handleDelete(doc.id)"
            />
          </template>
        </v-list-item>
      </v-list>

      <!-- Loading State -->
      <div v-if="loading && !documents.length" class="pa-6 text-center">
        <v-progress-circular indeterminate color="primary" />
        <p class="text-caption text-grey mt-2">Loading documents...</p>
      </div>

      <!-- Upload Progress -->
      <div v-if="uploading" class="pa-4">
        <div class="d-flex align-center mb-2">
          <v-icon size="20" class="mr-2">mdi-upload</v-icon>
          <span class="text-caption">Uploading and extracting text...</span>
        </div>
        <v-progress-linear :model-value="uploadProgress" color="primary" height="6" rounded />
      </div>

      <!-- Token Summary -->
      <v-divider v-if="documents.length" />
      <div v-if="documents.length" class="pa-3 bg-grey-lighten-5">
        <div class="d-flex justify-space-between text-caption">
          <span class="text-grey">Total estimated tokens:</span>
          <span class="font-weight-bold">{{ totalEstimatedTokens }}</span>
        </div>
        <div class="d-flex justify-space-between text-caption mt-1">
          <span class="text-grey">Total words:</span>
          <span class="font-weight-bold">{{ totalWordCount }}</span>
        </div>
      </div>

      <!-- Error Message -->
      <v-alert
        v-if="error"
        type="error"
        density="compact"
        closable
        class="ma-3"
        @click:close="error = null"
      >
        {{ error }}
      </v-alert>
    </v-card>

    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      accept=".pdf,.docx"
      style="display: none"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useDropZone } from '@vueuse/core'
import { useDocuments } from '~/composables/useDocuments'

const props = defineProps({
  conversationId: {
    type: String,
    default: null
  },
  gptId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['conversation-created'])

console.log('🔍 DocumentUpload component loaded with conversationId:', props.conversationId)

const {
  documents,
  loading,
  uploading,
  error,
  uploadProgress,
  totalEstimatedTokens,
  totalWordCount,
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  validateFile,
  formatFileSize,
  getFileIcon
} = useDocuments()

const dropZone = ref(null)
const fileInput = ref(null)
const deletingDocId = ref(null)

// Setup drop zone
const { isOverDropZone } = useDropZone(dropZone, {
  onDrop: handleDrop,
  dataTypes: ['Files']
})

// Load documents when conversation changes
watch(
  () => props.conversationId,
  async (newId) => {
    if (newId) {
      try {
        await fetchDocuments(newId)
      } catch (err) {
        console.error('Error loading documents:', err)
      }
    }
  },
  { immediate: true }
)

// Get file color based on type
const getFileColor = (fileType) => {
  if (fileType === 'application/pdf') return 'red'
  if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    return 'blue'
  return 'grey'
}

// Open file dialog
const openFileDialog = () => {
  fileInput.value?.click()
}

// Handle file selection from input
const handleFileSelect = async (event) => {
  const files = event.target.files
  if (files && files.length > 0) {
    await handleFiles(files)
  }
  // Reset input
  event.target.value = ''
}

// Handle drag & drop
function handleDrop(files) {
  if (files && files.length > 0) {
    handleFiles(files)
  }
}

// Process files
const handleFiles = async (files) => {
  const file = files[0] // Only handle first file

  // Validate
  const validation = validateFile(file)
  if (!validation.valid) {
    error.value = validation.error
    return
  }

  // If no conversation exists yet, emit event to create one first
  if (!props.conversationId && props.gptId) {
    error.value = 'Please start a conversation before uploading documents'
    return
  }

  // Upload
  try {
    await uploadDocument(props.conversationId, file)
  } catch (err) {
    console.error('Upload failed:', err)
  }
}

// Handle delete
const handleDelete = async (docId) => {
  if (!confirm('Are you sure you want to delete this document?')) return

  deletingDocId.value = docId
  try {
    await deleteDocument(props.conversationId, docId)
  } catch (err) {
    console.error('Delete failed:', err)
  } finally {
    deletingDocId.value = null
  }
}
</script>

<style scoped lang="scss">
.document-upload {
  height: 100%;
  display: flex;
  flex-direction: column;

  .v-card {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
}

.drop-zone {
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: rgba(var(--v-theme-primary), 0.5);
    background-color: rgba(var(--v-theme-primary), 0.02);
  }

  &--active {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.08);
  }
}

.document-item {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);

  &:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.04);
  }
}

kbd {
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 3px;
  padding: 2px 6px;
  font-size: 0.85em;
  font-family: monospace;
}
</style>
