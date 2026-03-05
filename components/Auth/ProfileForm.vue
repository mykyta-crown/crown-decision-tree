<template>
  <v-form v-model="isValid" @submit.prevent="saveProfile">
    <v-row>
      <v-col cols="12" class="d-flex justify-center d-lg-none">
        <img src="@/assets/img/auth/logo_green.svg" />
      </v-col>
      <v-col cols="12" class="text-center">
        <h4>{{ t('profileForm.title') }}</h4>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="6">
        <v-text-field
          v-model="profile.company"
          variant="outlined"
          :label="t('profileForm.company.label')"
          :placeholder="t('profileForm.company.placeholder')"
          :rules="[stringRule]"
          required
        />
      </v-col>
      <v-col cols="6">
        <v-text-field
          v-model="profile.firstName"
          variant="outlined"
          :label="t('profileForm.firstName.label')"
          :placeholder="t('profileForm.firstName.placeholder')"
          :rules="[stringRule]"
        />
      </v-col>
      <v-col cols="6">
        <v-autocomplete
          v-model="profile.country"
          variant="outlined"
          :label="t('profileForm.country.label')"
          :items="sortedCountries"
          :placeholder="t('profileForm.country.placeholder')"
          :rules="[stringRule]"
          required
        />
      </v-col>
      <v-col cols="6">
        <v-text-field
          v-model="profile.lastName"
          variant="outlined"
          :label="t('profileForm.lastName.label')"
          :placeholder="t('profileForm.lastName.placeholder')"
          :rules="[stringRule]"
        />
      </v-col>
      <v-col cols="6">
        <v-text-field
          v-model="profile.address"
          variant="outlined"
          :label="t('profileForm.address.label')"
          :placeholder="t('profileForm.address.placeholder')"
          :rules="[stringRule]"
        />
      </v-col>
      <v-col cols="6">
        <v-text-field
          v-model="profile.position"
          variant="outlined"
          :label="t('profileForm.position.label')"
          :placeholder="t('profileForm.position.placeholder')"
          :rules="[stringRule]"
        />
      </v-col>
      <v-col cols="6">
        <v-text-field
          v-model="profile.companyId"
          variant="outlined"
          :label="t('profileForm.companyId.label')"
          :rules="[stringRule]"
        />
      </v-col>
      <v-col cols="6">
        <v-text-field
          v-model="profile.phone"
          variant="outlined"
          :rules="[stringRule]"
          :label="t('profileForm.phone.label')"
        />
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="12">
        <AuthErrorAlert :auth-error="errorMsg" />
      </v-col>
      <v-col cols="6">
        <v-btn block color="primary" type="submit">
          {{ t('profileForm.save') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>

<script setup>
import countries from '@/assets/data/countriesNames.json'
import { ref } from 'vue'
import { z } from 'zod'

const props = defineProps(['noRedirect'])
const emit = defineEmits(['saved'])

const schemaToRule = useZodSchema()
const router = useRouter()
const supabase = useSupabaseClient()

// Use translations
const { t } = useTranslations()

const { user, profile: profileConnected, getSession } = useUser()

const sortedCountries = countries.sort()

const isValid = ref(false)

const profile = ref({
  company: profileConnected.value?.companies?.name || '',
  firstName: profileConnected.value?.first_name || '',
  lastName: profileConnected.value?.last_name || '',
  country: profileConnected.value?.companies?.country || null,
  address: profileConnected.value?.companies?.address || '',
  position: profileConnected.value?.position || '',
  companyId: profileConnected.value?.companies?.legal_id || '',
  phone: profileConnected.value?.phone || ''
})

watch(profileConnected, (newProfile) => {
  if (newProfile) {
    profile.value = {
      company: newProfile.companies.name,
      firstName: newProfile.first_name,
      lastName: newProfile.last_name,
      country: newProfile.companies.country,
      address: newProfile.companies.address,
      position: newProfile.position,
      companyId: newProfile.companies.legal_id,
      phone: newProfile.phone
    }
  }
})

const stringSchema = z
  .string({
    required_error: t('profileForm.required'),
    invalid_type_error: t('profileForm.required')
  })
  .min(1, { message: t('profileForm.required') })
const stringRule = schemaToRule(stringSchema)

const errorMsg = ref('')

async function saveProfile() {
  if (isValid.value) {
    let companyId
    let companyError = null

    // Chercher une entreprise existante avec ce nom (case-insensitive)
    const { data: existingCompanies } = await supabase
      .from('companies')
      .select('id')
      .ilike('name', profile.value.company)
      .limit(1)

    if (existingCompanies?.length > 0) {
      // Utiliser l'entreprise existante
      companyId = existingCompanies[0].id
    } else {
      // Créer une nouvelle entreprise uniquement si elle n'existe pas
      const { data, error } = await supabase
        .from('companies')
        .insert([
          {
            name: profile.value.company,
            address: profile.value.address,
            legal_id: profile.value.companyId,
            country: profile.value.country,
            phone: profile.value.phone
          }
        ])
        .select()
      companyId = data?.[0]?.id
      companyError = error
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: profile.value.firstName,
        last_name: profile.value.lastName,
        phone: profile.value.phone,
        company_id: companyId,
        position: profile.value.position
      })
      .eq('id', user.value.id)

    if (!error && !companyError) {
      getSession(true)
      emit('saved', true)
      if (!props.noRedirect) router.push('/home')
    } else {
      console.log('companyError: ', companyError, ' - ', error)
      errorMsg.value = (error?.message || '') + (companyError?.message || '')
    }
  }
}
</script>
