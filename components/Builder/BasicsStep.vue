<template>
  <v-expansion-panel bg-color="transparent" :class="isSelected ? '' : 'border-b-thin'">
    <v-expansion-panel-title class="px-2" hide-actions>
      <TermsStepTitle v-model="isValid" :is-selected="props.isSelected" :builder="true">
        <template #numero> 1 </template>
        <template #title>
          {{ t('basics.title') }}
        </template>
      </TermsStepTitle>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <v-sheet class="bg-white rounded-lg panel-border">
        <v-container fluid class="py-8 px-10">
          <v-form v-model="isValid">
            <v-row>
              <v-col cols="12" md="4">
                <div class="mb-2 text-body-2">{{ t('basics.auctionOwner.label') }}*</div>
                <div class="d-flex align-center">
                  <v-autocomplete
                    v-model="selectedBuyer"
                    width="100"
                    max-width="400"
                    return-object
                    hide-details
                    item-title="email"
                    :items="buyerItems"
                    :menu-icon="null"
                  >
                    <template #item="{ props, item }">
                      <v-list-item
                        v-bind="props"
                        :subtitle="`${item.raw.companies?.name ?? '?'} - ${item.raw.first_name ?? '?'} ${item.raw.last_name ?? '?'}`"
                        :title="item.raw.email"
                      />
                    </template>
                    <template #prepend-inner>
                      <v-img src="@/assets/icons/basic/Search.svg" width="20" height="20" />
                    </template>
                    <template #append-inner>
                      <v-img src="@/assets/icons/basic/Chevron_down.svg" width="20" height="20" />
                    </template>
                  </v-autocomplete>
                </div>
              </v-col>
              <v-col md="4">
                <div class="mb-2 text-body-2">{{ t('basics.auctionUsage.label') }}*</div>
                <div class="d-flex align-center">
                  <v-select
                    v-model="model.usage"
                    :items="[
                      { title: t('basics.usage.real'), value: 'real' },
                      { title: t('basics.usage.training'), value: 'training' },
                      { title: t('basics.usage.test'), value: 'test' }
                    ]"
                    :menu-icon="null"
                    hide-details
                  >
                    <template #append-inner>
                      <v-img src="@/assets/icons/basic/Chevron_down.svg" width="20" height="20" />
                    </template>
                  </v-select>
                </div>
              </v-col>
              <v-col md="">
                <div class="mb-2 text-body-2">{{ t('basics.auctionStatus.label') }}*</div>
                <v-switch
                  v-model="model.published"
                  base-color="grey-ligthen-1"
                  color="green"
                  density="compact"
                  hide-details
                >
                  <template #prepend>
                    <div
                      class="cursor-pointer text-body-1"
                      :class="model.published ? 'text-grey' : ''"
                      @click="model.published = false"
                    >
                      {{ t('basics.draft') }}
                    </div>
                  </template>
                  <template #label>
                    <span
                      class="cursor-pointer text-body-1"
                      :class="model.published ? '' : 'text-grey'"
                      @click="model.published = false"
                    >
                      {{ t('basics.published') }}
                    </span>
                  </template>
                </v-switch>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="4" class="pb-0">
                <div>
                  <div class="mb-2 text-body-2">{{ t('basics.auctionName.label') }}*</div>
                  <v-text-field
                    v-model="model.name"
                    :rules="[nameRule]"
                    :placeholder="t('basics.auctionName.placeholder')"
                    :hint="nameHint"
                    :persistent-hint="!!nameHint"
                    max-width="400"
                  />
                </div>
              </v-col>
              <v-col cols="12" md="">
                <div>
                  <div class="mb-2 text-body-2">
                    {{ t('basics.description.label') }}
                  </div>
                  <v-textarea
                    v-model="model.description"
                    :placeholder="t('basics.description.placeholder')"
                    auto-grow
                    rows="1"
                    hide-details
                  />
                </div>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="3" class="pt-2">
                <div>
                  <div class="mb-2 text-body-2">
                    {{
                      auctionType === 'sealed-bid'
                        ? t('basics.sealedDate.label')
                        : t('basics.date.label')
                    }}*
                  </div>
                  <v-menu v-model="dateMenu" :close-on-content-click="false" location="end">
                    <template #activator="{ props }">
                      <v-text-field v-bind="props" :value="formattedDate" readonly hide-details>
                        <template #append-inner>
                          <v-img
                            src="@/assets/icons/basic/Calendar_Days.svg"
                            width="20"
                            height="20"
                          />
                        </template>
                      </v-text-field>
                    </template>

                    <v-card min-width="300" elevation="6">
                      <v-date-picker v-model="model.date" width="400" />
                    </v-card>
                  </v-menu>
                </div>
              </v-col>
              <v-col md="3" class="pt-2">
                <div>
                  <div class="mb-2 text-body-2">
                    {{
                      auctionType === 'sealed-bid'
                        ? t('basics.sealedTime.label')
                        : t('basics.time.label')
                    }}*
                  </div>
                  <v-menu v-model="timeMenu" :close-on-content-click="false" location="end">
                    <template #activator="{ props }">
                      <v-text-field v-bind="props" :value="model.time" readonly hide-details>
                        <template #append-inner>
                          <v-img src="@/assets/icons/basic/Clock.svg" width="20" height="20" />
                        </template>
                      </v-text-field>
                    </template>
                    <v-card min-width="300" elevation="6">
                      <VTimePicker v-model="model.time" ampm-in-title color="green-lighten-1" />
                    </v-card>
                  </v-menu>
                </div>
              </v-col>
              <v-col md="3" class="pb-0 pt-2">
                <div>
                  <div class="mb-2 text-body-2">{{ t('basics.timezone.label') }}*</div>
                  <v-text-field
                    v-model="model.timezone"
                    :rules="[nameRule]"
                    :placeholder="t('basics.timezone.placeholder')"
                  />
                </div>
              </v-col>
              <v-col cols="6" md="3" class="pt-2">
                <div>
                  <div class="mb-2 text-body-2">{{ t('basics.currency.label') }}*</div>
                  <v-select
                    v-model="model.currency"
                    :menu-icon="null"
                    :items="['EUR', 'USD']"
                    hide-details
                  >
                    <template #append-inner>
                      <v-img src="@/assets/icons/basic/Chevron_down.svg" width="20" height="20" />
                    </template>
                  </v-select>
                </div>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-radio-group
                  v-model="auctionType"
                  :disabled="auctionId"
                  inline
                  hide-details
                  class="mb-3"
                >
                  <template #label>
                    <div class="text-body-2">
                      {{ t('basics.auctionType') }}
                    </div>
                  </template>
                  <v-radio
                    :label="t('auction.type.english')"
                    value="reverse"
                    density="compact"
                    class="mr-8"
                    style="font-size: 14px"
                  >
                    <template #label>
                      <div class="text-body-1">
                        {{ t('auction.type.english') }}
                      </div>
                    </template>
                  </v-radio>
                  <v-radio
                    :label="t('auction.type.dutch')"
                    density="compact"
                    class="mr-8"
                    value="dutch"
                    style="font-size: 14px"
                  >
                    <template #label>
                      <div class="text-body-1">
                        {{ t('auction.type.dutch') }}
                      </div>
                    </template>
                  </v-radio>
                  <v-radio
                    :label="t('auction.type.japanese')"
                    density="compact"
                    class="mr-8"
                    value="japanese"
                    style="font-size: 14px"
                  >
                    <template #label>
                      <div class="text-body-1">
                        {{ t('auction.type.japanese') }}
                      </div>
                    </template>
                  </v-radio>
                  <v-radio
                    :label="t('auction.type.sealedBid')"
                    density="compact"
                    class="mr-8"
                    value="sealed-bid"
                    style="font-size: 14px"
                  >
                    <template #label>
                      <div class="text-body-1">
                        {{ t('auction.type.sealedBid') }}
                      </div>
                    </template>
                  </v-radio>
                  <v-radio
                    :label="t('auctionTypes.preferredDutch')"
                    density="compact"
                    class="mr-8"
                    value="preferred-dutch"
                    style="font-size: 14px"
                  >
                    <template #label>
                      <div class="text-body-1">
                        {{ t('auctionTypes.preferredDutch') }}
                      </div>
                    </template>
                  </v-radio>
                  <v-radio
                    :label="t('auctionTypes.japaneseNoRank')"
                    density="compact"
                    class="mr-8"
                    value="japanese-no-rank"
                    style="font-size: 14px"
                  >
                    <template #label>
                      <div class="text-body-1">
                        {{ t('auctionTypes.japaneseNoRank') }}
                      </div>
                    </template>
                  </v-radio>
                </v-radio-group>
                <v-tabs-window v-model="auctionType">
                  <v-tabs-window-item v-for="item in alert" :key="item.value" :value="item.value">
                    <v-sheet rounded="lg" :class="item.class">
                      <v-row align="center">
                        <v-col cols="12" md="8" class="d-flex flex-column ga-4 justify-start">
                          <span class="text-subtitle-2 font-weight-bold">
                            {{ item.title }}
                          </span>
                          <span class="text-primary-ligthen-1" v-html="parseMarkdown(item.text)" />
                        </v-col>
                        <v-col cols="12" md="4">
                          <v-img height="206" :src="item.img" />
                        </v-col>
                      </v-row>
                    </v-sheet>
                  </v-tabs-window-item>
                </v-tabs-window>
              </v-col>
            </v-row>
          </v-form>
        </v-container>
      </v-sheet>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup>
