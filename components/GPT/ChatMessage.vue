<template>
  <div :class="['chat-message', `message-${message.role}`]">
    <div class="message-content">
      <div class="message-bubble">
        <div v-if="message.role === 'user'" class="message-header">
          <span class="message-role">{{ t('messages.you') }}</span>
          <span class="message-time">
            {{ formatTime(message.created_at) }}
          </span>
        </div>

        <div class="message-text">
          <!-- Failed status -->
          <div v-if="message.status === 'failed'" class="failed-indicator">
            <v-icon color="error" size="18">mdi-alert-circle</v-icon>
            <span class="ml-2 text-error">
              {{ message.content || t('chat.failed') }}
            </span>
          </div>

          <!-- Reasoning/Thinking phase indicator (Gemini 2.5, Claude, or simulated for OpenAI) -->
          <div
            v-if="showReasoning && message.isReasoning"
            class="reasoning-container"
            :class="{ 'simulated-thinking': message.isSimulatedThinking }"
          >
            <div class="reasoning-header">
              <v-icon size="16" color="#8B5CF6">mdi-brain</v-icon>
              <span class="reasoning-title">{{ t('chat.thinking') || 'Thinking...' }}</span>
              <div class="thinking-dots">
                <span class="thinking-dot" />
                <span class="thinking-dot" />
                <span class="thinking-dot" />
              </div>
            </div>
            <!-- Only show reasoning content if we have actual tokens (not simulated) -->
            <div
              v-if="message.reasoning && !message.isSimulatedThinking"
              class="reasoning-content"
              v-html="formattedReasoning"
            />
          </div>

          <!-- Loader when generating with no content yet (and not showing reasoning/thinking) -->
          <div
            v-else-if="isGenerating && !message.content && !message.isReasoning"
            class="generating-loader"
          >
            <div class="dots-loader">
              <span class="dot" />
              <span class="dot" />
              <span class="dot" />
            </div>
          </div>

          <!-- Message content (with markdown support) -->
          <div v-if="message.content" class="message-body" v-html="formattedContent" />

          <!-- Documents attached -->
          <div v-if="message.documents && message.documents.length > 0" class="message-documents">
            <div
              v-for="doc in message.documents"
              :key="doc.id"
              class="document-item"
              @click="openDocument(doc.file_url)"
            >
              <div class="document-content">
                <v-icon :color="getDocumentColor(doc.file_type)" size="16">
                  {{ getDocumentIcon(doc.file_type) }}
                </v-icon>
                <span class="document-name">{{ doc.filename }}</span>
              </div>
              <v-icon size="16" color="#AEB0B2" class="document-link"> mdi-open-in-new </v-icon>
            </div>
          </div>

          <!-- Timer at bottom for completed assistant messages -->
          <div
            v-if="message.role === 'assistant' && message.status === 'completed'"
            class="message-footer"
          >
            <span class="message-time">
              {{ formatTime(message.created_at) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  showReasoning: {
    type: Boolean,
    default: true
  }
})

const { t } = useTranslations('gpts-chat')

const supabase = useSupabaseClient()

const isGenerating = computed(() => {
  return props.message.status === 'generating'
})

const roleLabel = computed(() => {
  if (props.message.role === 'user') return t('messages.you')
  if (props.message.role === 'assistant') return t('messages.assistant')
  return t('messages.system')
})

const formattedContent = computed(() => {
  if (!props.message.content) return ''

  // Convertir markdown en HTML puis sanitiser pour prévenir les attaques XSS
  try {
    const rawHtml = marked(props.message.content)
    return DOMPurify.sanitize(rawHtml, {
      // Options de sécurité strictes
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'b',
        'i',
        'u',
        'code',
        'pre',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'a',
        'blockquote',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      // Forcer les liens externes à s'ouvrir dans un nouvel onglet avec sécurité
      ADD_ATTR: ['target', 'rel'],
      ALLOW_DATA_ATTR: false
    })
  } catch (error) {
    console.error('Markdown parsing error:', error)
    // Sanitiser même en cas d'erreur
    return DOMPurify.sanitize(props.message.content)
  }
})

