<template>
  <v-sheet class="custom-border bg-background">
    <v-container class="ma-0 pa-0" fluid>
      <BuilderLotNameAndRulesForm v-model="model" :basics="props.basics" />

      <BuilderLotSuppliersForm v-model="model" :suppliers="props.suppliers" />
      <BuilderLotRoundTimingRulesForm
        v-if="props.basics.type === 'dutch' && props.basics.prefered"
        v-model="model"
        :suppliers="props.suppliers"
      />
      <BuilderLotCeilingPriceForm
        v-model="model"
        :suppliers="props.suppliers"
        :auction-type="props.basics.type"
        :currency="props.basics.currency"
      />
      <BuilderLotFixedHandicapForm
        v-if="model.got_fixed_handicap && basics.type === 'reverse'"
        v-model="model"
        :suppliers="props.suppliers"
        :auction-type="props.basics.type"
        :currency="props.basics.currency"
      />
      <BuilderLotDynamicHandicapForm
        v-if="model.got_dynamic_handicap && basics.type === 'reverse'"
        v-model:handicaps="model.handicaps"
        :suppliers="props.suppliers"
      />
      <BuilderLotAwardingTermsForm v-model="model" />
      <BuilderLotCommercialTermsForm v-model="model" />
      <BuilderLotGeneralTermsForm v-model="model" />
    </v-container>
  </v-sheet>
</template>
<script setup>
const props = defineProps(['basics', 'suppliers'])
const model = defineModel()
</script>

<style scoped>
.custom-border {
  border-radius: 0 24px 24px 24px;
}
</style>