import { z } from 'zod'
import { uniq } from 'lodash'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'

const props = defineProps(['isSelected'])

const route = useRoute()
const auctionId = route.query.auction_id

// Use translations
const { t } = useTranslations()

const { descriptions: alert, parseMarkdown } = useAuctionsDescriptions()

dayjs.extend(localizedFormat)

const model = defineModel()
const supabase = useSupabaseClient()

// Hint pour le nom d'enchère dupliquée - only show in duplication mode
const nameHint = computed(() => {
  // Only show hint if we're in duplication mode
  if (route.query.mode !== 'duplicate') {
    return ''
  }

  const namePrefix = t('duplication.namePrefix')
  if (model.value?.name?.startsWith(namePrefix) || model.value?.name?.startsWith('Copy of')) {
    return t('duplication.nameHint')
  }
  return ''
})

const selectedBuyer = ref(null)
const buyerItems = ref([])
const dateMenu = ref(false)
const timeMenu = ref(false)
const isValid = ref(false)

const auctionTypesMap = {
  reverse: () => 'reverse',
  dutch: () => {
    return model.value.prefered ? 'preferred-dutch' : 'dutch'
  },
  japanese: () => {
    return model.value.max_rank_displayed === 0 ? 'japanese-no-rank' : 'japanese'
  },
  'sealed-bid': () => 'sealed-bid'
}

