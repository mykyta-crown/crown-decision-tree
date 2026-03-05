<template>
  <v-card
    v-if="!loading"
    link
    class="px-2 fill-height"
    @click="
      router.push(
        `/auctions/${auction?.auctions_group_settings_id}/lots/${auction?.auction_id}/${isBuyer || isObserver ? 'buyer' : 'supplier'}`
      )
    "
  >
    <v-card-item class="pt-5">
      <v-card-title class="font-weight-bold text-capitalize text-grey-darken-2 d-flex flex-column">
        <div class="d-flex align-center justify-space-between text-truncate">
          <span class="d-block text-truncate text-body-1 font-weight-bold text-grey mr-4 mb-1">{{
            auction?.name
          }}</span>

          <div class="d-flex">
            <AuctionsInputsFavoriteIcon :auction="auction" />
            <AuctionsInputsOptionsMenu :auction="auction" />
          </div>
        </div>
        <span class="text-grey text-body-2">{{
          auction?.profiles?.companies?.name ?? '&nbsp;'
        }}</span>
      </v-card-title>
      <v-divider color="grey-ligthen-1 my-2" />
    </v-card-item>

    <v-card-text class="d-flex justify-space-between text-body-1 pb-1">
      <div class="d-flex flex-column align-start ga-2">
        <div class="d-flex align-center">
          <img class="mr-2" :src="`/icons/calendar_days.svg`" />
          {{ start?.format('MMMM DD') || '--' }}
        </div>
        <div class="d-flex align-center">
          <img class="mr-2" src="/icons/clock.svg" />
          {{ start?.format('HH:mm A') || '--' }}
        </div>
      </div>
      <div class="d-flex flex-column align-start ga-2">
        <div class="d-flex align-center text-capitalize">
          <img class="mr-2" :src="`/icons/auction.svg`" />{{ auction.type }}
        </div>
        <div class="d-flex align-center text-capitalize">
          <img class="mr-2" :src="`/icons/letter-t-square.svg`" />
          {{ auction.usage ? t(`auction.usage.${auction.usage}`) : t('auction.usage.test') }}
        </div>
      </div>
    </v-card-text>

    <v-card-actions>
      <div class="text-grey text-body-2 d-flex ga-2 align-end justify-space-between w-100 mb-3">
        <div class="pl-2 mb-1 owner-name-container">
          <div class="owner-name-wrapper">
            <span class="font-weight-bold">{{ t('auctionCard.ownedBy') }} </span>
            <span class="owner-name-text"
              >{{ auction?.profiles?.first_name }} {{ auction?.profiles?.last_name }}</span
            >
            <v-tooltip
              activator="parent"
              location="top left"
              content-class="bg-white text-body-2 border"
            >
              {{ auction?.profiles?.first_name }} {{ auction?.profiles?.last_name }}
            </v-tooltip>
          </div>
        </div>
        <v-chip
          class="d-flex justify-center align-center text-body-2 px-5"
          :color="status.color"
          label
          variant="flat"
          size="small"
        >
          {{ t(`status.${status.label}`) }}
        </v-chip>
      </div>
    </v-card-actions>
  </v-card>
  <v-skeleton-loader v-else class="fill-height custom-skeleton" type="card" />
</template>

<script setup>
import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/fr'

const { auction } = defineProps(['auction', 'loading'])

// Use translations
const { t, locale } = useTranslations()

// Set dayjs locale based on current language and watch for changes
watchEffect(() => {
  dayjs.locale(locale.value)
})

const router = useRouter()

const { user, profile } = useUser()
const { status, start } = useAuctionTimer(toRef(() => auction))

const isObserver = computed(() => {
  return (
    !isBuyer.value &&
    !auction.value?.auctions_sellers?.includes(user.value.email) &&
    profile.value?.admin
  )
})

const isBuyer = computed(() => {
  return user.value.id === auction.buyer_id
})
</script>
<style scoped>
.custom-skeleton:deep(.v-skeleton-loader__image),
.custom-skeleton:deep(.v-skeleton-loader__heading) {
  background-color: rgb(var(--v-theme-grey-ligthen-1)) !important;
}

.owner-name-container {
  max-width: 65%;
  min-width: 0;
}

.owner-name-wrapper {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.owner-name-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
