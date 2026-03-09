<template>
  <v-navigation-drawer
    v-if="profile"
    v-model="drawer"
    class="bg-primary"
    :class="{ 'drawer-nav-open': !rail, 'px-1': !rail }"
    permanent
    :rail="rail"
    rail-width="54"
    width="200"
  >
    <v-list density="compact" nav class="pb-3">
      <v-list-item key="first-item" class="text-center position-relative logo-custom-margin">
        <template v-if="rail" #prepend>
          <img src="@/assets/img/logo_crown_only.png" height="16px" width="16px" href="/" />
        </template>
        <a href="/">
          <img v-if="!rail" src="@/assets/img/logo.png" height="23px" href="/" />
        </a>
        <v-btn
          v-if="!rail"
          rounded="circle"
          icon="mdi-arrow-collapse-right"
          class="rotate-180 position-absolute rail-btn-position"
          size="small"
          color="primary-ligthen-1"
          border="none"
          @click.prevent="rail = !rail"
        />
      </v-list-item>
      <v-list-item v-if="rail" class="rail-collapse-btn">
        <v-btn icon variant="text" size="small" class="rail-toggle-btn" @click.stop="rail = !rail">
          <v-icon size="20" color="grey">mdi-arrow-collapse-right</v-icon>
        </v-btn>
      </v-list-item>
      <v-list-item v-if="!rail && isAdmin" class="px-0">
        <DashboardCompaniesDropdownMenu :companies="buyersCompanies" />
      </v-list-item>
    </v-list>

    <v-list nav>
      <v-list-item
        id="dashboard-nav-item"
        active-class="active-icon"
        :title="rail ? '' : t('navigationdrawer.dashboard')"
        :to="`/dashboard${selectedCompany}`"
      >
        <template #prepend>
          <v-img src="@/assets/icons/Sidebar/layout-grid.svg" width="16" height="16" />
        </template>
      </v-list-item>
      <v-list-item
        id="eauctions-nav-item"
        :title="rail ? '' : t('navigationdrawer.eauctions')"
        :to="`/home${selectedCompany}`"
        active-class="active-icon"
      >
        <template #prepend>
          <v-img src="@/assets/icons/Sidebar/eAuctions.svg" width="16" height="16" />
        </template>
      </v-list-item>
      <v-list-item
        v-if="isAdmin"
        id="users-nav-item"
        active-class="active-icon"
        :title="rail ? '' : t('navigationdrawer.users')"
        :to="`/users${selectedCompany}`"
      >
        <template #prepend>
          <v-img src="@/assets/icons/Sidebar/users.svg" width="16" height="16" />
        </template>
      </v-list-item>

      <v-list-item
        v-if="isAdmin || isBuyer"
        id="decision-tree-nav-item"
        :title="rail ? '' : t('navigationdrawer.decisionTree')"
        active-class="active-icon"
        to="/decisionTree"
      >
        <template #prepend>
          <v-img src="@/assets/icons/Sidebar/architect.svg" width="16" height="16" />
        </template>
      </v-list-item>
      <v-list-item
        v-if="isAdmin || isBuyer"
        id="ai-analysis-nav-item"
        title="Crown GPT"
        active-class="active-icon"
        to="/gpts/chat"
      >
        <template #prepend>
          <img
            src="~/assets/images/gpt-logo.svg"
            alt="Crown GPT"
            style="width: 16px; height: 16px"
          />
        </template>
      </v-list-item>
      <v-divider v-if="isAdmin" style="color: #363633 !important" class="my-2" />
      <v-list-item
        v-if="displayOnboarding"
        id="onboarding-nav-item"
        active-class="active-icon"
        :title="rail ? '' : t('navigationdrawer.onboarding')"
        to="/onboarding"
      >
        <template #prepend>
          <v-img src="@/assets/icons/Sidebar/Onboarding.svg" width="16" height="16" />
        </template>
        <template v-if="!rail" #append>
          <span
            class="text-body-2 bg-primary-ligthen-1 pa-1 rounded-lg"
            :style="{ color: '#A4CAFE!important' }"
          >
            {{ profile.onboarding_step > 4 ? 4 : profile.onboarding_step || 0 }}/4
          </span>
        </template>
      </v-list-item>

      <v-list-item
        v-if="isAdmin"
        id="clients-nav-item"
        active-class="active-icon"
        :title="rail ? '' : t('navigationdrawer.clients')"
        to="/clients"
      >
        <template #prepend>
          <v-img src="@/assets/icons/Sidebar/Clients.svg" width="16" height="16" />
        </template>
      </v-list-item>
      <v-list-item
        id="trainings-nav-item"
        active-class="active-icon"
        :title="rail ? '' : t('navigationdrawer.trainings')"
        to="/trainings"
      >
        <template #prepend>
          <v-img src="@/assets/icons/Sidebar/Demo.svg" width="16" height="16" />
        </template>
        <template v-if="!rail" #append>
          <span
            class="text-body-2 bg-primary-ligthen-1 pa-1 rounded-lg"
            :style="{ color: '#A6F0D3!important' }"
          >
            {{ validatedTrainingsCount }}/{{ trainingsCount }}
          </span>
        </template>
      </v-list-item>
    </v-list>
    <template #append>
      <v-list class="pb-8 ml-0">
        <v-list-item>
          <div class="text-white text-truncate d-flex align-center justify-space-between">
            <span v-show="!rail"> {{ profile?.first_name }} {{ profile?.last_name }} </span>
          </div>

          <template #append>
            <v-menu v-model="showProfileMenu">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  variant="text"
                  rounded="circle"
                  height="20px"
                  width="20px"
                  color="grey"
                  :class="!rail ? '' : ''"
                  icon
                >
                  <v-img src="@/assets/icons/basic/Kebab_Vertical.svg" width="16" height="16" />
                </v-btn>
              </template>
              <v-list class="user-menu bg-primary-ligthen-1 py-0">
                <v-list-item
                  :title="t('navigationdrawer.editProfile')"
                  class="pr-6"
                  min-height="32px"
                  @click="showEditDialog = true"
                >
                  <template #prepend>
                    <v-img src="@/assets/icons/Sidebar/Edit Profile.svg" width="16" height="16" />
                  </template>
                </v-list-item>
                <!-- Language switcher items -->
                <v-list-item
                  :title="
                    locale === 'en'
                      ? t('navigationdrawer.switchToFrench')
                      : t('navigationdrawer.switchToEnglish')
                  "
                  class="pr-6"
                  @click="switchLanguage"
                >
                  <template #prepend>
                    <v-icon size="16"> mdi-translate </v-icon>
                  </template>
                </v-list-item>
                <v-list-item :title="t('navigationdrawer.termsOfUse')" class="pr-6" :to="'/tos'">
                  <template #prepend>
                    <v-img src="@/assets/icons/Sidebar/terms.svg" width="16" height="16" />
                  </template>
                </v-list-item>
                <v-list-item
                  :title="t('navigationdrawer.privacyPolicy')"
                  class="pr-6"
                  :to="'/privacy_policies'"
                >
                  <template #prepend>
                    <v-img
                      src="@/assets/icons/Sidebar/information-square.svg"
                      width="16"
                      height="16"
                    />
                  </template>
                </v-list-item>
                <v-list-item
                  :title="t('navigationdrawer.logout')"
                  class="pr-6"
                  to="/auth/signin"
                  @click="logout"
                >
                  <template #prepend>
                    <v-img src="@/assets/icons/Sidebar/Log Out.svg" width="16" height="16" />
                  </template>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>

          <div v-if="!rail" class="text-truncate text-body-2">
            {{ profile?.email }}
          </div>
        </v-list-item>
      </v-list>
    </template>
  </v-navigation-drawer>
  <UserManagementProfileEditDialog
    v-if="profile"
    v-model="showEditDialog"
    :profile-id="profile.id"
    @saved-profile="getSession(true)"
  />