const formattedReasoning = computed(() => {
  if (!props.message.reasoning) return ''

  // Convertir markdown en HTML puis sanitiser pour les reasoning tokens
  try {
    const rawHtml = marked(props.message.reasoning)
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'code', 'pre', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
      ALLOW_DATA_ATTR: false
    })
  } catch (error) {
    console.error('Reasoning markdown parsing error:', error)
    return DOMPurify.sanitize(props.message.reasoning)
  }
})

const formatTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

const openDocument = (filePath) => {
  if (filePath) {
    // Construct full Supabase Storage public URL
    const { data } = supabase.storage.from('chat-documents').getPublicUrl(filePath)

    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank', 'noopener,noreferrer')
    }
  }
}
</script>

<style scoped lang="scss">
.chat-message {
  display: flex;
  gap: 12px;
  max-width: 100%;

  // No border between messages

  .message-avatar {
    flex-shrink: 0;

    :deep(.v-avatar) {
      border-radius: 4px;
    }

    .assistant-avatar {
      background-color: transparent !important;
      padding: 0;

      .avatar-logo {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 4px;
      }
    }
  }

  .message-content {
    flex: 0 1 auto;
    min-width: 0;
    display: flex;

    .message-bubble {
      display: inline-flex;
      flex-direction: column;
      width: fit-content;
      max-width: 100%;

      .message-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;

        .message-role {
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          font-weight: 600;
          line-height: normal;
          color: #1d1d1b;
        }

        .message-time {
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          font-weight: 400;
          line-height: normal;
          color: #8e8e8e;
        }
      }

      .message-documents {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 12px;

        .document-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #f8f8f8;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;

          &:hover {
            background-color: #eeeeee;

            .document-link {
              color: #1d1d1b !important;
            }
          }

          .document-content {
            display: flex;
            align-items: center;
            gap: 4px;
            flex: 1;
            min-width: 0;

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
          }

          .document-link {
            flex-shrink: 0;
            margin-left: 8px;
            transition: color 0.2s;
          }
        }
      }

      .message-text {
        // Reasoning/Thinking container (Gemini 2.5 thinking tokens, or simulated for OpenAI)
        .reasoning-container {
          background-color: #f8f7ff;
          border: 1px solid #e5e3ff;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          max-height: 200px;
          overflow-y: auto;

          // Simulated thinking mode - compact header-only style
          &.simulated-thinking {
            max-height: auto;
            padding: 10px 12px;

            .reasoning-header {
              margin-bottom: 0;
            }
          }

          .reasoning-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;

            .reasoning-title {
              font-family: 'Poppins', sans-serif;
              font-size: 12px;
              font-weight: 600;
              color: #8b5cf6;
            }

            .thinking-dots {
              display: flex;
              align-items: center;
              gap: 3px;

              .thinking-dot {
                width: 4px;
                height: 4px;
                border-radius: 50%;
                background-color: #8b5cf6;
                animation: thinkingPulse 1.4s ease-in-out infinite;

                &:nth-child(1) {
                  animation-delay: 0s;
                }

                &:nth-child(2) {
                  animation-delay: 0.2s;
                }

                &:nth-child(3) {
                  animation-delay: 0.4s;
                }
              }
            }
          }

          .reasoning-content {
            font-family: 'Poppins', sans-serif;
            font-size: 12px;
            font-weight: 400;
            line-height: 1.6;
            color: #6b7280;

            :deep(p) {
              margin-bottom: 8px;

              &:last-child {
                margin-bottom: 0;
              }
            }

            :deep(code) {
              background-color: #ede9fe;
              padding: 2px 4px;
              border-radius: 3px;
              font-family: 'Courier New', monospace;
              font-size: 0.9em;
              color: #7c3aed;
            }
          }

          &::-webkit-scrollbar {
            width: 4px;
          }

          &::-webkit-scrollbar-thumb {
            background-color: #c4b5fd;
            border-radius: 4px;
          }
        }

        .generating-loader {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 4px 0;
          min-height: 32px;

          .dots-loader {
            display: flex;
            align-items: center;
            gap: 5px;

            .dot {
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background-color: #00ce7c;
              animation: dotPulse 1.4s ease-in-out infinite;

              &:nth-child(1) {
                animation-delay: 0s;
              }

              &:nth-child(2) {
                animation-delay: 0.2s;
              }

              &:nth-child(3) {
                animation-delay: 0.4s;
              }
            }
          }
        }

        .generating-indicator {
          display: flex;
          align-items: center;
          color: #666;
          margin-top: 8px;
        }

        .failed-indicator {
          display: flex;
          align-items: center;
        }

        .message-body {
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.7;
          color: #1d1d1b;
          word-wrap: break-word;

          // Remove top margin from first element
          :deep(> *:first-child) {
            margin-top: 0 !important;
          }

          // Style markdown elements
          :deep(p) {
            margin-bottom: 12px;

            &:last-child {
              margin-bottom: 0;
            }
          }

          :deep(code) {
            background-color: #f3f2ff;
            padding: 3px 8px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: #5b21b6;
          }

          :deep(pre) {
            background-color: #1d1d1b;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 16px 0;

            code {
              padding: 0;
              background: none;
              color: #f8f8f8;
            }
          }

          :deep(ul),
          :deep(ol) {
            margin-left: 24px;
            margin-bottom: 16px;

            li {
              margin-bottom: 8px;
              line-height: 1.6;
            }
          }

          :deep(h1),
          :deep(h2),
          :deep(h3) {
            margin-top: 20px;
            margin-bottom: 12px;
            font-weight: 600;
            line-height: 1.3;
          }

          :deep(h1) {
            font-size: 20px;
          }

          :deep(h2) {
            font-size: 17px;
          }

          :deep(h3) {
            font-size: 15px;
          }

          :deep(table) {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            background-color: #ffffff;
            border: 1px solid #e9eaec;
            border-radius: 4px;
            overflow: hidden;
            font-size: 14px;
          }

          :deep(thead) {
            background-color: #f8f8f8;
          }

          :deep(th) {
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #1d1d1b;
            border-bottom: 2px solid #e9eaec;
          }

          :deep(td) {
            padding: 12px;
            border-bottom: 1px solid #e9eaec;
            color: #1d1d1b;
          }

          :deep(tbody tr:last-child td) {
            border-bottom: none;
          }

          :deep(tbody tr:hover) {
            background-color: #fafafa;
          }

          :deep(strong),
          :deep(b) {
            font-weight: 600;
            color: #000000;
          }

          :deep(em),
          :deep(i) {
            font-style: italic;
            color: #444444;
          }
        }

        .message-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;

          .message-time {
            font-family: 'Poppins', sans-serif;
            font-size: 11px;
            font-weight: 400;
            color: #aeb0b2;
          }
        }
      }
    }
  }

  // Assistant message styling (aligned left)
  &.message-assistant {
    align-self: flex-start;
    max-width: 85%;
    width: fit-content;

    .message-content {
      flex: 0 1 auto;
      background-color: transparent;
    }

    .message-bubble {
      background-color: transparent;
      border-radius: 0;
      padding: 12px 0;
      width: fit-content;

      .message-text {
        .message-footer {
          justify-content: flex-start;
        }
      }
    }
  }

  // User message styling (aligned right, white background, no avatar)
  &.message-user {
    align-self: flex-end;
    max-width: 495px;

    .message-content {
      justify-content: flex-end;
      flex: 0 1 auto;
    }

    .message-bubble {
      background-color: #ffffff;
      border-radius: 4px;
      padding: 12px;
      width: fit-content;
      max-width: 100%;
    }
  }
}

// Animation pour le message en cours de génération
.message-assistant {
  .generating-indicator {
    animation: pulse 1.5s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes dotPulse {
  0%,
  80%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.3);
    opacity: 1;
  }
}

@keyframes thinkingPulse {
  0%,
  80%,
  100% {
    transform: scale(1);
    opacity: 0.4;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}
</style>
