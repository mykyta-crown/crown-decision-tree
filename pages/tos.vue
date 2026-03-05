<template>
  <v-container id="cgu">
    <v-row>
      <v-col class="pt-0 text-grey-darken-1">
        <ContentDoc />
      </v-col>
    </v-row>
    <v-fab
      app
      appear
      extended
      color="primary"
      position="sticky"
      text="< Go back"
      location="top left"
      @click="router.back()"
    />
  </v-container>
</template>

<script setup>
const router = useRouter()
</script>
<style>
p {
  margin-bottom: 12px;
}

h2 {
  margin-bottom: 4px;
  margin-top: 24px;
}

h2 a {
  text-decoration: none;
  color: inherit;
}

ul {
  margin-bottom: 12px;
}

ul,
ol {
  margin-left: 0.75em;
  text-align: left;
}
</style>
