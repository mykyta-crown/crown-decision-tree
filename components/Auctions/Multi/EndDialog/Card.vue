<template>
  <div>
    <v-dialog v-model="dialog" scroll-strategy="none" persistent width="800">
      <v-card class="pb-10 text-center relative">
        <v-container style="max-width: 550px">
          <v-row align="center">
            <v-col cols="12" class="text-h4 font-weight-bold d-flex flex-column align-center">
              <span> The eAuction has ended! </span>
            </v-col>
          </v-row>
        </v-container>
        <v-card-actions class="d-flex justify-center">
          <v-btn-primary size="x-large" color="primary" class="px-10" @click="dialog = false">
            Back to eAuction
          </v-btn-primary>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
const dialog = ref(true)
</script>
<style scoped>
.medal {
  width: 100px;
  height: 100px;
  margin-bottom: -50px;
  z-index: 2;
  border-radius: 15px;
  font-size: 50px;
}
.absolute {
  position: absolute;
  top: 0px;
  height: 50%;
}
.relative {
  position: relative;
  z-index: 1;
}
</style>
