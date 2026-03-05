<template>
  <v-container class="px-5 pb-10" :fluid="width < 1440">
    <v-row align="center" justify="center" class="pb-0">
      <v-col cols="12" class="pb-0">
        <span class="text-h4 d-flex align-center" style="height: 40px">
          {{ t('common.dashboard') }}
        </span>
      </v-col>
    </v-row>
    <DashboardAdminView v-if="profile && profile.admin" />
    <DashboardBuyerView
      v-if="profile && (profile.role === 'buyer' || profile.role === 'super_buyer')"
    />
    <DashboardSupplierView v-if="profile && (profile.role === 'supplier' || !profile.role)" />
  </v-container>
</template>
<script setup>
import { startTour, getVisitorId } from '@intercom/messenger-js-sdk'

const { profile } = useUser()
const { width } = useDisplay()

// Use translations
const { t } = useTranslations()

if (process.env.NODE_ENV === 'development') {
  const visitorId = getVisitorId()
  startTour('640383', {
    visitorId
  })
}
</script>
