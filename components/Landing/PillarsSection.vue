<template>
  <div>
    <v-container fluid class="my-16 pb-10 d-flex flex-column align-center">
      <div class="title-size font-weight-regular text-center">
        Values at our <span class="font-weight-bold">Pillars</span>
      </div>
      <v-col cols="10">
        <v-sheet
          v-for="pillar in pillars"
          :key="pillar.title"
          rounded="xl"
          class="my-10 bg-background"
        >
          <v-row class="ma-0">
            <v-col cols="12" md="7" class="pl-12 d-flex flex-column align-start justify-center">
              <div class="card-title mb-4 font-weight-bold">
                {{ pillar.title }}
              </div>
              <div class="text-body-2 text-md-body-1 font-weight-regular">
                {{ pillar.text }}
              </div>
            </v-col>
            <v-col offset-lg="2" cols="5" lg="3" class="d-none d-md-flex align-center pa-0">
              <v-img contain :src="pillar.img" />
            </v-col>
          </v-row>
        </v-sheet>
      </v-col>
    </v-container>
  </div>
</template>

<script setup>
const pillars = ref([
  {
    title: 'Simplicity',
    text: 'We believe in intuitive design and clear processes that empower every stakeholder without unnecessary complexity and confusion.',
    img: '/home/pillars/first_card.png'
  },
  {
    title: 'Integrity',
    text: 'We are committed to upholding the highest ethical standards, ensuring every auction conducted on is fair, transparent, competitive offers. ',
    img: '/home/pillars/second_card.png'
  },
  {
    title: 'Win-Win',
    text: 'Buyers get instant market feedback and buy at market’s most accurate price, while suppliers access a fair and transparent competition fostering a trustworthy environment.',
    img: '/home/pillars/third_card.png'
  }
])
</script>
<style scoped>
.title-size {
  font-size: 3.5rem;
}
.card-title {
  font-size: 2rem;
}
@media screen and (max-width: 1350px) {
  .title-size {
    font-size: 2.5rem;
  }
  .card-title {
    font-size: 1.8em;
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
  .card-title {
    font-size: 1.3em;
  }
}
</style>
