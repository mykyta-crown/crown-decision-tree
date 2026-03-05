<template>
  <v-card class="mb-1">
    <v-card-title class="px-10 pt-8">
      <v-text-field
        v-model="model.name"
        class="font-weight-semibold textfield"
        width="351px"
        :rules="[nameRule]"
        @click.stop
        @focus.stop="titleFocus = true"
        @blur.stop="titleFocus = false"
        @keyup.prevent
      >
        <template #append-inner>
          <v-img src="@/assets/icons/basic/Edit_Line.svg" width="20" height="20" />
        </template>
      </v-text-field>
    </v-card-title>

    <v-card-text class="pb-1">
      <v-container class="px-6 pt-0">
        <BuilderEnglishLotRulesForm
          v-if="props.basics.type === 'reverse' || props.basics.type === 'sealed-bid'"
          v-model="model"
          :basics="props.basics"
        />
        <BuilderJapaneseLotRulesForm
          v-else-if="props.basics.type === 'japanese'"
          v-model="model"
          :basics="props.basics"
        />
        <BuilderDutchLotRulesForm
          v-else-if="props.basics.type === 'dutch'"
          v-model="model"
          :basics="props.basics"
        />
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { z } from 'zod'

const props = defineProps({
  basics: {
    type: Object,
    required: true
  }
})

// Use translations
const { t } = useTranslations()

const schemaToRule = useZodSchema()
const nameRule = computed(() => {
  const nameSchema = z.string().min(1, { message: t('validation.required') })
  return schemaToRule(nameSchema)
})

const titleFocus = ref(false)

const model = defineModel()

watch(
  titleFocus,
  (newVal) => {
    if (model.value.name.length === 0 && !newVal) {
      model.value.name = 'Lot Name'
    }
  },
  { deep: true }
)
</script>

<style scoped>
.textfield:deep(input) {
  font-size: 16px !important;
  field-sizing: content;
}
</style>
