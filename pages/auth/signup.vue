<template>
  <v-container class="fill-height pa-0 ma-0" fluid>
    <v-row class="fill-height pa-0 ma-0 bg-purple">
      <v-col cols="12" lg="6" class="fill-height pa-0 ma-0">
        <v-sheet class="fill-height" rounded="xl">
          <v-row justify="center" align="center" class="fill-height pa-0 ma-0">
            <v-col cols="8" lg="6">
              <AuthSignupEmailForm />
            </v-col>
          </v-row>
        </v-sheet>
      </v-col>
      <v-col cols="6" class="fill-height hidden-md-and-down w-full">
        <AuthPreviewSheet />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
definePageMeta({
  layout: 'auth'
})
</script>
