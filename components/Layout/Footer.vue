<template>
  <v-footer v-if="landingFooter" id="landing-footer" class="bg-primary-ligthen-1 py-6">
    <v-container>
      <v-row class="footer-row mx-1">
        <v-col cols="12" md="4" class="d-flex align-center">
          <div>
            <NuxtLink to="/home">
              <img src="@/assets/img/logo.png" height="23px" />
            </NuxtLink>
            <div class="text-caption">
              Copyright © 2024 CROWN PROCUREMENT.
              <br />
              All rights reserved.
            </div>
          </div>
        </v-col>
        <v-col cols="12" md="2">
          <div>
            <v-btn variant="text" @click="() => goTo && goTo('#solution-section')">
              Solutions
            </v-btn>
          </div>
          <div>
            <v-btn variant="text" @click="() => goTo && goTo('#benefits-section')">
              Benefits
            </v-btn>
          </div>
          <div>
            <v-btn variant="text" @click="() => goTo && goTo('#team-section')"> Team </v-btn>
          </div>
        </v-col>
        <v-col cols="12" class="mt-2" md="2">
          <div class="text-body-1">22 rue de Dunkerque 75010 PARIS</div>
          <br />
          <div style="font-size: 14px">+33 6 87 19 20 82</div>
        </v-col>
        <v-col cols="12" md="2">
          <div>
            <v-btn variant="text" to="/privacy_policies"> Privacy policy </v-btn>
          </div>
          <div>
            <v-btn variant="text" to="/tos"> Terms of Service </v-btn>
          </div>
        </v-col>
        <v-col cols="12" md="2" class="d-flex align-center">
          <v-btn
            block
            color="white"
            variant="flat"
            rounded="lg"
            target="_blank"
            href="https://calendly.com/mykyta-newmeeting/30min"
          >
            Book a demo
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
  <v-footer v-else-if="hideFooter" class="bg-primary-ligthen-1 footer-height py-6 py-md-0">
    <v-row class="footer-row mx-1">
      <v-col cols="12" md="4">
        <div>
          <NuxtLink to="/">
            <img src="@/assets/img/logo.png" height="23px" />
          </NuxtLink>
          <div class="text-caption">Copyright © 2024 CROWN PROCUREMENT. All rights reserved.</div>
        </div>
      </v-col>

      <v-col cols="12" md="3" class="d-flex justify-center align-center ga-3">
        <v-btn class="text-body-2" variant="text" to="/privacy_policies"> Privacy policy </v-btn>
        <v-btn class="text-body-2" variant="text" to="/tos"> Terms of Service </v-btn>
      </v-col>
      <v-col cols="12" md="5" class="text-body-1 d-flex justify-space-evenly align-center ga-10">
        <div>22 rue de Dunkerque 75010 PARIS</div>
        <div>+33 6 87 19 20 82</div>
      </v-col>
    </v-row>
  </v-footer>
</template>
<script setup>
import { useGoTo } from 'vuetify'
const route = useRoute()

const goTo = useGoTo()
const hideFooter = computed(() => {
  return route?.path ? !route.path.startsWith('/auth/') : false
})

const landingFooter = computed(() => {
  return route?.path === '/'
})
</script>
<style lang="scss" scoped>
#landing-footer {
  font-family: 'Inter';
  .v-btn {
    letter-spacing: normal !important;
  }
}

.footer-row .v-col {
  padding-bottom: 0px !important;
  padding-top: 0px !important;
}
</style>
<style scoped>
.footer-height {
  max-height: 90px;
  min-height: 90px;
}
@media screen and (max-width: 1064px) {
  .footer-height {
    height: 190px;
    max-height: 100%;
  }
}
</style>
