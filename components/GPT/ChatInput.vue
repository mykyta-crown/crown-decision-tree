<template>
  <div class="chat-input-wrapper">
    <!-- Document Chips -->
    <div v-if="documents.length > 0 || uploading" class="document-chips-container">
      <!-- Uploading indicator -->
      <div v-if="uploading" class="document-chip uploading">
        <div class="document-chip-content">
          <v-progress-circular indeterminate size="16" width="2" color="#00CE7C" />
          <span class="document-chip-name">{{ uploadingFileName || t('chat.uploading') }}</span>
        </div>
      </div>

      <!-- Uploaded documents -->
      <div v-for="doc in documents" :key="doc.id" class="document-chip">
        <div class="document-chip-content">
          <v-icon :color="getDocumentColor(doc.file_type)" size="16">
            {{ getDocumentIcon(doc.file_type) }}
          </v-icon>
          <span class="document-chip-name">{{ doc.filename }}</span>
        </div>
        <v-icon
          size="16"
          color="#AEB0B2"
          class="document-chip-close"
          @click="handleRemoveDocument(doc.id)"
        >
          mdi-close
        </v-icon>
      </div>
    </div>

    <!-- Input Container -->
    <div class="chat-input-container">
      <div class="input-inner">
        <!-- Upload Button -->
        <button class="upload-button" :disabled="disabled" @click="openFileDialog">
          <img
            src="@/assets/icons/basic/plus-circle.svg"
            alt="Add document"
            width="20"
            height="20"
          />
        </button>

        <!-- Hidden File Input -->
        <input
          ref="fileInput"
          type="file"
          accept=".pdf,.docx,.xlsx"
          style="display: none"
          @change="handleFileSelect"
        />

        <!-- Text Input -->
        <textarea
          ref="textareaRef"
          v-model="message"
          :placeholder="placeholder"
          :disabled="disabled"
          rows="1"
          class="text-input"
          @keydown.enter.exact.prevent="handleSend"
          @input="adjustTextareaHeight"
        />

        <!-- Send Button -->
        <button
          class="send-button"
          :disabled="(!message.trim() && documents.length === 0) || disabled || loading"
          @click="handleSend"
        >
          <v-icon color="white" size="20">mdi-arrow-up</v-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  uploading: {
    type: Boolean,
    default: false
  },
  uploadProgress: {
    type: Number,
    default: 0
  },
  uploadingFileName: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Ask AI or describe what you need…'
  },
  documents: {
    type: Array,
    default: () => []
  },
  showUploadTooltip: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['send', 'upload-document', 'remove-document'])

const { t } = useTranslations('gpts-chat')

const message = ref('')
const fileInput = ref(null)
const textareaRef = ref(null)

const adjustTextareaHeight = async () => {
  await nextTick()
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
  }
}

const openFileDialog = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const files = event.target.files
  if (files && files.length > 0) {
    emit('upload-document', files[0])
  }
  event.target.value = ''
}

const handleRemoveDocument = (docId) => {
  emit('remove-document', docId)
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
  return '#8E8E8E'
}

const handleSend = async () => {
  // Allow sending if there's a message OR if there are documents
  const hasMessage = message.value.trim()
  const hasDocuments = props.documents && props.documents.length > 0

  if ((!hasMessage && !hasDocuments) || props.disabled) return

  // Send message (can be empty if only documents are being sent)
  emit('send', message.value.trim() || t('chat.documents_uploaded'))
  message.value = ''

  // Reset textarea height
  await nextTick()
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}

// Expose focus method for parent component
const focusInput = () => {
  if (textareaRef.value) {
    textareaRef.value.focus()
  }
}

defineExpose({
  focusInput
})
</script>

<style scoped lang="scss">
.chat-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 400px;
}

// Document Chips
.document-chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.document-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f8f8f8;
  padding: 4px 8px;
  border-radius: 4px;
  gap: 4px;

  &.uploading {
    background-color: #e8f5f0;
    border: 1px solid #00ce7c;
  }

  .document-chip-content {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    min-width: 0;

    .document-chip-name {
      font-family: 'Poppins', sans-serif;
      font-size: 12px;
      font-weight: 400;
      line-height: normal;
      color: #1d1d1b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .document-chip-close {
    flex-shrink: 0;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: #1d1d1b !important;
    }
  }
}

// Input Container
.chat-input-container {
  background-color: #f8f8f8;
  border: 1px solid #e9eaec;
  border-radius: 12px;
  padding: 12px 16px;

  .input-inner {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }
}

// Upload Button
.upload-button {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: rotate(90deg);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Text Input
.text-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #1d1d1b;
  padding: 0;
  resize: none;
  overflow-y: auto;
  max-height: 120px;
  min-height: 21px;

  &::placeholder {
    color: #8e8e8e;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
}

// Send Button
.send-button {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1d1d1b;
  border: none;
  border-radius: 100px;
  padding: 0;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background-color: #3d3d3b;
  }

  &:disabled {
    background-color: #c5c7c9;
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
