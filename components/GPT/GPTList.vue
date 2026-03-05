<template>
  <v-list class="gpt-list">
    <v-list-subheader class="d-flex justify-space-between align-center text-overline">
      <span>CROWN AI</span>
      <v-btn
        v-if="isAdmin"
        icon="mdi-plus"
        size="x-small"
        variant="text"
        @click="navigateTo('/gpts/create')"
      />
    </v-list-subheader>

    <v-list-item
      v-for="gpt in gpts"
      :key="gpt.id"
      :value="gpt.id"
      :active="selectedGptId === gpt.id"
      class="gpt-list-item"
      @click="$emit('select', gpt)"
    >
      <template #prepend>
        <v-avatar size="32" class="gpt-avatar">
          <img :src="`/icons/gpts/${gpt.icon || 'diamond'}.svg`" :alt="gpt.name" class="gpt-icon" />
        </v-avatar>
      </template>

      <v-list-item-title class="font-weight-medium">
        {{ gpt.name }}
      </v-list-item-title>

      <v-list-item-subtitle class="text-caption">
        {{ gpt.description }}
      </v-list-item-subtitle>

      <template #append>
        <v-chip size="x-small" :color="getProviderColor(gpt.provider)" variant="flat">
          {{ gpt.provider }}
        </v-chip>
      </template>
    </v-list-item>

    <v-divider class="my-2" />

    <!-- Empty state -->
    <v-list-item v-if="gpts.length === 0" class="text-center">
      <v-list-item-title class="text-grey-darken-1"> No GPTs available </v-list-item-title>
    </v-list-item>
  </v-list>
</template>

<script setup>
const props = defineProps({
  gpts: {
    type: Array,
    default: () => []
  },
  selectedGptId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['select'])

const { isAdmin } = useUser()

const getProviderColor = (provider) => {
  const colors = {
    openai: '#10A37F',
    anthropic: '#CC785C',
    gemini: '#4285F4',
    google: '#4285F4',
    mistral: '#FF7000',
    xai: '#000000'
  }
  return colors[provider] || 'grey'
}
</script>

<style scoped lang="scss">
.gpt-list {
  .gpt-list-item {
    border-radius: 8px;
    margin-bottom: 4px;
    transition: all 0.2s;

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
  }
}

.gpt-avatar {
  background-color: transparent;
}

.gpt-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}
</style>
