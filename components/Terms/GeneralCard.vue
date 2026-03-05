<template>
  <div>
    <v-sheet class="bg-white rounded-lg panel-border">
      <v-container>
        <v-row>
          <v-col class="mt-8 text-h6"> Awarding principles </v-col>
        </v-row>
      </v-container>
      <v-container class="pa-16">
        <v-row>
          <div v-html="props.auction.general_terms" />
        </v-row>
      </v-container>
    </v-sheet>
  </div>
</template>
<script setup>
const props = defineProps(['auction'])
console.log(props.auction)
</script>
