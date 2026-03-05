<template>
  <AuctionsLogsItemsAuctionBid v-if="log.type === 'AuctionBid'" v-bind="log" />
  <AuctionsLogsItemsAuctionEnded v-else-if="log.type === 'AuctionEnded'" v-bind="log" />
  <AuctionsLogsItemsAuctionPrebid v-else-if="log.type === 'AuctionPrebid'" v-bind="log" />
  <AuctionsLogsItemsAuctionStarted v-else-if="log.type === 'AuctionStarted'" v-bind="log" />
  <AuctionsLogsItemsCompetitorBid v-else-if="log.type === 'CompetitorBid'" v-bind="log" />
  <AuctionsLogsItemsEndingRank v-else-if="log.type === 'EndingRank' && showRank" v-bind="log" />
  <AuctionsLogsItemsIncomingTime v-else-if="log.type === 'IncomingTime'" v-bind="log" />
  <AuctionsLogsItemsClosingTime v-else-if="log.type === 'ClosingTime'" v-bind="log" />
  <AuctionsLogsItemsNewDutchRound v-else-if="log.type === 'NewDutchRound'" v-bind="log" />
  <AuctionsLogsItemsOvertimeTriggered v-else-if="log.type === 'OvertimeTriggered'" v-bind="log" />
  <AuctionsLogsItemsOwnCeilingPrice v-else-if="log.type === 'OwnCeilingPrice'" v-bind="log" />
  <AuctionsLogsItemsPrebidRequest v-else-if="log.type === 'PrebidRequest'" v-bind="log" />
  <AuctionsLogsItemsStartingPrice v-else-if="log.type === 'StartingPrice'" v-bind="log" />
  <AuctionsLogsItemsValidatedTerms v-else-if="log.type === 'ValidatedTerms'" v-bind="log" />
  <AuctionsLogsItemsLeavingSupplier v-else-if="log.type === 'LeavingSupplier'" v-bind="log" />
  <AuctionsLogsItemsAutoAccepted v-else-if="log.type === 'AutoAccepted'" v-bind="log" />
  <AuctionsLogsItemsPriceAccepted v-else-if="log.type === 'PriceAccepted'" v-bind="log" />
</template>
<script setup>
defineProps(['log'])

// Check if we should show rank (injected from BidsLogsCard)
const showRank = inject('showRankInLogs', ref(true))
</script>
