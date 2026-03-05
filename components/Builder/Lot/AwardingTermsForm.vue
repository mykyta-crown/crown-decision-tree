<template>
  <v-card class="mb-1">
    <v-card-title class="px-10 pt-8 pb-0">
      <div class="text-h6 font-weight-semibold">
        {{ t('lots.awardingPrinciples') }}
      </div>
    </v-card-title>
    <v-card-text>
      <v-container>
        <v-row class="px-2">
          <v-col cols="12" class="quill">
            <QuillEditor
              id="awarding-editor"
              v-model:content="model.awarding_principles"
              class="cursor-text"
              style="min-height: 178px"
              theme="snow"
              content-type="html"
              :placeholder="t('lots.defaultAwardingPrinciples')"
            />
          </v-col>
          <span v-if="!isValid" class="px-3 text-error">
            {{ t('validation.required') }}
          </span>
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

// Use translations
const { t } = useTranslations()

const model = defineModel()

const isValid = computed(() => {
  return model.value.awarding_principles !== '<p><br></p>'
})
</script>

<style scoped>
.quill {
  height: 80%;
}
</style>
