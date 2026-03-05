<template>
  <div>
    <v-container class="mb-16 pb-10" fluid>
      <v-row class="d-flex pl-10 justify-start align-center mb-10">
        <v-col cols="auto" class="title-size font-weight-regular">
          <span class="font-weight-bold">Crafted</span> with
        </v-col>
        <v-col cols="12" md="5" class="text-start text-caption text-md-body-1 text-lg-h6 text-grey">
          Our advisors pinpointed crucial pain points and worked with us to meticulously develop a
          seamless end-to-end solution.
        </v-col>
      </v-row>
      <v-row class="px-10">
        <v-col
          v-for="item in cardsList"
          :key="item.img"
          cols="6"
          md="3"
          class="d-flex flex-column align-center ga-4"
        >
          <div class="w-100">
            <v-img contain :src="item.img" />
          </div>
          <div class="font-weight-bold text-h5">
            {{ item.name }}
          </div>
          <div class="text-grey text-left">
            {{ item.role }} <br /><span class="font-weight-bold">{{ item.company }}</span>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
<script setup>
const cardsList = [
  {
    img: '/home/crafted/Advisors_Mark.png',
    name: 'Mark Perera',
    role: 'Chairman & Founder',
    company: 'Procurement Leaders'
  },
  {
    img: '/home/crafted/Advisors_Christophe.png',
    name: 'Christophe Villain',
    role: 'Global Head SC & Procurement Technology',
    company: 'Nestlé'
  },
  {
    img: '/home/crafted/Advisors_Gordon.png',
    name: 'Gordon Crichton',
    role: 'Dean of University (1990 - Today)',
    company: 'KEDGE’s MAI'
  }
]
</script>
<style scoped>
.title-size {
  font-size: 4rem;
}
@media screen and (max-width: 600px) {
  .title-size {
    font-size: 2.5rem;
  }
}
@media screen and (max-width: 800px) {
  .title-size {
    font-size: 3rem;
  }
}
@media screen and (max-width: 1280px) {
  .title-size {
    font-size: 3rem;
  }
}
</style>
