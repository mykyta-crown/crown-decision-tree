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
      <v-chip
        class="chip-style text-body-2"
        :color="isActive ? 'green-light-3' : 'grey-ligthen-2'"
        label
        density="compact"
        variant="flat"
      >
        <span :class="isActive ? 'text-success-status' : 'text-primary'">
          {{ isActive ? t('status.active') : t('status.inactive') }}
        </span>
      </v-chip>
    </template>
    <template #actions>
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" icon size="small" rounded="circle">
            <v-img src="/assets/icons/basic/Kebab_Vertical.svg" width="24" height="24" />
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="handleEdit">
            <v-icon class="mr-2"> mdi-pencil </v-icon>{{ t('actions.edit') }}
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
            >{{ isActive ? t('actions.deactivate') : t('actions.activate') }}
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
        <span class="font-weight-bold">{{ nbAuctions }}</span>
        <v-btn
          :disabled="nbAuctions === 0"
          size="x-small"
          icon
          class="bg-grey-lighten-4 border border-grey-lighten-2"
          :to="`/home?clients=${encodeURIComponent(company.name)}`"
        >
          <v-img src="@/assets/icons/basic/Chevron_right.svg" width="24" height="24" />
        </v-btn>
      </div>
    </template>
    <template #buyers>
      <div class="d-flex justify-space-around align-center">
        <span class="font-weight-bold">{{ buyers.length }}</span>
        <v-btn
          :disabled="buyers.length === 0"
          size="x-small"
          icon
          class="bg-grey-lighten-4 border border-grey-lighten-2"
          :to="`/users?type=buyer&company=${company.id}`"
        >
          <v-img src="@/assets/icons/basic/Chevron_right.svg" width="24" height="24" />
        </v-btn>
      </div>
    </template>
    <template #suppliers>
      <div class="d-flex justify-space-around align-center">
        <span class="font-weight-bold">{{ nbSellers }}</span>
        <v-btn
          :disabled="nbSellers === 0"
          size="x-small"
          icon
          class="bg-grey-lighten-4 border border-grey-lighten-2"
          :to="`/dashboard?company=${company.id}`"
        >
          <v-img src="@/assets/icons/basic/Chevron_right.svg" width="24" height="24" />
        </v-btn>
      </div>
    </template>
  </CompanyRowLayout>
  <CompanyEditDialog v-model="showEditDialog" :company="company" />
</template>

<script setup>
import { uniq } from 'lodash'
import { ref } from 'vue'
import CompanyRowLayout from '@/components/Companies/CompanyRowLayout.vue'
import CompanyEditDialog from '@/components/Companies/CompanyEditDialog.vue'

const props = defineProps({
  company: {
    type: Object,
    required: true
  }
})

// Use translations
const { t } = useTranslations()

const supabase = useSupabaseClient()

const buyers = ref([])

async function fetchProfiles() {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('company_id', props.company.id)
  buyers.value = profiles.filter((p) => p.role === 'buyer' || p.role === 'super_buyer')
}

const { data: auctions } = await supabase
  .from('auctions')
  .select('auctions_group_settings_id, auctions_sellers(*)')
  .match({
    usage: 'real',
    deleted: false,
    published: true,
    company_id: props.company.id
  })

const nbAuctions = uniq(auctions.map((a) => a.auctions_group_settings_id)).length

const auctionsSellers = []

auctions.forEach((a) => {
  auctionsSellers.push(...a.auctions_sellers)
})

const nbSellers = uniq(auctionsSellers.map((s) => s.seller_email)).length

const isActive = computed(() => {
  if (buyers.value.length > 0) {
    return !!buyers.value.find((b) => b.is_active)
  }

  return false
})

const showEditDialog = ref(false)

function handleEdit() {
  showEditDialog.value = true
}

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

onMounted(fetchProfiles)
</script>
