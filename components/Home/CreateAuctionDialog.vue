<template>
  <v-dialog v-model="dialog" width="675px">
    <v-card class="pb-4">
      <v-card-item class="mb-2">
        <v-card-title
          class="text-capitalize text-grey-ligthen-1 d-flex justify-space-between align-center"
        >
          <span>{{ t('createDialog.title') }}</span>
          <v-icon size="small" icon="mdi-close" @click="dialog = false" />
        </v-card-title>
        <v-divider class="mt-1" color="grey-ligthen-2" />
      </v-card-item>
      <v-tabs v-model="createType" align-tabs="center">
        <v-tab value="test">
          {{ t('createDialog.tabs.test') }}
        </v-tab>

        <v-tab value="masterclass">
          {{ t('createDialog.tabs.masterclass') }}
        </v-tab>
      </v-tabs>

      <v-tabs-window v-model="createType">
        <v-tabs-window-item value="test">
          <v-card-text class="pt-4 px-16 overflow-y-auto">
            <div>
              {{ t('createDialog.sections.auctionType') }}
            </div>

            <div>
              <v-radio-group v-model="auctionType">
                <v-radio :label="t('auction.type.english')" value="reverse" />
                <v-radio :label="t('auction.type.dutch')" value="dutch" />
                <v-radio :label="t('auction.type.japanese')" value="japanese" />
              </v-radio-group>
            </div>
            <v-divider class="mb-6" color="grey-ligthen-2" />
            <div class="mb-4">
              <v-select
                v-model="maxRankDisplayed"
                :items="maxRankOptions"
                label="Max Rank Displayed"
                variant="outlined"
                density="compact"
                hide-details
              />
            </div>
            <v-divider class="mb-6" color="grey-ligthen-2" />
            <v-row>
              <v-col cols="6">
                <span>
                  {{ t('createDialog.sections.multiLot') }}
                </span>
                <v-switch
                  v-model="isMultilot"
                  :label="
                    isMultilot
                      ? t('createDialog.switchLabels.enabled')
                      : t('createDialog.switchLabels.disabled')
                  "
                />
              </v-col>
              <v-col cols="6">
                <span>
                  {{ t('createDialog.sections.prebid') }}
                </span>
                <v-switch
                  v-model="isPrebid"
                  :label="
                    isPrebid
                      ? t('createDialog.switchLabels.enabled')
                      : t('createDialog.switchLabels.disabled')
                  "
                  :disabled="auctionType === 'reverse'"
                />
              </v-col>
            </v-row>
            <v-expand-transition>
              <v-row v-if="isMultilot">
                <v-col cols="12">
                  <v-divider class="mb-6" color="grey-ligthen-2" />
                  <div class="mb-4">
                    {{ t('createDialog.sections.multilotTiming') }}
                  </div>
                  <div>
                    <v-radio-group v-model="auctionTiming" inline>
                      <v-radio :label="t('createDialog.radioLabels.serial')" value="serial" />
                      <v-radio
                        :label="t('createDialog.radioLabels.parallel')"
                        value="parallel"
                        :disabled="auctionType === 'japanese'"
                      />
                      <v-radio
                        :label="t('createDialog.radioLabels.staggered')"
                        value="staggered"
                        :disabled="auctionType === 'japanese'"
                      />
                    </v-radio-group>
                  </div>
                </v-col>
              </v-row>
            </v-expand-transition>
          </v-card-text>
        </v-tabs-window-item>
        <v-tabs-window-item value="masterclass">
          <v-card-text class="pt-4 px-16 overflow-y-auto">
            <div class="mb-4">
              {{ t('createDialog.sections.masterclassType') }}
            </div>
            <v-radio-group v-model="auctionType" inline>
              <v-radio :label="t('auction.type.english')" value="reverse" />
              <v-radio :label="t('auction.type.dutch')" value="dutch" disabled />
              <v-radio :label="t('auction.type.japanese')" value="japanse" disabled />
            </v-radio-group>
          </v-card-text>
        </v-tabs-window-item>
      </v-tabs-window>

      <v-card-actions class="pb-8 justify-center">
        <span class="error-text">{{ error }}</span>
        <v-btn-secondary size="large" class="px-16" @click="dialog = false">
          {{ t('common.cancel') }}
        </v-btn-secondary>

        <v-btn-primary
          class="px-16 ml-8"
          size="large"
          :loading="loading"
          :disabled="disabledRule"
          @click="createAuction()"
        >
          {{
            createType === 'test'
              ? t('createDialog.buttons.createTest')
              : t('createDialog.buttons.createMasterclass')
          }}
        </v-btn-primary>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup>
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

const { user, profile } = useUser()

// Use translations
const { t } = useTranslations()
dayjs.extend(utc)

const dialog = defineModel()
const loading = ref(false)
const auctionType = ref('reverse')
const isMultilot = ref(false)
const isPrebid = ref(true)
const error = ref(null)
const createType = ref('test')
const auctionTiming = ref('serial')
const maxRankDisplayed = ref(null)

const maxRankOptions = [
  { title: 'All', value: null },
  { title: '1', value: 1 },
  { title: '2', value: 2 },
  { title: '3', value: 3 },
  { title: '4', value: 4 },
  { title: 'No Rank', value: 0 }
]
const createAuction = async () => {
  loading.value = true
  const dynamicData = {
    date:
      auctionType.value === 'japanese'
        ? dayjs().add(10, 'minute').format()
        : dayjs().add(1, 'day').format(),
    time:
      auctionType.value === 'japanese'
        ? dayjs().add(10, 'minute').format('HH:mm')
        : dayjs().format('HH:mm'),
    company_id: profile.value?.company_id,
    buyer_id: user.value?.id,
    start_at:
      auctionType.value === 'japanese'
        ? dayjs().add(10, 'minute').format()
        : dayjs().add(1, 'day').format(),
    end_at: dayjs().add(2, 'day').format(),
    auctionType: auctionType.value,
    isMultilot: isMultilot.value,
    isPrebid: isPrebid.value,
    isMasterclass: createType.value === 'masterclass',
    auctionTiming: auctionTiming.value,
    maxRankDisplayed: maxRankDisplayed.value
  }
  const response = await $fetch('/api/createTestAuction', {
    method: 'POST',
    body: dynamicData,
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (response.error) {
    console.log('Error creating auction: ', response.error)
    error.value = response.error
  } else {
    console.log('Create Default Auction: ', response)
    loading.value = false
    dialog.value = false
  }
}
watch(auctionType, () => {
  if (auctionType.value === 'reverse') {
    isPrebid.value = true
  }
})

const disabledRule = computed(() => {
  return createType.value === 'masterclass' && auctionType.value !== 'reverse'
})
</script>
<style scoped>
.v-card-text {
  flex-grow: 1;
  height: 100%;
  overflow: scroll;
}
</style>
