<template>
  <div class="bg-primary">
    <v-container class="py-15 d-flex flex-column align-center d-md-block">
      <v-row class="pt-15">
        <v-col class="text-h2-alt title-big-number text-center pb-13" cols="12">
          CROWN is your eAuctions <span class="font-weight-bold">Trusted</span> Third Party
        </v-col>
      </v-row>
      <div class="d-flex justify-space-around justify-md-space-between pb-15 flex-wrap">
        <div v-for="(item, i) in items" :key="`bg${i}`" class="w-50 w-md-auto pb-10">
          <div class="big-number font-weight-bold">
            {{ item.bigNumber }}
          </div>
          <div v-html="item.text" />
        </div>
      </div>
    </v-container>
  </div>
</template>
<script setup>
const items = ref([
  {
    bigNumber: '70%',
    text: 'reduction in <br> negotiation time'
  },
  {
    bigNumber: '6% ',
    text: 'incremental savings <br> on procurement spend'
  },
  {
    bigNumber: '200+',
    text: 'successful eAuctions <br> conducted'
  },
  {
    bigNumber: '24/7',
    text: 'live customer support '
  }
])
</script>
<style>
.big-number {
  font-size: 70px;
  @media screen and (max-width: 960px) {
    font-size: 60px;
  }
}

.title-big-number {
  @media (min-width: 960px) and (max-width: 1380px) {
    font-size: 35px !important;
  }
}
</style>