const auctionType = ref(auctionTypesMap[model.value.type]?.() || model.value.type)

// Watch for changes to model data (when editing an existing auction)
// This ensures auctionType is updated when data is loaded from the database
watch(
  () => [model.value.type, model.value.max_rank_displayed],
  ([newType, newMaxRank]) => {
    if (newType && auctionTypesMap[newType]) {
      const mappedType = auctionTypesMap[newType]()
      // Only update if it's different to avoid triggering the other watch
      if (auctionType.value !== mappedType) {
        auctionType.value = mappedType
      }
    }
  },
  { immediate: true }
)

watch(auctionType, () => {
  if (auctionType.value === 'preferred-dutch') {
    model.value.type = 'dutch'
    model.value.prefered = true
    // Set default max_rank_displayed only if not already set
    if (model.value.max_rank_displayed === undefined || model.value.max_rank_displayed === null) {
      model.value.max_rank_displayed = 100
    }
  } else if (auctionType.value === 'japanese-no-rank') {
    model.value.type = 'japanese'
    // Always set to 0 for japanese-no-rank
    model.value.max_rank_displayed = 0
  } else if (auctionType.value === 'japanese') {
    model.value.type = 'japanese'
    // Always set to 100 for regular japanese (in case switching from no-rank)
    model.value.max_rank_displayed = 100
  } else {
    model.value.type = auctionType.value
    // Set default max_rank_displayed only if not already set
    if (model.value.max_rank_displayed === undefined || model.value.max_rank_displayed === null) {
      model.value.max_rank_displayed = 100
    }
  }
})

const fetchProfiles = async () => {
  const { data: profilesDate, error: errorProfiles } = await supabase
    .from('profiles')
    .select('*, companies(*)')
  if (errorProfiles) {
    console.log(errorProfiles)
  } else {
    buyerItems.value = uniq(profilesDate)
    if (model.value.buyer_id) {
      const buyer = profilesDate.find((e) => e.id === model.value.buyer_id)
      // console.log('buyer :', buyer)
      selectedBuyer.value = buyer
    } else {
      model.value.published = false
    }
  }
}

fetchProfiles()

watch(selectedBuyer, (newBuyer) => {
  model.value.company_id = newBuyer?.companies?.id || null
  model.value.buyer_id = newBuyer?.id || null
})

const formattedDate = computed(() => (model.value.date ? dayjs(model.value.date).format('ll') : ''))

const schemaToRule = useZodSchema()
const nameRule = computed(() => {
  const nameSchema = z.string().min(1, { message: t('validation.required') })
  return schemaToRule(nameSchema)
})
</script>

<style>
.text-grey-darken-1 {
  white-space: pre-line;
}

.vertical-divider {
  border-left: 2px solid rgba(0, 0, 0, 0.12);
  height: 100%;
}
.field-style:deep(.v-field--variant-outlined) {
  color: grey !important;
}

.text-grey-darken-1 :deep(strong) {
  color: inherit;
}

.v-radio-group > .v-input__control > .v-label {
  margin-left: 0 !important;
}

.v-radio-group > .v-input__control > .v-label + .v-selection-control-group {
  padding-left: 0px !important;
  margin-left: -2px !important; /* check this negative margin */
}

.v-switch__track {
  height: 22px !important;
  padding-inline: 20px !important; /* broken padding => find better solution */
}

.v-switch:not(.v-switch--inset) .v-switch__thumb {
  width: 16px !important;
  height: 16px !important;
  background-color: #ffffff !important;
}
</style>
