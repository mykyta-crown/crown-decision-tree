<template>
  <v-container id="solution-section" class="mt-0 pt-0 mt-md-16 pt-md-16">
    <v-row class="text-h2-alt text-center">
      <v-col cols="12"> eAuctions </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-center mt-sm-8 d-md-none">
          <v-img
            max-width="40"
            class="mr-8"
            src="/home/testimonials/arrow_left.svg"
            @click="prev"
          />
          <v-img max-width="40" src="/home/testimonials/arrow_right.svg" @click="next" />
        </div>
        <div class="d-none d-md-block">
          <v-tabs v-model="tab" class="text-grey" color="primary" grow>
            <v-tab
              v-for="(item, i) in items"
              :key="item.title"
              class="text-h5-alt"
              :text="item.title"
              :value="i"
            />
          </v-tabs>
          <v-divider color="grey" class="mb-6" />
        </div>

        <div>
          <v-row>
            <v-col cols="12" md="4" class="pt-16">
              <div v-for="(item, i) in items" :key="'pre' + item.title" class="pr-lg-16">
                <v-slide-x-transition hide-on-leave>
                  <div v-if="tab === i">
                    <div class="text-h4-alt font-weight-bold mb-4">
                      {{ item.title }}
                    </div>
                    <div>
                      {{ item.text }}
                    </div>
                  </div>
                </v-slide-x-transition>
              </div>
            </v-col>
            <v-col cols="12" md="8">
              <Carousel
                ref="isCarousel"
                v-model="currentSlide"
                class="mt-8 mb-16"
                :items-to-show="2"
                :transition="200"
                snap-align="start"
                :breakpoints="breakpoints"
              >
                <Slide v-for="item in items" :key="item.title">
                  <v-sheet
                    width="100%"
                    height="300"
                    :color="item.middleColor"
                    :class="`carousel__item rounded-lg`"
                    class="pa-12 d-flex align-center"
                  >
                    <v-img :max-height="item.maxHeight" :src="item.middleSrc" />
                  </v-sheet>
                </Slide>
                <Slide key="empty">
                  <v-sheet width="100%" height="300" class="pa-12 d-flex align-center" />
                </Slide>
              </Carousel>
              <div class="d-flex justify-center mt-8 d-md-none">
                <v-img
                  max-width="40"
                  class="mr-8"
                  src="/home/testimonials/arrow_left.svg"
                  @click="prev"
                />
                <v-img max-width="40" src="/home/testimonials/arrow_right.svg" @click="next" />
              </div>
            </v-col>
          </v-row>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
import 'vue3-carousel/dist/carousel.css'
import { Carousel, Slide } from 'vue3-carousel'
const breakpoints = ref({
  0: {
    itemsToShow: 1
  },
  960: {
    itemsToShow: 2
  }
})
const tab = ref(0)
const currentSlide = ref(0)

const items = ref([
  {
    title: 'Online',
    text: 'Online eAuctions leverage a time-efficient, location-neutral online platform for real-time competitive bidding.',
    middleSrc: '/home/is/dash.png',
    middleColor: 'purple',
    rightSrc: '/'
  },
  {
    title: 'Market-driven negotiation',
    text: 'Market-driven eAuctions leverage competitive dynamics among suppliers to ensure prices reflect current market value.',
    middleSrc: '/home/is/graph.png',
    middleColor: 'yellow-lighten-1',
    rightSrc: '/'
  },
  {
    title: 'Based on total-value',
    text: 'Total-value eAuctions consider all relevant factors beyond price, ensuring that quality, service levels, and other key parameters are included in the final bid evaluation.',
    middleSrc: '/home/is/leader.png',
    middleColor: 'green-light-2',
    rightSrc: '/'
  },
  {
    title: 'With commitment',
    text: 'Commitment in eAuctions guarantees that the winning bid is honored, fostering trust and ensuring that the negotiated terms are fully executed.',
    middleSrc: '/home/is/commit.png',
    middleColor: 'orange-light',
    maxHeight: 150,
    rightSrc: '/'
  }
])

const isCarousel = ref(null)

watch(tab, (newVal) => {
  isCarousel.value.slideTo(newVal)
})
watch(currentSlide, (newVal) => {
  tab.value = newVal
})

function prev() {
  if (tab.value - 1 < 0) tab.value = items.value.length - 1
  else tab.value--
}

function next() {
  if (tab.value + 1 > items.value.length - 1) tab.value = 0
  else tab.value++
}
</script>
<style scoped>
:deep(.v-btn__overlay) {
  display: none !important;
  opacity: 0 !important;
}

.carousel__slide {
  padding: 0px 20px;
}

.carousel__viewport {
  perspective: 2000px;
}

.carousel__track {
  transform-style: preserve-3d;
}

.carousel__slide--sliding {
  transition: 0.5s;
}

/* .carousel__slide {
  opacity: 0.9;
  transform: rotateY(-20deg) scale(0.85);
}

.carousel__slide--active ~ .carousel__slide {
  transform: rotateY(20deg) scale(0.85);
}

.carousel__slide--prev {
  opacity: 1;
  transform: rotateY(-10deg) scale(0.90);
} */

.carousel__slide--next {
  /* opacity: 1;
  transform: rotateY(10deg) scale(0.90); */
  filter: grayscale(100%);
}

/* .carousel__slide--active {
  opacity: 1;
  transform: rotateY(0) scale(1.15);
} */
</style>
