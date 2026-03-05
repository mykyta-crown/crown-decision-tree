<template>
  <div>
    <v-container fluid>
      <v-card class="mx-auto rounded-xl bg-grey-ligthen-1 blend-bg pa-md-16 pb-8">
        <v-row class="mb-8">
          <v-col cols="12" class="text-center">
            <div class="title-size font-weight-regular mt-16 mx-2 mt-md-0">
              CROWN is your eAuctions <span class="font-weight-bold">Trusted</span> Third Party
            </div>
          </v-col>
        </v-row>
        <v-row class="justify-center mx-1 mx-md-16">
          <v-col cols="12" md="6">
            <v-sheet
              rounded="xl"
              class="pa-10 my-4 min-height-card first-card-bg bg-white fill-height"
            >
              <div class="card-text text-center pb-4">Legacy eAuctions</div>

              <v-row
                v-for="item in legacy"
                :key="item.title"
                class="mt-6 d-flex justify-center align-center"
              >
                <v-col cols="3" md="2" class="d-flex align-center">
                  <v-icon color="grey-lighten-1" :size="mdAndUp ? 60 : 40">
                    {{ item.icon }}
                  </v-icon>
                </v-col>
                <v-col cols="9" md="10">
                  <div class="text-body-1 text-md-h5 font-weight-bold mb-md-4">
                    {{ item.title }}
                  </div>
                  <div class="text-caption text-md-body-2">
                    {{ item.text }}
                  </div>
                </v-col>
              </v-row>
            </v-sheet>
          </v-col>
          <v-col cols="12" md="6">
            <v-sheet
              rounded="xl"
              class="pa-10 my-4 min-height-card first-card-bg bg-white fill-height"
            >
              <div class="card-text text-center pb-4">Implementing Crown</div>

              <v-row
                v-for="(item, index) in crown"
                :key="item.title"
                class="mt-6 d-flex justify-center align-center"
              >
                <v-col cols="3" md="2" class="d-flex align-center pa-0">
                  <v-img :height="index === 0 ? 50 : 60" :src="item.icon" />
                </v-col>
                <v-col cols="9" md="10">
                  <div class="text-body-1 text-md-h5 font-weight-bold mb-4">
                    {{ item.title }}
                  </div>
                  <div class="text-caption text-md-body-2">
                    {{ item.text }}
                  </div>
                </v-col>
              </v-row>
            </v-sheet>
          </v-col>
        </v-row>
      </v-card>
    </v-container>
  </div>
</template>
<script setup>
import { useDisplay } from 'vuetify'
const { mdAndUp } = useDisplay()

const legacy = ref([
  { title: 'Unreliable', text: 'Fake suppliers & lack of ethical standards', icon: 'mdi-close' },
  { title: 'Non-binding', text: 'eAuctions outcomes were not contractual', icon: 'mdi-close' },
  {
    title: 'Outdated Tools',
    text: 'Existing tools are complicated & inefficient',
    icon: 'mdi-close'
  }
])
const crown = ref([
  {
    title: 'Verified participants',
    text: 'Strict verification process & ethical standards',
    icon: '/home/trusted/verifiedparticipants.svg'
  },
  {
    title: 'Mutually binding',
    text: 'Every eAuction has contractual value',
    icon: '/home/trusted/mutualbinding.svg'
  },
  {
    title: 'Intuitive platform',
    text: 'User-friendly & efficent',
    icon: '/home/trusted/intuitiveplatform.svg'
  }
])
</script>

<style scoped>
.blend-bg {
  background-image: url('/home/hero-bg.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: 0 1;
}

.title-size {
  font-size: 3rem;
}

.card-text {
  font-size: 2.5em;
  font-weight: 700;
}
@media screen and (max-width: 1350px) {
  .title-size {
    font-size: 2.5rem;
  }
  .card-text {
    font-size: 2em;
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
