<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title class="text-h6 text-grey-lighten-1 d-flex justify-space-between align-center">
        ASSIGN USER
        <v-btn icon="mdi-close" variant="text" size="small" @click="dialog = false" />
      </v-card-title>
      <v-divider color="grey-lighten-2" class="mx-4" />

      <v-card-text class="mx-8 pb-0">
        <v-form class="mx-4" @submit.prevent="handleAssign">
          <v-text-field
            v-model="fullName"
            :label="t('forms.fields.fullName')"
            readonly
            class="mb-2"
          />
          <v-select v-model="role" :items="roles" label="Role*" required class="mb-2" />
          <v-autocomplete
            v-model="company"
            :items="companies"
            item-title="name"
            item-value="id"
            label="Company*"
            required
            class="mb-2"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-center mb-6">
        <v-btn-secondary min-width="150" size="large" @click="dialog = false">
          Cancel
        </v-btn-secondary>
        <v-btn-primary color="black" min-width="150" size="large" @click="handleAssign">
          Assign
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
  profileId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useTranslations()

const supabase = useSupabaseClient()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const roles = [
  { value: 'admin', title: 'Admin' },
  { value: 'super_buyer', title: 'Super Buyer' },
  { value: 'buyer', title: 'Buyer' },
  { value: 'supplier', title: 'Supplier' }
]

const { data: companies } = await supabase.from('companies').select('id, name')

const fullName = ref('')
const role = ref('')
const company = ref('')

watch(
  () => props.profileId,
  async () => {
    console.log('val', props.profileId)

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, company_id, admin')
      .eq('id', props.profileId)
      .single()

    fullName.value = `${profile.first_name || ''} ${profile.last_name || ''}`
    role.value = profile.admin ? 'admin' : profile.role
    company.value = profile.company_id

    console.log(fullName.value, role.value, company.value)
  }
)

async function handleAssign() {
  await supabase
    .from('profiles')
    .update({
      admin: role.value === 'admin',
      role: role.value,
      company_id: company.value
    })
    .eq('id', props.profileId)
    .select()

  dialog.value = false
}
</script>
