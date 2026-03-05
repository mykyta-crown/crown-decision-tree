<template>
  <AuctionsLogsItemsTableRow :custom-icon="true" color="primary">
    <template #custom-icon>
      <v-img
        src="@/assets/icons/activity-log/Clock.svg"
        width="20"
        height="20"
        style="filter: brightness(0)"
      />
    </template>
    <span class="text-grey">
      {{ t('activityLog.auctionDateSetTo') }}
      <span class="text-primary"
        >{{ dayjs(text).format('MMM DD YYYY') }} {{ t('common.at') }}
        {{ dayjs(text).format(`HH:mm, ${timezone}`) }}</span
      >
    </span>
    <v-tooltip
      activator="parent"
      location="top start"
      content-class="bg-white text-black border text-body-2"
    >
      <span class="text-primary"
        >{{ t('activityLog.auctionDateSetTo') }}
        <span class="text-primary"
          >{{ dayjs(text).format('MMM DD YYYY') }} {{ t('common.at') }}
          {{ dayjs(text).format(`HH:mm, ${timezone}`) }}</span
        ></span
      >
    </v-tooltip>
  </AuctionsLogsItemsTableRow>
</template>

<script setup>
import dayjs from 'dayjs'

defineProps(['timestamp', 'text', 'timezone'])
const { t } = useTranslations()
</script>
