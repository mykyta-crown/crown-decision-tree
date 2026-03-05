<template>
  <v-container class="h-md-screen" style="min-height: 700px">
    <v-row
      class="fill-height align-content-start align-content-sm-center mt-14 mt-sm-0"
      justify="center"
    >
      <v-col cols="12">
        <div class="text-center catchphrase">
          <span> Reach <span class="font-weight-bold">True Market Value </span> </span>
          <br />
          through <span class="font-weight-bold">Fair</span> Negotiations
        </div>
      </v-col>
      <v-col cols="8" class="text-center pt-0">
        <div class="text-grey-darken-2 text-body-2 text-md-body-1 mb-8">
          Transform Procurement Through Technology
        </div>
        <v-btn
          size="x-large"
          variant="flat"
          color="primary"
          rounded="lg"
          class="px-9 hidden-sm-and-down"
          target="_blank"
          href="https://calendly.com/mykyta-newmeeting/30min"
        >
          Discover eAuctions
        </v-btn>
      </v-col>
      <v-col cols="12" sm="10">
        <div class="d-flex align-center justify-center pt-0 pt-xl-16">
          <div class="mb-6 w-full w-md-50">
            <v-tabs v-model="tab" class="text-grey" color="primary" grow>
              <v-tab
                v-for="item in items"
                :key="item.title"
                class="text-caption text-md-body-2"
                style="font-size: 16px"
                :text="item.title"
                :value="item.title"
              />
            </v-tabs>
            <v-divider color="grey" />
          </div>
        </div>
        <div style="height: 200px">
          <div v-for="item in items" :key="'hero-' + item.title" class="d-flex justify-center">
            <v-slide-x-transition hide-on-leave>
              <v-img v-show="tab === item.title" class="responsive-hero-img" :src="item.imageSrc" />
            </v-slide-x-transition>
          </div>
          <v-btn
            variant="flat"
            color="primary"
            block
            class="mt-10 py-6 hidden-md-and-up"
            target="_blank"
            href="https://calendly.com/mykyta-newmeeting/30min"
          >
            Discover eAuctions
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
const tab = ref('English')
const items = ref([
  {
    title: 'Dutch',
    imageSrc: '/home/hero/dutch.png'
  },
  {
    title: 'English',
    imageSrc: '/home/hero/english.png'
  },
  {
    title: 'Japanese',
    imageSrc: '/home/hero/japanese.png'
  }
])
</script>
<style scoped>
.text-width {
  max-width: 40%;
  font-size: 1.3rem;
}

.img-bg {
  display: inline;
  position: relative;
}
.img-position {
  max-width: 1200px;
}
.flair-position {
  position: absolute;
  z-index: 0;
  height: 150%;
  width: 500px;
}
.home-btn.v-btn--variant-outlined {
  border: 4px solid #ecf5f1 !important;
}

@media screen and (max-width: 1600px) {
  .catchphrase {
    font-size: 50px;
  }
  .text-width {
    max-width: 80%;
    text-align: center;
  }
}
@media screen and (max-width: 850px) {
  .catchphrase {
    font-size: 2rem;
  }
  .text-width {
    max-width: 100%;
    text-align: center;
    font-size: 0.8rem;
  }
}
@media screen and (max-width: 600px) {
  .catchphrase {
    font-size: 1.4rem;
  }
}

.responsive-hero-img {
  max-width: 800px;
  @media screen and (max-width: 600px) {
    max-width: 800px;
  }
}
</style>
