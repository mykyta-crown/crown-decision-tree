<template>
  <v-row>
    <v-col cols="12">
      <v-row>
        <v-col cols="12" md="6" class="d-flex ga-5">
          <DashboardInfoCard
            :custom-icon="true"
            icon-color="yellow"
            class="w-100"
            :label="profile?.position"
            :number="`${profile?.first_name} ${profile?.last_name}`"
            supplier-text-style="text-h6"
          >
            <template #custom-icon>
              <v-img
                src="@/assets/icons/dashboard/Supplier.svg"
                width="20"
                height="20"
                style="filter: brightness(0)"
              />
            </template>
          </DashboardInfoCard>

          <DashboardInfoCard
            :custom-icon="true"
            icon-color="blue-light"
            :label="profile?.companies.country"
            :number="profile?.companies.name"
            class="w-100"
            supplier-text-style="text-h6"
          >
            <template #custom-icon>
              <v-img
                src="@/assets/icons/dashboard/companies.svg"
                width="20"
                height="20"
                style="filter: brightness(0)"
              />
            </template>
          </DashboardInfoCard>
        </v-col>

        <v-col cols="12" md="6" class="d-flex ga-5">
          <DashboardInfoCard
            class="w-100"
            :custom-icon="true"
            icon-color="green-light"
            :label="t('cards.plannedAuctions')"
            :number="nbPlannedAuctions"
          >
            <template #custom-icon>
              <v-img
                src="@/assets/icons/dashboard/Planned eAuction.svg"
                width="20"
                height="20"
                style="filter: brightness(0)"
              />
            </template>
          </DashboardInfoCard>

          <DashboardInfoCard
            :custom-icon="true"
            icon-color="pink"
            :label="t('cards.doneAuctions')"
            class="w-100"
            :number="nbPassedAuctions"
          >
            <template #custom-icon>
              <v-img
                src="@/assets/icons/dashboard/Done eAuction.svg"
                width="20"
                height="20"
                style="filter: brightness(0)"
              />
            </template>
          </DashboardInfoCard>
        </v-col>
      </v-row>
    </v-col>
    <v-col cols="12" md="4">
      <DashboardCard :title="t('calendar.title')">
        <DashboardCalendar v-model="currentDisplayedDate" />
      </DashboardCard>
    </v-col>
    <v-col cols="12" md="8">
      <DashboardCard :title="t('notifications.title')">
        <template #title-content>
          <v-spacer />
          <span class="text-body-2 text-grey-darken-1">{{ t('notifications.dateTime') }}</span>
        </template>
        <div class="notifications-row">
          <v-row v-for="(notification, i) in notifications" :key="i" dense class="mt-3">
            <v-col cols="auto" class="d-flex align-center pl-2 ga-2">
              <v-img
                :src="notification.icon"
                width="20"
                height="20"
                style="filter: brightness(0)"
              />
              <span v-html="notification.message" />
            </v-col>
            <v-spacer />
            <v-col cols="auto" class="text-end">
              <span class="text-grey-darken-1">{{ notification.time }}</span>
            </v-col>
          </v-row>
        </div>
      </DashboardCard>
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="12">
      <DashboardDataTabs />
    </v-col>
  </v-row>
</template>

<script setup>
import dayjs from 'dayjs'
import { uniq, groupBy, map } from 'lodash'

// Use translations
const { t } = useTranslations()

const supabase = useSupabaseClient()
const { profile } = useUser()

const currentDisplayedDate = ref(dayjs().toISOString())

const nbPassedAuctions = ref(0)
const nbPlannedAuctions = ref(0)

const auctionsQuery = supabase
  .from('auctions')
  .select('auctions_group_settings_id, name, created_at, start_at, end_at')
  .eq('deleted', false)
  .eq('published', true)
  .eq('usage', 'real')

const { data: auctions } = await auctionsQuery

const passedAuctions = auctions.filter((a) => dayjs(a.end_at).isBefore(dayjs()))
const plannedAuctions = auctions.filter((a) => dayjs(a.start_at).isAfter(dayjs()))

const groupedAuctions = map(groupBy(auctions, 'auctions_group_settings_id'), (auctions) => {
  console.log('auctions', auctions[0])

  return {
    id: auctions[0].auctions_group_settings_id,
    name: auctions[0].name,
    created_at: auctions[0].created_at,
    start_at: auctions[0].start_at,
    end_at: auctions[0].end_at
  }
}).toSorted((a, b) => {
  return dayjs(b.start_at).diff(dayjs(a.start_at))
})

const notifications = computed(() => {
  const notifs = []

  groupedAuctions.forEach((auction) => {
    if (dayjs(auction.start_at).isAfter(dayjs())) {
      notifs.push({
        icon: '/icons/Clock.svg',
        message: `<b>"${auction.name}"</b> ${t('notifications.eAuctionDateSet')} ${dayjs(auction.start_at).format('HH:mm MMM DD')}`,
        time: dayjs(auction.created_at).format('HH:mm MMM DD')
      })
    }

    notifs.push({
      icon: '/icons/Planned eAuction.svg',
      message: `${t('notifications.invitedToParticipate')} <b>"${auction.name}"</b>`,
      time: dayjs(auction.created_at).format('HH:mm MMM DD')
    })
  })

  return notifs
})

nbPassedAuctions.value = uniq(passedAuctions.map((a) => a.auctions_group_settings_id)).length
nbPlannedAuctions.value = uniq(plannedAuctions.map((a) => a.auctions_group_settings_id)).length
</script>

<style scoped>
.notifications-row {
  max-height: 90%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 15px;
  margin-right: -15px;
}
.notifications-row::-webkit-scrollbar {
  width: 5px;
}
/* Track */
.notifications-row::-webkit-scrollbar-track {
  border: 1px solid #f8f8f8;
  background: #f8f8f8;
}

/* Handle */
.notifications-row::-webkit-scrollbar-thumb {
  border: 3px solid #c5c7c9;
  border-radius: 9px;
  background-clip: content-box;
}

/* Handle on hover */
.notifications-row::-webkit-scrollbar-thumb:hover {
  background: #c5c7c9;
  border: 2px solid #d4d5d5;
  height: 2px;
  width: 5px;
  border-radius: 9px;
  background-clip: content-box;
}
</style>
