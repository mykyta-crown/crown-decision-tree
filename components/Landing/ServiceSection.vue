<template>
  <div>
    <v-container class="py-16 my-16" fluid>
      <div class="title-size font-weight-regular text-center pb-8">
        Our unique methodology: <span class="font-weight-bold">eAuctions as a service</span>
      </div>
      <v-row class="mx-md-10">
        <v-col cols="12" md="6">
          <v-card
            class="mx-md-auto rounded-xl bg-primary-ligthen-2 pa-2 pa-md-10 fill-height"
            border="none"
          >
            <v-card-title>
              <v-row>
                <v-col cols="12" sm="6">
                  <div class="card-title">Strategy</div>
                </v-col>
                <v-col cols="12" sm="5" class="mb-10 col-height">
                  <v-img src="/home/service/service_chart.svg" />
                </v-col>
              </v-row>
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="4" class="text-h6 font-weight-bold">
                  Strategy<br />
                  Definition
                </v-col>
                <v-col cols="12" md="8" class="text-body-1">
                  We support your procurement organization by providing a full method on Procurement
                  Strategy and use of eAuctions
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" md="4" class="text-h6 font-weight-bold">
                  <!-- <div class="text-h6"> -->
                  Change <br />management
                  <!-- </div> -->
                </v-col>
                <v-col cols="12" md="8" class="text-body-1">
                  We design a plan based on your organization’s need to drive eAuctions adoption
                  from 0% to 50% of your negotiations going through eAuctions
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
        <!-- Right -->
        <v-col cols="12" md="6">
          <v-card
            class="mx-md-auto rounded-xl bg-primary-ligthen-2 pa-2 pa-md-10 fill-height"
            border="none"
          >
            <v-card-title>
              <v-row class="mb-6">
                <v-col cols="12">
                  <div class="card-title">Negotiation support</div>
                </v-col>
              </v-row>
            </v-card-title>
            <v-card-text>
              <v-row v-for="item in supportText" :key="item.title">
                <v-col cols="12" md="2" class="d-none d-md-block">
                  <v-btn
                    rounded="circle"
                    color="white"
                    class="bg-white"
                    elevation="0"
                    icon="mdi-arrow-top-right"
                  />
                </v-col>
                <v-col cols="12" md="10">
                  <div class="text-h6 font-weight-bold">
                    {{ item.title }}
                  </div>
                  <div class="text-body-1">
                    {{ item.text }}
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
<script setup>
import { useDisplay } from 'vuetify'
const { mdAndUp } = useDisplay()
const supportText = ref([
  {
    title: 'eAuction Set up',
    text: 'We advise on parameters, such as eAuction types, timing, lots, and bidding rules'
  },
  {
    title: 'Supplier Training',
    text: 'We play with suppliers a test event that leads to successful participation'
  },
  {
    title: 'Live Support',
    text: 'We assist on real time to support you and your suppliers during every eAuction'
  }
])
</script>
<style scoped>
.title-size {
  font-size: 3.5rem;
}
.col-height {
  max-height: 170px;
}
.card-title {
  font-size: 2.5rem;
  font-weight: 700;
}

@media screen and (max-width: 1350px) {
  .title-size {
    font-size: 2.5rem;
  }
}
@media screen and (max-width: 800px) {
  .title-size {
    font-size: 2rem;
  }
  .card-title {
    font-size: 2rem;
  }
  /* .col-height{

  height: 10em;
} */
}
@media screen and (max-width: 600px) {
  .title-size {
    font-size: 1.5rem;
  }
  .card-title {
    font-size: 1.5rem;
  }
}
</style>
