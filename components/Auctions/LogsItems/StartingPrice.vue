<template>
  <AuctionsLogsItemsTableRow color="primary" :custom-icon="true">
    <template #custom-icon>
      <v-img
        src="@/assets/icons/basic/information-square.svg"
        width="20"
        height="20"
        style="filter: brightness(0)"
      />
    </template>

    <span class="text-primary">{{ t('activityLog.eAuctionStartsAtPrice') }}</span>
    {{ ' '
    }}<span class="text-primary">{{ formatNumber(price, 'currency', auction.currency) }}</span>
    <v-tooltip
      activator="parent"
      location="top start"
      content-class="bg-white text-black border text-body-2"
    >
      <span class="text-primary">{{ t('activityLog.eAuctionStartsAtPrice') }}</span>
      {{ ' '
      }}<span class="text-primary">{{ formatNumber(price, 'currency', auction.currency) }}</span>
    </v-tooltip>
  </AuctionsLogsItemsTableRow>
</template>

<script setup>
const { auction } = defineProps(['auction', 'price'])
const { t } = useTranslations()
</script>
