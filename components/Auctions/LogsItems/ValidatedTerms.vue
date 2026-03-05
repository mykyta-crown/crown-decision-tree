<template>
  <AuctionsLogsItemsTableRow :custom-icon="true" color="primary">
    <template #custom-icon>
      <v-img
        src="@/assets/icons/activity-log/check-square-one.svg"
        width="20"
        height="20"
        style="filter: brightness(0)"
      />
    </template>
    <div class="text-primary">
      {{ t('activityLog.youNowParticipateIn') }} {{ props.text }} {{ t('activityLog.eAuction') }} !
    </div>
  </AuctionsLogsItemsTableRow>
</template>

<script setup>
const props = defineProps(['text'])
const { t } = useTranslations()
</script>