</template>

<script setup>
import { uniqBy } from 'lodash'
import dayjs from 'dayjs'
const showProfileMenu = defineModel()

const route = useRoute()

watch(showProfileMenu, () => {
  if (showProfileMenu.value) {
    let intercomStyle = ''

    function testCloseIntercom() {
      const newFrame = document.querySelector('.intercom-tour-frame')
      const isSameFrame = newFrame.getAttribute('style').trim() === intercomStyle.trim()
      console.log(intercomStyle, newFrame.getAttribute('style').trim(), isSameFrame)

      setTimeout(() => {
        if (!isSameFrame) {
          showProfileMenu.value = false
        } else {
          testCloseIntercom()
        }
      }, 500)
    }

    setTimeout(() => {
      const intercomFrame = document.querySelector('.intercom-tour-frame')
      intercomStyle = intercomFrame.getAttribute('style')
      if (intercomFrame) {
        testCloseIntercom()
      }
    }, 1000)
  }
})

const showEditDialog = ref(false)

const drawer = ref(true)
const rail = ref(false)
const { profile, isAdmin, isBuyer, getSession } = useUser()
const router = useRouter()
const supabase = useSupabaseClient()

const displayOnboarding = computed(() => {
  return profile.value?.onboarding_step < 4
  // return profile.value?.onboarding_date ? dayjs(profile.value?.onboarding_date).add(7, 'days').isAfter(dayjs()) : true
})

