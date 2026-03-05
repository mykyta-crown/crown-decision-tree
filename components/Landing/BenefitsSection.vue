<template>
  <v-container id="benefits-section" class="py-16 my-12">
    <v-row>
      <v-col cols="12" md="4">
        <div class="text-h2-alt mb-16">
          eAuctions <br /><span class="font-weight-bold">Benefits</span>
        </div>
        <v-tabs
          v-model="tab"
          hide-slider
          selected-class="follower-select"
          class="d-inline-block"
          style="border-radius: 64px !important"
          bg-color="grey-ligthen-3"
        >
          <v-tab style="border-radius: 64px !important" value="one"> Supplier view </v-tab>
          <v-tab style="border-radius: 64px !important" value="two"> Enterprise view </v-tab>
        </v-tabs>
      </v-col>
      <v-col cols="12" md="8">
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="one">
            <v-container class="pt-0">
              <v-row>
                <v-col v-for="benefit in suppliersBenefits" :key="benefit.title" cols="12" sm="6">
                  <v-hover>
                    <template #default="{ isHovering, props }">
                      <v-sheet
                        min-height="370"
                        v-bind="props"
                        :color="isHovering || mobile ? benefit.hoverColor : ''"
                        border
                        class="pa-10 fill-height"
                        rounded="lg"
                      >
                        <v-img class="mb-12" :src="benefit.image" height="80" width="80" />
                        <div class="text-h4-alt mb-4 font-weight-bold" v-html="benefit.title" />
                        <div>{{ benefit.text }}</div>
                      </v-sheet>
                    </template>
                  </v-hover>
                </v-col>
              </v-row>
            </v-container>
          </v-tabs-window-item>

          <v-tabs-window-item value="two">
            <v-container class="pt-0">
              <v-row>
                <v-col v-for="benefit in companiesBenefits" :key="benefit.title" cols="12" sm="6">
                  <v-hover>
                    <template #default="{ isHovering, props }">
                      <v-sheet
                        v-bind="props"
                        :color="isHovering || mobile ? benefit.hoverColor : ''"
                        border
                        class="pa-10 fill-height"
                        rounded="lg"
                      >
                        <v-img class="mb-12" :src="benefit.image" height="80" width="80" />
                        <div class="text-h4-alt mb-4 font-weight-bold" v-html="benefit.title" />
                        <div>{{ benefit.text }}</div>
                      </v-sheet>
                    </template>
                  </v-hover>
                </v-col>
              </v-row>
            </v-container>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
const { mobile } = useDisplay()

const tab = ref(0)
const companiesBenefits = ref([
  {
    title: 'Reach true <br> market value',
    text: 'Achieve optimal pricing and procurement saving for all categories of purchasing spend.',
    image: '/home/benefits/pig.svg',
    hoverColor: 'green-light'
  },
  {
    title: 'Enhance relationship <br> with your suppliers',
    text: 'Build stronger, trust-based supplier relationships through fair and transparent dealings.',
    image: '/home/benefits/relations.svg',
    hoverColor: 'orange-light'
  },
  {
    title: 'Reduce your <br> negotiation time ',
    text: 'Accelerate your procurement cycle by streamlining the negotiation process, and boost your operational margin.',
    image: '/home/benefits/time.svg',
    hoverColor: 'yellow-lighten-1'
  },
  {
    title: 'Increase <br> procurement maturity',
    text: 'Elevate procurement practices with strategic sourcing and flexible auction formats to meet diverse business needs.',
    image: '/home/benefits/profits.svg',
    hoverColor: '#EDEBFE'
  }
])

const suppliersBenefits = ref([
  {
    title: 'Regain control over the<br> negotiation process',
    text: 'Lead the negotiation with real-time bid management, empowering you to achieve successful outcomes.',
    image: '/home/benefits/relations.svg',
    hoverColor: 'green-light'
  },
  {
    title: 'Ensure transparency <br> and fairness',
    text: 'Engage in a transparent process where the best offer wins, ensuring an unbiased and trustworthy negotiation.',
    image: '/home/benefits/shield.svg',
    hoverColor: 'orange-light'
  },
  {
    title: 'Receive instant <br> market feedback',
    text: 'Gain immediate insights into market dynamics and competitors pricing.',
    image: '/home/benefits/focus.svg',
    hoverColor: 'yellow-lighten-1'
  },
  {
    title: 'Reduce your <br> negotiation time',
    text: 'Streamline your sales process and boost your operational margin.',
    image: '/home/benefits/time.svg',
    hoverColor: '#EDEBFE'
  }
])
</script>
<style scoped>
:deep(.v-btn__overlay) {
  display: none !important;
}

.follower-select {
  background: rgb(var(--v-theme-grey-darken-3));
  border-radius: 64px !important;
  font-weight: 700;
  color: white;
}
</style>
