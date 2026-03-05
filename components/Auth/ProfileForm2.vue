<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit">
    <v-row>
      <v-col cols="11">
        <v-row class="label-style">
          <v-col :cols="columnNumber" class="mb-2">
            <span class="text-body-2 text-grey">{{ t('profileForm.email.label') }}</span>
            <v-text-field
              v-model="profileForm.email"
              density="compact"
              type="email"
              class="mt-1"
              disabled
              readonly
              single-line
              hide-details
              :rules="emailRules"
            >
              <template #append-inner>
                <v-img
                  src="@/assets/icons/basic/Mail.svg"
                  width="20"
                  height="20"
                  style="filter: brightness(1)"
                />
              </template>
            </v-text-field>
          </v-col>
          <v-col :cols="6" class="d-flex align-end mb-2">
            <NuxtLink
              color="primary"
              class="text-start text-decoration-underline font-weight-regular text-body-1"
              to="/auth/reset"
            >
              {{ t('profileForm.changePassword') }}
            </NuxtLink>
          </v-col>
          <template v-if="!isOnboarding">
            <v-col cols="4">
              <span class="text-h4">
                {{ t('profileForm.personalInfo') }}
              </span>
            </v-col>
            <v-col cols="4">
              <span class="text-h4">
                {{ t('profileForm.companyInfo') }}
              </span>
            </v-col>
            <v-col cols="4">
              <span class="text-h4">
                {{ t('profileForm.addressInfo') }}
              </span>
            </v-col>
          </template>
          <v-col :cols="columnNumber">
            <span class="text-body-2">{{ t('profileForm.firstName.label') }}</span>
            <v-text-field
              v-model="profileForm.first_name"
              class="mt-1"
              density="compact"
              :label="t('profileForm.firstName.placeholder')"
              required
              single-line
              hide-details
              :rules="firstNameRules"
            />
          </v-col>
          <v-col :cols="columnNumber">
            <span class="text-body-2">{{ t('profileForm.company.label') }}</span>
            <v-text-field
              v-model="companyForm.name"
              class="mt-1"
              density="compact"
              :label="t('profileForm.company.placeholder')"
              required
              single-line
              hide-details
              :rules="companyNameRules"
            />
          </v-col>
          <v-col :cols="columnNumber">
            <span class="text-body-2">{{ t('profileForm.lastName.label') }}</span>
            <v-text-field
              v-model="profileForm.last_name"
              density="compact"
              class="mt-1"
              :label="t('profileForm.lastName.placeholder')"
              required
              hide-details
              single-line
              :rules="lastNameRules"
            />
          </v-col>
          <v-col :cols="columnNumber">
            <span class="text-body-2">{{ t('profileForm.country.label') }}</span>
            <v-text-field
              v-model="companyForm.country"
              density="compact"
              class="mt-1"
              :label="t('profileForm.country.placeholder')"
              single-line
              hide-details
              :rules="countryRules"
            />
          </v-col>
          <v-col :cols="columnNumber">
            <span class="text-body-2">{{ t('profileForm.position.label') }}</span>
            <v-text-field
              v-model="profileForm.position"
              density="compact"
              class="mt-1"
              :label="t('profileForm.position.placeholder')"
              hide-details
              single-line
              :rules="positionRules"
            />
          </v-col>
          <v-col :cols="columnNumber">
            <span class="text-body-2">{{ t('profileForm.address.label') }}</span>
            <v-text-field
              v-model="companyForm.address"
              density="compact"
              class="mt-1"
              :label="t('profileForm.address.placeholder')"
              single-line
              hide-details
              :rules="addressRules"
            />
          </v-col>

          <v-col :cols="columnNumber">
            <span class="text-body-2">{{ t('profileForm.phone.label') }}</span>
            <v-text-field
              v-model="profileForm.phone"
              density="compact"
              class="mt-1"
              :label="t('profileForm.phone.placeholder')"
              required
              single-line
              hide-details
              :rules="phoneRules"
            />
          </v-col>

          <v-col :cols="columnNumber">
            <span class="text-body-2">{{ t('profileForm.companyRegistration.label') }}</span>
            <v-text-field
              v-model="companyForm.legal_id"
              density="compact"
              class="mt-1"
              :label="t('profileForm.companyRegistration.placeholder')"
              single-line
              hide-details
              :rules="legalIdRules"
            />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-form>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { z } from 'zod'
import { useUser } from '#imports'

const { isOnboarding } = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  isFormValid: {
    type: Boolean,
    default: false
  },
  isOnboarding: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:loading', 'update:isFormValid'])

const { t } = useTranslations()

const columnNumber = computed(() => {
  return isOnboarding ? 6 : 4
})
const { profile, getSession } = useUser()
// const route = useRoute()
// const isOnboarding = computed(() => route.path.includes('onboarding'))
const companyId = ref('')