// Use translations
const { t, locale, switchLocale } = useTranslations()

const switchLanguage = () => {
  const newLocale = locale.value === 'en' ? 'fr' : 'en'
  switchLocale(newLocale)
  // No need to navigate - translations will refresh automatically
}

const { data: allBuyers } = await supabase
  .from('profiles')
  .select('*, companies(*)')
  .in('role', ['super_buyer', 'buyer'])
const buyersCompanies = ref(
  uniqBy(
    allBuyers?.map((b) => b.companies),
    'id'
  )
)

async function logout() {
  await supabase.auth.signOut()
  // router.push('/auth/signin')
  window.location.href = '/auth/signin'
}
const trainingsCount = ref(0)
const validatedTrainingsCount = ref(0)

// We need to retrieve all trainings auction and count if each of them are validated
const isGroupValidated = (group) => {
  const type = group.auctions[0].type
  const trainings = group.trainings || []
  if (trainings.length === 0) return false

  if (type === 'reverse' || type === 'sealed-bid') {
    return trainings.every((t) => t.trainings_losing && t.trainings_live_win)
  }

  return trainings.every(
    (t) => t.trainings_losing && t.trainings_live_win && t.trainings_prebid_win
  )
}

const retrieveTrainingsCount = async () => {
  const createBaseQuery = (supabase) => {
    return supabase
      .from('auctions_group_settings')
      .select(
        `
      trainings(trainings_prebid_win, trainings_live_win, trainings_losing),
      auctions!inner(
        type,
        users_auctions_status(is_favorite, is_archived)
      )
    `
      )
      .eq('auctions.usage', 'training')
      .eq('auctions.deleted', false)
  }

  const { data, error } = await createBaseQuery(supabase)
  if (error) {
    console.error('TRAININGS QUERY ERROR', error)
    trainingsCount.value = 0
    validatedTrainingsCount.value = 0
    return
  }

  const filteredTrainings = (data || []).filter(
    (group) => !group.auctions[0].users_auctions_status?.[0]?.is_archived
  )

  const { total, validated } = filteredTrainings.reduce(
    (acc, group) => {
      acc.total += 1
      if (isGroupValidated(group)) acc.validated += 1
      return acc
    },
    { total: 0, validated: 0 }
  )

  trainingsCount.value = total
  validatedTrainingsCount.value = validated
}

onMounted(async () => {
  await retrieveTrainingsCount()
})

const selectedCompany = computed(() => {
  if (route.query.company) {
    return `?company=${route.query.company}`
  }
  return ''
})
</script>
<style scoped>
:deep(.v-list-item__prepend) {
  width: 20px !important;
  margin-right: 5px !important;
  display: flex;
  flex-direction: column;
  align-items: center;
}

:deep(.v-list-item) {
  min-height: 29px !important;
  max-height: 29px !important;
  margin-bottom: 5px !important;
  color: rgb(var(--v-theme-grey)) !important;
  border-radius: 4px !important;
}

.user-menu:deep(.v-list-item) {
  color: rgb(var(--v-theme-grey-ligthen-4)) !important;
  min-height: 37px !important;
  margin-bottom: 0px !important;
}

.user-menu:deep(.v-list-item:hover) {
  background-color: rgb(var(--v-theme-grey-darken-3)) !important;
  color: white !important;
}

.user-menu:deep(.v-list-item:hover .v-list-item__prepend) {
  filter: brightness(100);
}

:deep(.v-list-item--active) {
  background-color: rgb(var(--v-theme-primary-ligthen-1)) !important;
  color: white !important;
}

.styled-btn:deep(.v-btn__overlay) {
  opacity: 0;
  padding: 0 !important;
}

.max-width-drawer {
  max-width: 200px;
}

.rotate-180 {
  transform: rotate(180deg);
}

.rail-btn-position {
  top: 0px;
  right: -10px;
}
.active-icon:deep(.v-list-item__prepend) {
  filter: brightness(100);
}
:deep(.v-list-item__overlay) {
  opacity: 0 !important;
}
.drawer-nav-open:deep(.v-navigation-drawer__append .v-list-item) {
  padding-left: 12px !important;
  padding-right: 10px !important;
}
.drawer-nav-open:deep(.v-navigation-drawer__append .v-list-item__append) {
  align-self: start;
}

:deep(.v-list-item--nav .v-list-item-title) {
  font-size: 14px !important;
  font-weight: 400 !important;
  line-height: 21px !important;
}

.logo-custom-margin {
  margin-bottom: 40px !important;
}

.rail-collapse-btn {
  min-height: 58px !important;
  max-height: 58px !important;
  margin-bottom: 0 !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

.rail-toggle-btn {
  margin: 0 auto;
}
</style>
