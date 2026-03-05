<template>
  <div>
    <v-container class="max-height py-8 my-16 d-flex flex-column align-center ga-12" fluid>
      <v-row>
        <v-col cols="12" class="text-center align-bottom">
          <div class="title-size font-weight-regular">
            An
            <span class="font-weight-bold" :class="focusedCard === 0 ? 'text-black' : 'text-grey'"
              >Online</span
            >,
            <span class="font-weight-bold" :class="focusedCard === 1 ? 'text-black' : 'text-grey'"
              >Market-Driven</span
            >
            negotiation based on
            <span class="font-weight-bold" :class="focusedCard === 2 ? 'text-black' : 'text-grey'"
              >Total-Value</span
            >
            with
            <span class="font-weight-bold" :class="focusedCard === 3 ? 'text-black' : 'text-grey'"
              >Commitment.</span
            >
          </div>
          <v-col />
        </v-col>
      </v-row>
      <v-row class="mx-8">
        <v-col v-for="(card, i) in cards" :key="`upgrade-card-${i}`" cols="12" sm="6" md="3">
          <v-card
            rounded="xl"
            :elevation="focusedCard === i ? 8 : 3"
            class="pa-4 min-height-card fill-height mx-auto"
            :class="focusedCard === i ? 'bg-primary-ligthen-2' : ''"
            @mouseover="hoveredCard(i)"
          >
            <v-card-title>
              <div
                class="font-weight-bold text-h5 text-start"
                :class="focusedCard === i ? 'text-black' : 'text-grey'"
              >
                {{ card.title }}
              </div>
            </v-card-title>
            <v-card-text>
              <div class="text-grey-darken-2 text-body-2 text-md-body-1">
                {{ card.text }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
  <div class="bg-background">
    <v-container class="max-height my-16" fluid>
      <v-row class="mt-8">
        <v-col cols="12" class="text-center mb-6">
          <div class="title-size font-weight-regular">
            <span class="font-weight-bold">Upgrade</span> your negotiations with eAuctions
          </div>
        </v-col>
        <v-col cols="12">
          <v-row class="ma-0 justify-center">
            <v-col v-for="(nego, i) in negos" :key="`nego-card-${i}`" cols="12" md="6" lg="5">
              <v-sheet elevation="6" class="pa-10" rounded="xl">
                <v-row>
                  <v-col cols="12" md="5">
                    <div class="text-h6 text-md-h4">
                      {{ nego.title }}
                    </div>
                  </v-col>
                  <v-col cols="12" md="7" class="d-flex align-center justify-center">
                    <v-img
                      contain
                      class="min-height-img pa-16"
                      :src="nego.image"
                      :style="nego.style"
                      :min-width="nego.width"
                      :max-width="nego.width"
                    />
                  </v-col>
                </v-row>
              </v-sheet>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
const cards = ref([
  {
    title: 'Online',
    text: 'Enables participants from various geographical areas to engage simultaneously, increasing participation.',
    color: ''
  },
  {
    title: 'Market-driven',
    text: 'Market conditions directly influence pricing and outcomes, ensuring prices reflect current market value perceived by participants.',
    color: ''
  },
  {
    title: 'Total-value',
    text: 'Decisions are based on overall best value, quality, service levels, and sustainability, not just the lowest cost.',
    color: ''
  },
  {
    title: 'Commitment',
    text: 'Ensures buyers and suppliers engage seriously and with integrity, making offers binding and leading directly to transactions.',
    color: ''
  }
])

const negos = ref([
  {
    title: 'Traditionnal Negotiations',
    image: '/home/upgrade/traditionnal_nego.svg',
    width: '300px'
  },
  {
    title: 'eAuctions',
    image: '/home/upgrade/eauctions_nego.svg',
    width: '400px',
    style: 'margin-left: -120px;z-index: 100;'
  }
])

const focusedCard = ref(0)

const hoveredCard = (i) => {
  focusedCard.value = i
}
</script>
<style scoped>
.align-bottom {
  display: flex;
  align-items: flex-end;
}
.min-height-card {
  display: flex;
  flex-direction: column;
  min-height: min-content;
  max-height: 15em;
  gap: 1em;
}
@media screen and (max-width: 600px) {
  .min-height-card {
    max-height: 350px;
  }
}

@media screen and (max-width: 1600px) {
  .min-height-card {
    max-height: 17em;
  }
}
@media screen and (max-width: 1200px) {
  .min-height-card {
    max-height: 20em;
  }
}
@media screen and (max-width: 960px) {
  .min-height-card {
    max-height: 16em;
  }
}

.min-height-img {
  height: 250px;
}

.max-height {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

@media screen and (max-width: 1200px) {
  .max-height {
    height: 100%;
  }
}

.title-size {
  font-size: 2rem;
}
@media screen and (max-width: 600px) {
  .title-size {
    font-size: 1.5rem;
  }
}
</style>
