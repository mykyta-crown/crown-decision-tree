<template>
  <div id="landing">
    <v-app-bar id="top-bar" class="px-10" flat>
      <NuxtLink :to="user ? '/home' : '/'">
        <img class="ml-0 ml-md-6" src="@/assets/img/logo_black.png" height="23px" />
      </NuxtLink>
      <v-spacer />

      <div class="d-none d-md-block global-center">
        <v-btn variant="text" color="primary" @click="() => goTo && goTo('#solution-section')">
          Solutions
        </v-btn>
        <v-btn
          class="ml-8"
          variant="text"
          color="primary"
          @click="() => goTo && goTo('#benefits-section')"
        >
          Benefits
        </v-btn>
        <v-btn
          class="ml-8"
          variant="text"
          color="primary"
          @click="() => goTo && goTo('#team-section')"
        >
          Team
        </v-btn>
      </div>

      <v-spacer />
      <template v-if="!user">
        <v-btn to="/auth/signin" variant="text" class="font-weight-bold d-flex" color="primary">
          Sign In
        </v-btn>
        <v-btn
          variant="flat"
          class="font-weight-bold ml-2"
          color="primary"
          rounded="lg"
          target="_blank"
          href="https://calendly.com/mykyta-newmeeting/30min"
        >
          Book a demo
        </v-btn>
      </template>
      <v-btn
        v-else
        variant="flat"
        class="font-weight-bold ml-2"
        color="primary"
        rounded="lg"
        to="/home"
      >
        Dashboard
      </v-btn>
    </v-app-bar>

    <div class="bg-white">
      <LandingHeroSection />
      <LandingIsSection />
      <LandingTestimonialsSection />
      <LandingSocialProofsSection />
      <LandingBenefitsSection />
      <LandingCtaSection />
      <LandingTeamSection />
    </div>
  </div>
</template>
<script setup>
import { useGoTo } from 'vuetify'
const { user } = useUser()
// No need for localePath anymore

definePageMeta({
  layout: 'landing'
})

const goTo = useGoTo()
</script>

<style>
#landing {
  font-family: 'Inter';
  .v-toolbar {
    border-bottom: solid #c5c7c9 1px;
  }
}

.rounded-topbar {
  border-radius: 0px 100px 100px 0px;
}

.catchphrase {
  font-size: 70px;
}

.text-h1-alt {
  font-size: 56px;
}

.text-h2-alt {
  font-size: 50px;
  font-weight: 300;
  @media screen and (max-width: 960px) {
    font-size: 30px;
  }
}

.text-h3-alt {
  font-size: 32px;
}

.text-h4-alt {
  font-size: 24px;
  letter-spacing: normal;
}

.text-h5-alt {
  font-size: 18px;
  letter-spacing: normal;
}

.global-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  -webkit-transform: translate(-50%, -50%);
  -moz-transform: translate(-50%, -50%);
  -ms-transform: translate(-50%, -50%);
  -o-transform: translate(-50%, -50%);
}
</style>
