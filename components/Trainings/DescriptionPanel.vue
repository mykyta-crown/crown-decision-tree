<template>
  <div class="cursor-pointer" @click="emit('click')">
    <v-card
      v-if="title"
      class="pa-6 card-transition bg-white"
      :class="open ? 'card-expanded' : 'border card-collapsed'"
      elevation="0"
    >
      <v-row>
        <v-col cols="5">
          <div class="text-h6 font-weight-bold">
            {{ title }}
          </div>
          <Transition name="content-fade" mode="out-in">
            <div v-if="open" key="expanded-content">
              <div class="my-4" v-html="parseMarkdown(subtitle)" />
              <div
                v-if="description.length > 0"
                class="custom-br-height"
                v-html="parseMarkdown(description)"
              />
            </div>
          </Transition>
        </v-col>
        <v-spacer />
        <Transition name="image-slide" mode="out-in">
          <v-col v-if="open" key="image-col" cols="6" class="d-flex justify-center align-center">
            <v-dialog>
              <template #activator="{ props }">
                <v-img
                  :src="img"
                  height="100%"
                  :max-height="maxImgHeight"
                  max-width="100%"
                  :alt="title"
                  class="image-fade-in"
                  v-bind="props"
                />
              </template>
              <template #default>
                <v-img
                  :src="img"
                  height="300px"
                  max-width="100%"
                  :alt="title"
                  class="image-fade-in"
                />
              </template>
            </v-dialog>
          </v-col>
        </Transition>
      </v-row>
    </v-card>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
const { auctionType, imgName, open, panel, maxImgHeight } = defineProps({
  auctionType: {
    type: String,
    required: true
  },
  imgName: {
    type: String,
    required: true
  },
  open: {
    type: Boolean,
    required: true
  },
  panel: {
    type: String,
    required: true
  },
  maxImgHeight: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['click'])
const { t } = useTranslations()
const parseMarkdown = (text) => {
  return marked.parse(text)
}
const title = computed(() => {
  return t(`auctionDescriptions.${auctionType}.${panel}.title`)
})
const description = computed(() => {
  return t(`auctionDescriptions.${auctionType}.${panel}.description`)
})
const subtitle = computed(() => {
  return t(`auctionDescriptions.${auctionType}.${panel}.subtitle`)
})
const img = computed(() => {
  return `/trainings/${auctionType}/${imgName}.png`
})
</script>
<style scoped>
/* Card transition animations */
.card-transition {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.card-expanded {
  /* transform: scale(1.02); */
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-collapsed {
  /* transform: scale(1); */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Content fade animations */
.content-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: 0.1s;
}

.content-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.content-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.content-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* Image slide animations */
.image-slide-enter-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: 0.2s;
}

.image-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.image-slide-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}

.image-slide-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}

.image-fade-in {
  animation: imageAppear 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes imageAppear {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
.custom-br-height:deep(blockquote) {
  border-left: 1px solid #c3ddfd !important;
  padding: 0.5em 10px;
}
.custom-br-height:deep(ul) {
  margin-bottom: 12px;
  margin-top: 12px;
}

.custom-br-height:deep(ul),
.custom-br-height:deep(ol) {
  margin-left: 2em;
  text-align: left;
}
</style>
