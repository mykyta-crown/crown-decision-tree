<template>
  <v-container class="bg-white border custom-border-radius mb-2 px-10 py-8">
    <v-row>
      <v-col cols="12" class="text-h6 font-weight-bold pb-2">
        {{ t('termsApproval.title') }}
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="pt-2">
        <v-data-table
          :headers="headers"
          :items-per-page="-1"
          :items="props.sellers"
          class="datatable"
        >
          <template #item.phone="{ item }">
            <div class="text-body-1">
              {{ item.seller_phone ?? '-' }}
            </div>
          </template>
          <template #item.email="{ item }">
            <div class="text-body-1">
              {{ item.seller_email }}
            </div>
          </template>
          <template #item.company="{ item }">
            <div v-if="item.seller_profile" class="text-body-1">
              {{ item.seller_profile?.companies?.name ?? '' }}
            </div>
            <div v-else>-</div>
          </template>
          <template #item.contact="{ item }">
            <div v-if="item.seller_profile && item.seller_profile?.first_name" class="text-body-1">
              {{ item.seller_profile?.first_name + ' ' + item.seller_profile?.last_name }}
            </div>
            <div v-else>-</div>
          </template>
          <template #item.position="{ item }">
            <div v-if="item.seller_profile && item.seller_profile.position" class="text-body-1">
              {{ item.seller_profile?.position }}
            </div>
            <div v-else>-</div>
          </template>
          <template #item.last_connection="{ item }">
            <div class="text-body-1">
              {{ formatLastConnection(item.last_connection) }}
            </div>
          </template>
          <template #item.status="{ item }">
            <!--
              <v-chip
              class="w-80 d-flex justify-center align-center"
              :class="item.terms_accepted ? 'text-green-darken-1' : ''"
              :color="item.terms_accepted ? 'green-light' : 'grey-ligthen-2'"
              variant="flat"
              label
              size="small"
              >
              {{ item.terms_accepted ? 'Approved' : 'Pending' }}
              </v-chip>
            -->
            <div
              class="text-center text-body-2 custom-chip"
              :class="`bg-${item.terms_accepted ? 'green-light' : 'grey-ligthen-2'}`"
            >
              {{
                item.terms_accepted
                  ? t('termsApproval.status.approved')
                  : t('termsApproval.status.pending')
              }}
            </div>
          </template>
          <template #bottom />
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import dayjs from 'dayjs'

const props = defineProps({
  sellers: {
    default: () => [],
    type: Array
  },
  auctionId: {
    default: '',
    type: String
  }
})

// Use translations
const { t } = useTranslations()

const headers = computed(() => [
  { title: t('termsApproval.headers.company'), value: 'company', align: 'start' },
  { title: t('termsApproval.headers.phone'), value: 'phone', align: 'start' },
  { title: t('termsApproval.headers.email'), value: 'email', align: 'start' },
  { title: t('termsApproval.headers.contact'), value: 'contact', align: 'start' },
  { title: t('termsApproval.headers.position'), value: 'position', align: 'start' },
  {
    title: t('termsApproval.headers.lastConnection'),
    value: 'last_connection',
    align: 'center'
  },
  { title: t('termsApproval.headers.status'), value: 'status', align: 'center' }
])

function formatLastConnection(lastConnection) {
  if (!lastConnection) {
    return '-'
  }

  return dayjs(lastConnection).format('DD/MM/YYYY HH:mm')
}
</script>
<style scoped>
.custom-border-radius {
  border-radius: 0 0 4px 4px !important;
}
.datatable:deep(table > thead > tr > th) {
  font-size: 14px;
  font-weight: 600;
  background-color: rgb(var(--v-theme-orange-light));
  padding: 7.5px 16px !important;
}
.datatable:deep(table > thead > tr > th:first-child) {
  border-radius: 4px 0 0 4px;
}
.datatable:deep(table > thead > tr > th:last-child) {
  border-radius: 0 4px 4px 0;
}
.datatable:deep(table > tbody > tr > td) {
  border-bottom: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
  height: 44px;
}
.datatable:deep(table > tbody > tr > td:first-child) {
  border-left: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
  border-radius: 4px 0 0 4px;
}
.datatable:deep(table > tbody > tr > td:last-child) {
  border-right: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
  border-radius: 0 4px 4px 0;
}
.custom-chip {
  margin: 0 auto;
  width: 80px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
