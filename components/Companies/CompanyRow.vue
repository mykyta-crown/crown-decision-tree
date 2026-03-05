<template>
  <CompanyRowLayout bg-color="white">
    <template #name>
      <span class="semi-bold">{{ company.name }}</span>
    </template>
    <template #country>
      {{ company.country }}
    </template>
    <template #phone>
      {{ company.phone }}
    </template>
    <template #status>
      <v-chip :color="isActive ? 'success' : 'error'" label density="compact" class="chip-style">
        {{ isActive ? 'Active' : 'Inactive' }}
      </v-chip>
    </template>
    <template #actions>
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" icon variant="text" size="small" rounded="circle">
            <img src="@/assets/icons/basic/Kebab_Vertical.svg" alt="Options menu" />
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="handleEdit">
            <v-icon class="mr-2"> mdi-pencil </v-icon>Edit
          </v-list-item>
          <!--
            <v-list-item @click="handleAssign">
            <v-icon class="mr-2">
            mdi-account-switch
            </v-icon>Assign
            </v-list-item>
          -->
          <v-list-item @click="handleToggleActive">
            <v-icon class="mr-2"> {{ isActive ? 'mdi-cancel' : 'mdi-check-circle' }} </v-icon
            >{{ isActive ? 'Deactivate' : 'Activate' }}
          </v-list-item>
          <!--
            <v-list-item @click="handleDelete">
            <v-icon class="mr-2">
            mdi-delete
            </v-icon>Delete
            </v-list-item>
          -->
        </v-list>
      </v-menu>
    </template>
    <template #superBuyers>
      <div class="d-flex justify-space-around align-center">
        <span class="font-weight-bold">{{ superBuyers.length }}</span>
        <v-btn
          :disabled="superBuyers.length === 0"
          size="small"
          icon="mdi-chevron-right"
          class="bg-grey-lighten-4"
          color="grey"
          :to="`/users?type=super_buyer&company=${company.id}`"
        />
      </div>
    </template>
    <template #buyers>
      <div class="d-flex justify-space-around align-center">
        <span class="font-weight-bold">{{ buyers.length }}</span>
        <v-btn
          :disabled="buyers.length === 0"
          size="small"
          icon="mdi-chevron-right"
          class="bg-grey-lighten-4"
          color="grey"
          :to="`/users?type=buyer&company=${company.id}`"
        />
      </div>
    </template>
    <template #suppliers>
      <div class="d-flex justify-space-around align-center">
        <span class="font-weight-bold">{{ suppliers.length }}</span>
        <v-btn
          :disabled="suppliers.length === 0"
          size="small"
          icon="mdi-chevron-right"
          class="bg-grey-lighten-4"
          color="grey"
          :to="`/users?type=supplier&company=${company.id}`"
        />
      </div>
    </template>
  </CompanyRowLayout>
  <CompanyEditDialog v-model="showEditDialog" :company="company" />
</template>

<script setup>
import { ref } from 'vue'
import CompanyRowLayout from '@/components/Companies/CompanyRowLayout.vue'
import CompanyEditDialog from '@/components/Companies/CompanyEditDialog.vue'

const props = defineProps({
  company: {
    type: Object,
    required: true
  }
})

const supabase = useSupabaseClient()

const superBuyers = ref([])
const buyers = ref([])
const suppliers = ref([])

async function fetchProfiles() {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('company_id', props.company.id)
  superBuyers.value = profiles.filter((p) => p.role === 'super_buyer')
  buyers.value = profiles.filter((p) => p.role === 'buyer')
  suppliers.value = profiles.filter((p) => p.role === 'supplier')
}

// const { data: auctions } = await supabase.from('auctions')
//   .select('auctions_group_settings_id')
//   .eq('company_id', props.company.id)
//   .eq('usage', 'real')

// const nbAuctions = uniq(auctions.map((a) => a.auctions_group_settings_id)).length

const isActive = computed(() => {
  if (buyers.value.length > 0) {
    return !!buyers.value.find((b) => b.is_active)
  } else {
    return !!suppliers.value.find((s) => s.is_active)
  }
})

const showEditDialog = ref(false)

function handleEdit() {
  showEditDialog.value = true
}

// function handleAssign() {
//   // TODO: Implement assign logic
// }

async function handleToggleActive() {
  const newStatus = !isActive.value
  await supabase
    .from('profiles')
    .update({
      is_active: newStatus
    })
    .eq('company_id', props.company.id)

  fetchProfiles()
}

// function handleDelete() {
//   // TODO: Implement delete logic
// }

onMounted(fetchProfiles)
</script>
