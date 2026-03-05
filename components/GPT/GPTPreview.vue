<template>
  <v-card class="gpt-preview" elevation="0" variant="outlined">
    <v-card-title class="d-flex align-center">
      <v-avatar size="36" class="mr-3 gpt-avatar">
        <img :src="`/icons/gpts/${gpt.icon || 'diamond'}.svg`" :alt="gpt.name" class="gpt-icon" />
      </v-avatar>
      <div>
        <div class="text-h6">{{ gpt.name || 'Untitled GPT' }}</div>
        <v-chip size="x-small" :color="getProviderColor(gpt.provider)" variant="flat" class="mt-1">
          {{ gpt.provider || 'openai' }}
        </v-chip>
      </div>
    </v-card-title>

    <v-card-text>
      <div class="preview-section">
        <div class="text-caption text-grey mb-2">DESCRIPTION</div>
        <p class="text-body-2">
          {{ gpt.description || 'No description provided' }}
        </p>
      </div>

      <v-divider class="my-4" />

      <div class="preview-section">
        <div class="text-caption text-grey mb-2">INSTRUCTIONS</div>
        <p class="text-body-2 instructions-text">
          {{ gpt.instructions || 'No instructions provided' }}
        </p>
      </div>

      <v-divider class="my-4" />

      <div class="preview-section">
        <div class="text-caption text-grey mb-2">CONVERSATION STARTERS</div>
        <div v-if="gpt.conversation_starters && gpt.conversation_starters.length > 0">
          <v-chip
            v-for="(starter, index) in gpt.conversation_starters"
            :key="index"
            size="small"
            variant="outlined"
            class="mr-2 mb-2"
          >
            {{ starter }}
          </v-chip>
        </div>
        <p v-else class="text-body-2 text-grey">No conversation starters</p>
      </div>

      <v-divider class="my-4" />

      <div class="preview-section">
        <div class="text-caption text-grey mb-2">MODEL</div>
        <v-chip size="small" variant="tonal">
          {{ gpt.recommended_model || 'Not specified' }}
        </v-chip>
      </div>

      <!-- Mock chat preview -->
      <v-divider class="my-4" />

      <div class="preview-section">
        <div class="text-caption text-grey mb-3">PREVIEW</div>
        <div class="mock-chat">
          <div class="mock-message user">
            <div class="mock-avatar">
              <v-icon size="16">mdi-account</v-icon>
            </div>
            <div class="mock-content">
              <div class="text-caption font-weight-medium mb-1">You</div>
              <div class="text-body-2">
                {{ gpt.conversation_starters?.[0] || 'Hello!' }}
              </div>
            </div>
          </div>

          <div class="mock-message assistant">
            <div class="mock-avatar">
              <img src="~/assets/images/crown-logo.svg" alt="Crown AI" class="avatar-logo" />
            </div>
            <div class="mock-content">
              <div class="text-caption font-weight-medium mb-1">Assistant</div>
              <div class="text-body-2">Based on the instructions, I will help you...</div>
            </div>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps({
  gpt: {
    type: Object,
    required: true
  }
})

const getProviderColor = (provider) => {
  const colors = {
    openai: '#10A37F',
    anthropic: '#CC785C',
    gemini: '#4285F4'
  }
  return colors[provider] || 'grey'
}
</script>

<style scoped lang="scss">
.gpt-avatar {
  background-color: transparent;
}

.gpt-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.gpt-preview {
  .preview-section {
    .instructions-text {
      max-height: 200px;
      overflow-y: auto;
      white-space: pre-wrap;
      line-height: 1.6;
    }
  }

  .mock-chat {
    background-color: #f8f8f8;
    border-radius: 8px;
    padding: 12px;

    .mock-message {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .mock-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      &.user .mock-avatar {
        background-color: #1d1d1b;
        color: white;
      }

      &.assistant .mock-avatar {
        background-color: transparent;
        padding: 0;

        .avatar-logo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
      }

      .mock-content {
        flex: 1;
        min-width: 0;
      }
    }
  }
}
</style>