const supabase = useSupabaseClient()

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

// Zod schemas
const phoneRegex = /^[+\d][\d\s().-]{5,}$/i
const profileSchema = computed(() =>
  z.object({
    first_name: z.string().min(1, t('profileForm.firstName.required')),
    last_name: z.string().min(1, t('profileForm.lastName.required')),
    email: z.string().email(t('profileForm.validEmail')),
    phone: z
      .string()
      .min(6, t('profileForm.phone.tooShort'))
      .regex(phoneRegex, t('profileForm.phone.invalid')),
    position: z.string().min(1, t('profileForm.position.required')),
    onboarding_step: z.number().optional()
  })
)

const companySchema = computed(() =>
  z.object({
    name: z.string().min(1, t('profileForm.company.required')),
    country: z.string().min(1, t('profileForm.country.required')),
    legal_id: z.string().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    address: z.string().min(1, t('profileForm.address.required'))
  })
)

// Vuetify rules bound to zod parsing
const toRule = (validator) => (value) => {
  const result = validator.safeParse(value)
  return result.success || result.error?.issues?.[0]?.message || 'Invalid'
}

const emailRules = computed(() => [toRule(z.string().email(t('profileForm.validEmail')))])
const firstNameRules = computed(() => [
  toRule(z.string().min(1, t('profileForm.firstName.required')))
])
const lastNameRules = computed(() => [
  toRule(z.string().min(1, t('profileForm.lastName.required')))
])
const positionRules = computed(() => [
  toRule(z.string().min(1, t('profileForm.position.required')))
])
const phoneRules = computed(() => [
  toRule(z.string().min(6, t('profileForm.phone.tooShort'))),
  toRule(z.string().regex(phoneRegex, t('profileForm.phone.invalid')))
])
const companyNameRules = computed(() => [
  toRule(z.string().min(1, t('profileForm.company.required')))
])
const countryRules = computed(() => [toRule(z.string().min(1, t('profileForm.country.required')))])
const legalIdRules = []
const addressRules = computed(() => [toRule(z.string().min(1, t('profileForm.address.required')))])

const formRef = ref(null)
const formValidation = computed(() => {
  const profileOk = profileSchema.value.safeParse(profileForm.value).success
  const companyOk = companySchema.value.safeParse(companyForm.value).success
  return profileOk && companyOk
})

// Watch for changes and emit updates
watch(
  formValidation,
  (newValue) => {
    emit('update:isFormValid', newValue)
  },
  { immediate: true }
)

watch(
  [profileForm, companyForm],
  () => {
    const profileOk = profileSchema.value.safeParse(profileForm.value).success
    const companyOk = companySchema.value.safeParse(companyForm.value).success

    emit('update:isFormValid', profileOk && companyOk)
  },
  { deep: true }
)

watch(
  profile,
  async () => {
    if (profile.value) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, company:companies(*)')
        .eq('id', profile.value.id)
        .single()

      companyId.value = profileData.company?.id || ''

      profileForm.value = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        phone: profileData.phone,
        position: profileData.position,
        onboarding_step: profileData.onboarding_step
      }

      if (profileData.company) {
        companyForm.value = {
          name: profileData.company.name,
          country: profileData.company.country,
          legal_id: profileData.company.legal_id,
          phone: profileData.company.phone,
          address: profileData.company.address
        }
      }
    }
  },
  { immediate: true, once: true }
)

async function handleSubmit() {
  console.log('handleSubmit')
  emit('update:loading', true)

  // Vuetify validation
  const vuetifyValidation = await formRef.value?.validate()
  if (vuetifyValidation && vuetifyValidation.valid === false) {
    emit('update:loading', false)
    return
  }

  // Zod validation
  const profileCheck = profileSchema.value.safeParse(profileForm.value)
  const companyCheck = companySchema.value.safeParse(companyForm.value)

  if (!profileCheck.success || !companyCheck.success) {
    emit('update:loading', false)
    return
  }

  // Remove onboarding_step from the update since it's handled by parent
  const profileDataToUpdate = { ...profileForm.value }
  delete profileDataToUpdate.onboarding_step

  console.log('profileDataToUpdate', profileDataToUpdate)
  await supabase.from('profiles').update(profileDataToUpdate).eq('id', profile.value.id)

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

    await supabase.from('profiles').update({ company_id: newCompanyId }).eq('id', profile.value.id)
  }

  getSession(true)

  // console.log('update loading', false)
  emit('update:loading', false)
}

defineExpose({
  handleSubmit
})
</script>
<style scoped>
.label-style:deep(.v-label) {
  font-size: 14px;
  color: #8e8e8e;
}
</style>
