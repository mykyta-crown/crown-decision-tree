<template>
  <div>
    <v-container fluid class="bg-background">
      <v-sheet class="bg-background my-16 pt-16">
        <div class="title-size font-weight-regular text-center pb-8">
          <span class="font-weight-bold">Next-Level</span> eAuction Tool
        </div>
        <v-row class="justify-center">
          <v-col cols="12" md="8" lg="5">
            <v-card rounded="xl" class="bg-white border-xl white-border">
              <div class="rounded-xl">
                <v-img contain src="/home/next-level/Header.png" />
              </div>
              <div class="bg-grey-ligthen-1 pa-6">
                <v-row>
                  <v-col cols="3">
                    <v-img
                      contain
                      :class="focusedCard === 0 ? 'resize' : ''"
                      src="/home/next-level/Timer.png"
                      @mouseover="hoveredCard(0)"
                    />
                  </v-col>
                  <v-col cols="3">
                    <v-img
                      contain
                      :class="focusedCard === 1 ? 'resize' : ''"
                      src="/home/next-level/Key.png"
                      @mouseover="hoveredCard(1)"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-img
                      contain
                      :class="focusedCard === 2 ? 'resize' : ''"
                      src="/home/next-level/Activity.png"
                      @mouseover="hoveredCard(2)"
                    />
                  </v-col>
                </v-row>
              </div>
              <div class="bg-white pa-6">
                <v-row>
                  <v-col cols="5">
                    <v-img
                      contain
                      :class="focusedCard === 3 ? 'resize' : ''"
                      src="/home/next-level/Leaderboard.png"
                      @mouseover="hoveredCard(3)"
                    />
                  </v-col>
                  <v-col cols="7">
                    <v-img
                      contain
                      :class="focusedCard === 4 ? 'resize ' : ''"
                      src="/home/next-level/Chart.png"
                      @mouseover="hoveredCard(4)"
                    />
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12">
                    <v-img
                      contain
                      :class="focusedCard === 5 ? 'resize' : ''"
                      src="/home/next-level/Bids.png"
                      @mouseover="hoveredCard(5)"
                    />
                  </v-col>
                </v-row>
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card
              v-for="(item, index) in titleList"
              :key="item.title"
              rounded="xl"
              class="my-2 pa-2"
              :class="focusedCard === index ? 'bg-primary-ligthen-2' : ''"
              @mouseover="hoveredCard(index)"
            >
              <v-card-title class="d-flex">
                <v-row>
                  <v-col cols="8" class="d-flex align-center text-grey">
                    {{ item.title }}
                  </v-col>
                  <v-col cols="3" offset="1" class="my-2">
                    <v-btn
                      rounded="circle"
                      class="bg-background"
                      elevation="0"
                      :class="focusedCard === index ? 'rotate' : ''"
                      icon="mdi-arrow-bottom-right"
                    />
                  </v-col>
                </v-row>
              </v-card-title>
              <v-expand-transition>
                <v-card-text v-show="focusedCard === index" class="pa-0">
                  <v-row class="pa-4">
                    <v-col cols="12">
                      {{ item.text }}
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-expand-transition>
            </v-card>
          </v-col>
        </v-row>
      </v-sheet>
    </v-container>
  </div>
</template>
<script setup>
const titleList = ref([
  {
    title: 'Auction Timer',
    text: 'lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
  },
  {
    title: 'Key Indicators',
    text: 'lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
  },
  {
    title: 'Activity Log',
    text: 'lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
  },
  {
    title: 'Leaderboard',
    text: 'It offers a real-time ranking of users, highlighting those who are currently leading in the bidding competition. It also highlight the connection status of the participants.'
  },
  {
    title: 'Bids Chart',
    text: 'lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
  },
  {
    title: 'Bids Table',
    text: 'lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
  }
])

const focusedCard = ref(0)

const hoveredCard = (i) => {
  focusedCard.value = i
}
</script>
<style scoped>
.rotate {
  transform: rotate(-90deg);
}
.resize {
  transform: scale(1.1);
  transition: transform 0.2s;
}
.white-border.v-card--variant-outlined {
  border: 5px solid #fff !important;
}

.title-size {
  font-size: 3.5rem;
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
}
@media screen and (max-width: 600px) {
  .title-size {
    font-size: 1.5rem;
  }
  .card-text {
    font-size: 1.3em;
  }
}
</style>
