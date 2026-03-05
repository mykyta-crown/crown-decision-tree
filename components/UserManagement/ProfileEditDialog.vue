<template>
  <v-dialog v-model="dialog" max-width="600px">
    <v-card>
      <v-card-title
        class="text-h6 text-grey-lighten-1 d-flex justify-space-between align-center px-8"
      >
        {{ t('profileDialog.editProfileInformations') }}
        <v-btn icon="mdi-close" variant="text" size="small" @click="dialog = false" />
      </v-card-title>
      <v-divider color="grey-lighten-2" class="mx-8" />

      <v-card-text class="px-8">
        <v-form @submit.prevent="handleSubmit">
          <v-row>
            <v-col class="text-h4" cols="auto">
              {{ t('breadcrumbs.profile') }}
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="profileForm.first_name"
                density="compact"
                :label="t('forms.fields.firstName')"
                required
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="profileForm.last_name"
                density="compact"
                :label="t('forms.fields.lastName')"
                required
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="profileForm.email"
                density="compact"
                :label="t('forms.fields.email')"
                type="email"
                readonly
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="profileForm.phone"
                density="compact"
                :label="t('forms.fields.phone')"
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="profileForm.position"
                density="compact"
                :label="t('forms.fields.position')"
                hide-details
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col class="text-h4" cols="auto">
              {{ t('common.companies') }}
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="companyForm.name"
                density="compact"
                :label="t('forms.fields.companyName')"
                required
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="companyForm.country"
                density="compact"
                :label="t('forms.fields.country')"
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="companyForm.legal_id"
                density="compact"
                :label="t('forms.fields.legalId')"
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="companyForm.phone"
                density="compact"
                :label="t('forms.fields.phone')"
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="companyForm.address"
                density="compact"
                :label="t('forms.fields.address')"
                hide-details
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-center mb-8 px-8">
        <v-row>
          <v-col cols="6">
            <v-btn-secondary size="large" block @click="dialog = false">
              {{ t('common.cancel') }}
            </v-btn-secondary>
          </v-col>
          <v-col cols="6">
            <v-btn-primary size="large" block :loading="loading" @click="handleSubmit">
              {{ t('common.save') }}
            </v-btn-primary>
          </v-col>
        </v-row>
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
  profileId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'savedProfile'])

const { t } = useTranslations()

const loading = ref(false)
const companyId = ref('')

const supabase = useSupabaseClient()

const dialog = computed({
  get: () => {
    return props.modelValue
  },
  set: (value) => emit('update:modelValue', value)
})

const profileForm = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  position: ''
})

const companyForm = ref({
  name: '',
  country: '',
  legal_id: '',
  phone: '',
  address: ''
})

watch(
  () => props.profileId,
  async () => {
    if (props.profileId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, company:companies(*)')
        .eq('id', props.profileId)
        .single()

      // Handle case where profile query fails
      if (!profile) {
        console.warn('[ProfileEditDialog] Profile query failed for profileId:', props.profileId)
        return
      }

      companyId.value = profile.company?.id || ''

      profileForm.value = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        position: profile.position
      }

      if (profile.company) {
        companyForm.value = {
          name: profile.company.name,
          country: profile.company.country,
          legal_id: profile.company.legal_id,
          phone: profile.company.phone,
          address: profile.company.address
        }
      }
    }
  },
  { immediate: true }
)

async function handleSubmit() {
  loading.value = true
  await supabase.from('profiles').update(profileForm.value).eq('id', props.profileId)

  if (companyId.value) {
    await supabase.from('companies').update(companyForm.value).eq('id', companyId.value)
  } else {
    // Chercher une entreprise existante avec ce nom (case-insensitive)
    const { data: existingCompanies } = await supabase
      .from('companies')
      .select('id')
      .ilike('name', companyForm.value.name)
      .limit(1)

    let newCompanyId
    if (existingCompanies?.length > 0) {
      // Utiliser l'entreprise existante
      newCompanyId = existingCompanies[0].id
    } else {
      // Créer une nouvelle entreprise uniquement si elle n'existe pas
      const { data: companies } = await supabase
        .from('companies')
        .insert([companyForm.value])
        .select()
      newCompanyId = companies[0].id
    }

    await supabase.from('profiles').update({ company_id: newCompanyId }).eq('id', props.profileId)
  }

  emit('savedProfile')
  loading.value = false
  dialog.value = false
}
</script>
