<template>
  <v-dialog v-model="dialog" max-width="617px">
    <v-card class="px-4">
      <v-card-title
        class="text-h6 text-grey-lighten-1 d-flex justify-space-between align-center px-2 pt-5"
      >
        {{ isEdit ? t('dialog.titles.editCompany') : t('dialog.titles.createCompany') }}
        <v-btn :icon="true" rounded="pill" variant="text" size="small" @click="dialog = false">
          <img src="@/assets/icons/basic/Close.svg" height="24" alt="Close modal" />
        </v-btn>
      </v-card-title>
      <v-divider color="grey-lighten-2" class="mx-2" />

      <v-card-text class="mx-16 px-7 pb-0 pt-5">
        <v-row class="mb-4" justify="center">
          <v-col class="text-h4" cols="auto">
            {{
              isEdit
                ? t('dialog.subtitles.editCompanyDetails')
                : t('dialog.subtitles.createNewCompany')
            }}
          </v-col>
        </v-row>
        <v-form class="mx-10" @submit.prevent="handleSubmit">
          <div :for="form.name" class="text-body-2 mb-1">{{ t('dialog.fields.companyName') }}*</div>
          <v-text-field
            v-model="form.name"
            density="compact"
            :placeholder="t('dialog.fields.companyName')"
            required
          />
          <div class="text-body-2 mb-1">{{ t('dialog.fields.country') }}*</div>
          <v-text-field
            v-model="form.country"
            density="compact"
            :placeholder="t('dialog.fields.country')"
          />
          <div class="text-body-2 mb-1">{{ t('dialog.fields.address') }}*</div>
          <v-text-field
            v-model="form.address"
            density="compact"
            :placeholder="t('dialog.fields.address')"
          />
          <div class="text-body-2 mb-1">{{ t('dialog.fields.phone') }}*</div>
          <v-text-field
            v-model="form.phone"
            density="compact"
            :placeholder="t('dialog.fields.phone')"
          />
          <div class="text-body-2 mb-1">{{ t('dialog.fields.legalId') }}*</div>
          <v-text-field
            v-model="form.legal_id"
            density="compact"
            :placeholder="t('dialog.fields.legalId')"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-center ga-5 mb-14">
        <v-btn-secondary width="150" height="40" @click="dialog = false">
          {{ t('buttons.cancel') }}
        </v-btn-secondary>
        <v-btn-primary width="150" height="40" :loading="loading" @click="handleSubmit">
          {{ isEdit ? t('buttons.update') : t('buttons.create') }}
        </v-btn-primary>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  company: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

// Use translations
const { t } = useTranslations()

const supabase = useSupabaseClient()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)

const isEdit = computed(() => !!props.company?.id)

const form = ref({
  name: '',
  country: '',
  legal_id: '',
  phone: '',
  address: ''
})

watch(
  () => props.company,
  async () => {
    if (props.company) {
      form.value = {
        name: props.company.name || '',
        country: props.company.country || '',
        legal_id: props.company.legal_id || '',
        phone: props.company.phone || '',
        address: props.company.address || ''
      }
    } else {
      form.value = {
        name: '',
        country: '',
        legal_id: '',
        phone: '',
        address: ''
      }
    }
  },
  { immediate: true }
)

async function handleSubmit() {
  loading.value = true

  if (isEdit.value) {
    await supabase.from('companies').update(form.value).eq('id', props.company.id)
  } else {
    // Chercher une entreprise existante avec ce nom (case-insensitive)
    const { data: existingCompanies } = await supabase
      .from('companies')
      .select('id')
      .ilike('name', form.value.name)
      .limit(1)

    if (existingCompanies?.length > 0) {
      // Une entreprise avec ce nom existe déjà - ne pas créer de doublon
      console.warn('Company with name already exists:', form.value.name)
    } else {
      // Créer une nouvelle entreprise uniquement si elle n'existe pas
      await supabase.from('companies').insert([form.value])
    }
  }

  dialog.value = false
  loading.value = false
}
</script>
