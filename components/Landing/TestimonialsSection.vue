<template>
  <v-container>
    <v-row class="text-h2-alt text-center mt-12">
      <v-col cols="12" class="pb-0"> What they say about us </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <div style="margin-bottom: 120px">
          <Carousel
            ref="testimonialsCarousel"
            :breakpoints="breakpoints"
            class="mt-12"
            :items-to-show="3"
            :wrap-around="true"
            :transition="500"
          >
            <Slide v-for="slide in slides" :key="slide">
              <div class="carousel__item">
                <v-sheet class="testimonial-card px-10" style="padding-bottom: 70px">
                  <div class="py-6">
                    <v-img height="40" src="/home/quote.svg" />
                  </div>
                  <div>
                    {{ slide.text }}
                  </div>
                </v-sheet>
                <div style="margin-top: -35px">
                  <v-avatar size="70" :src="slide.avatarSrc">
                    <v-img :src="slide.avatarSrc" />
                  </v-avatar>
                  <div class="text-h5-alt font-weight-bold mt-3">
                    {{ slide.author }}
                  </div>
                  <div>
                    <span class="text-grey">{{ slide.position }}</span>
                    <span class="text-green-darken-1 font-weight-bold">{{ slide.company }}</span>
                  </div>
                </div>
              </div>
            </Slide>
          </Carousel>
          <div class="d-flex justify-center mt-8">
            <v-img
              max-width="40"
              class="mr-8"
              src="/home/testimonials/arrow_left.svg"
              @click="testimonialsCarousel.prev()"
            />
            <v-img
              max-width="40"
              src="/home/testimonials/arrow_right.svg"
              @click="testimonialsCarousel.next()"
            />
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
import 'vue3-carousel/dist/carousel.css'
import { Carousel, Slide } from 'vue3-carousel'
const testimonialsCarousel = ref(null)

const slides = ref([
  // {
  //   text: 'CROWN’s eAuctions are a game-changer, making procurement more effective and enjoyable, while ensuring transparency and fairness for all suppliers.',
  //   author: 'Denis de Vito',
  //   position: 'Managing Director',
  //   company: 'Inverto, A BCG Company',
  //   avatarSrc: '/home/testimonials/denis_di_vito.jpeg'
  // },
  {
    text: 'We made 16%+ savings in our first eAuction. Both buyers and suppliers love CROWN support!',
    author: 'Emma Praud',
    position: 'Head of Procurement ',
    company: 'Welding Alloys',
    avatarSrc: '/home/testimonials/emma_praud.png'
  },
  {
    text: 'eAuctions are the future of procurement negotiations',
    author: 'Christophe Villain',
    position: 'Global Head of SC & Procurement Technology',
    company: 'Nestlé',
    avatarSrc: '/home/testimonials/christophe_villain.png'
  },
  {
    text: "Crown's strategic support is exemplary, and their expertise improved the maturity or our procurement process.",
    author: 'Benoit Debitus',
    position: 'Head of Procurement ',
    company: 'Inovie Group',
    avatarSrc: '/home/testimonials/benoit_debitus.png'
  }
])

const breakpoints = ref({
  0: {
    itemsToShow: 1
  },
  // 700px and up
  700: {
    itemsToShow: 2,
    snapAlign: 'center'
  },
  // 1024 and up
  1024: {
    itemsToShow: 3,
    snapAlign: 'center'
  }
})
</script>

<style scoped>
.carousel__slide {
  padding: 0px 20px;
}

.carousel__viewport {
  perspective: 2000px;
  padding-bottom: 30px !important;
}

.carousel__track {
  transform-style: preserve-3d;
}

.carousel__slide--sliding {
  transition: 0.5s;
}

.carousel__slide {
  opacity: 0.9;
  transform: rotateY(-20deg) scale(0.8);
}

.carousel__slide--active ~ .carousel__slide {
  transform: rotateY(20deg) scale(0.8);
}

.carousel__slide--prev {
  opacity: 1;
  transform: rotateY(-10deg) scale(0.8);
}

.carousel__slide--next {
  opacity: 1;
  transform: rotateY(10deg) scale(0.8);
}

.carousel__slide--active {
  opacity: 1;
  transform: rotateY(0) scale(1);
}
.testimonial-card {
  box-shadow: 0px 4px 16.1px 0px rgba(189, 186, 186, 0.25);
}
</style>
