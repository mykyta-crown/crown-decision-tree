<template>
  <div id="team-section" class="mt-16 pb-16">
    <v-container class="pt-16 pb-10">
      <div class="text-h2-alt text-center pb-8 mb-4">
        Our<span class="font-weight-bold"> Team</span>
      </div>
      <v-row>
        <v-col v-for="(item, index) in team" :key="item.img" cols="6" md="3" class="mb-8">
          <NuxtLink class="text-decoration-none" target="_blank" :to="item.linkedInUrl">
            <v-sheet
              class="d-flex flex-column align-center ga-4"
              @mouseover="(e) => (hoveredCard = index)"
            >
              <div class="w-100 rounded-xl" :class="hoveredCard === index ? '' : 'greyscale'">
                <v-img contain :src="item.img" class="rounded-lg" color="grey-ligthen-2" />
              </div>
              <div class="text-center">
                <div class="font-weight-bold">
                  {{ item.name }}
                </div>
                <div class="text-grey-darken-1">
                  {{ item.role }}
                </div>
              </div>
            </v-sheet>
          </NuxtLink>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
<script setup>
const team = ref([
  {
    img: '/home/team/mykyta.png',
    name: 'Mykyta Voytenko',
    role: 'CEO',
    linkedInUrl: 'https://www.linkedin.com/in/mykyta-voytenko-3a47564b/'
  },
  {
    img: '/home/team/olena.png',
    name: 'Olena Pylypivv',
    role: 'CPO',
    linkedInUrl: 'https://www.linkedin.com/in/olena-pylypiv-a126bb19a/'
  },
  {
    img: '/home/team/flore.png',
    name: 'Flore de Paillerets',
    role: 'Founder Associate',
    linkedInUrl: 'https://www.linkedin.com/in/floredepaillerets/'
  },
  {
    img: '/home/team/jean.png',
    name: 'Jean Latour',
    role: 'Client Director',
    linkedInUrl: 'https://www.linkedin.com/in/jean-latour-a4a16362/'
  },
  {
    img: '/home/team/julien.png',
    name: 'Julien Leray',
    role: 'Co-CTO',
    linkedInUrl: 'https://www.linkedin.com/in/julienleray/'
  },
  {
    img: '/home/team/fabien.png',
    name: 'Fabien Ungerer',
    role: 'Co-CTO',
    linkedInUrl: 'https://www.linkedin.com/in/fabien-ungerer/'
  },
  {
    img: '/home/team/daniel.png',
    name: 'Daniel Israeli',
    role: 'Director of operations APAC',
    linkedInUrl: 'https://www.linkedin.com/in/daniel-israeli/'
  },
  {
    img: '/home/team/ana.png',
    name: 'Anastasiia Kliuchnikava',
    role: 'UI/UX Designer',
    linkedInUrl:
      'https://www.linkedin.com/in/%D0%B0%D0%BD%D0%B0%D1%81%D1%82%D0%B0%D1%81%D1%96%D1%8F-%D0%BA%D0%BB%D1%8E%D1%87%D0%BD%D1%96%D0%BA%D0%BE%D0%B2%D0%B0-48581823b/'
  }
])
const hoveredCard = ref(null)
</script>
<style scoped>
.greyscale {
  filter: grayscale(100%);
}
</style>
