<template>
  <VCalendar
    ref="calendarRef"
    v-model="modelvalue"
    class="calendar-style bg-white"
    :events="events"
    hide-week-number
    hide-day-header
    :weekdays="weekdays"
  >
    <template #header="{ title }">
      <div class="d-flex align-center justify-center">
        <v-btn variant="text" icon height="24" @click="handlePrev">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>

        <div class="text-h6 font-weight-regular text-center px-2">
          {{ title }}
        </div>

        <v-btn variant="text" icon height="24" @click="handleNext">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
    </template>
  </VCalendar>

  <div class="weekday-grid">
    <div
      v-for="(weekday, index) in localizedWeekdays"
      :key="index"
      class="text-center text-grey mb-2 mt-2"
    >
      {{ weekday }}
    </div>
    <div
      v-for="day in formatedDaysArray"
      :key="day"
      class="grid-item rounded-lg ma-1 d-flex justify-start align-end pa-2 relative"
      :class="
        day.month !== displayedMonth
          ? 'outside-month border-sm'
          : day.events.length > 0
            ? `bg-${day.status} border-event`
            : dayjs(day.date).day() === 0 || dayjs(day.date).day() === 6
              ? 'bg-grey-ligthen-2'
              : 'bg-grey-ligthen-3' // 0=Sunday, 6=Saturday
      "
    >
      <v-menu open-on-hover max-height="400">
        <template #activator="{ props }">
          <div v-if="day.events.length > 0" v-bind="props" class="absolute" />
        </template>
        <v-list v-if="day.events.length > 0" class="elevation-0 bg-white list-item-shadow px-2">
          <template v-for="(event, index) in day.events" :key="event.auction_id">
            <v-list-item
              nav
              slim
              :value="index"
              rounded="lg"
              class="text-body-1 bg-white my-1"
              :to="`/auctions/${event.groupSettingId}/lots/${event.auction_id}/buyer`"
            >
              <v-row align="center">
                <v-col cols="auto" class="d-flex align-center font-weight-bold event-name">
                  <div class="text-truncate">
                    {{ event.name }}
                  </div>
                </v-col>
                <v-spacer />
                <v-col
                  cols="auto"
                  class="font-weight-regular d-flex align-center ga-1 justify-start"
                >
                  {{ firstLetterUppercase(event.type) }}
                  <img
                    v-if="event.isMultilot"
                    class="bg-grey-ligthen-2 rounded"
                    :src="`/builder/${event.timing_rule}-icon.svg`"
                    height="18px"
                  />
                </v-col>
                <v-col cols="auto" class="d-flex align-center ga-1">
                  <v-icon color="grey" size="small"> mdi-clock-outline </v-icon
                  >{{ dayjs(event.start).format('HH:mm') }}
                </v-col>

                <v-col cols="auto">
                  <v-chip
                    v-if="event.status"
                    class="d-flex justify-center align-center"
                    :color="event.color"
                    variant="flat"
                    label
                  >
                    {{ firstLetterUppercase(event.status) }}
                  </v-chip>
                </v-col>
              </v-row>
            </v-list-item>
            <v-divider v-if="index !== day.events.length - 1" color="grey-ligthen-2" />
          </template>
        </v-list>
      </v-menu>
      <div class="calendar-style text-caption text-md-body-1">
        {{ dayjs(day.isoDate).format('DD') }}
      </div>
    </div>
  </div>
</template>
<script setup>
import { VCalendar } from 'vuetify/labs/VCalendar'
import { ref, onMounted, computed } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/fr'
import { useDate } from 'vuetify'

const route = useRoute()
const supabase = useSupabaseClient()

// Get locale and translations
const { locale, t } = useTranslations()

// Set dayjs locale based on current language and watch for changes
watchEffect(() => {
  dayjs.locale(locale.value)
})

// Initialize locale
dayjs.locale(locale.value)

const model = defineModel() // Used to change the eAuctions list based on the selected company

const adapter = useDate()
const weekdays = ref([1, 2, 3, 4, 5, 6, 0])
// Localized weekday names using translations
const localizedWeekdays = computed(() => {
  return [
    t('weekdays.monday'),
    t('weekdays.tuesday'),
    t('weekdays.wednesday'),
    t('weekdays.thursday'),
    t('weekdays.friday'),
    t('weekdays.saturday'),
    t('weekdays.sunday')
  ]
})
const calendarRef = ref(null)
const modelvalue = ref([dayjs().toISOString()])

const daysArray = ref([])
const formatedDaysArray = ref([])
const displayedMonth = ref(dayjs().month())

const events = ref([])

onMounted(() => {
  updateCalendarDays()
})

const handlePrev = () => {
  const day = adapter.date(modelvalue.value[0])
  modelvalue.value = [adapter.addMonths(day, -1)]
}
watch(modelvalue, (newVal) => {
  if (newVal) {
    nextTick(() => {
      updateCalendarDays()
    })
  }
})

const handleNext = () => {
  const day = adapter.date(modelvalue.value[0])
  modelvalue.value = [adapter.addMonths(day, 1)]
}

watch(
  [route, modelvalue],
  async () => {
    const currentViewDate = dayjs(modelvalue.value[0])
    model.value = modelvalue.value[0]
    const startOfMonth = currentViewDate.startOf('month').format('YYYY-MM-DD')
    const endOfMonth = currentViewDate.endOf('month').format('YYYY-MM-DD')

    let query = supabase
      .from('auctions_group_settings')
      .select(
        'id, name, timing_rule, auctions!inner(*, users_auctions_status(is_favorite, is_archived))'
      )
      .eq('auctions.deleted', false)
      .eq('auctions.usage', 'real')

    if (route.query.company) {
      query = query.eq('auctions.company_id', route.query.company)
    }

    const { data, error } = await query
      .lt('auctions.start_at', endOfMonth)
      .gt('auctions.start_at', startOfMonth)

    if (data && !error) {
      events.value = []
      data.forEach((groupSetting) => {
        const auction = groupSetting.auctions[0]
        const startAt =
          auction.type === 'sealed-bid' && auction.usage !== 'training'
            ? auction.created_at
            : auction.start_at
        const currentStatus = getAuctionStatus(startAt, auction.end_at, auction.type)
        events.value.push({
          name: groupSetting.name || auction.name || 'Auction',
          start: auction.start_at,
          end: auction.end_at || auction.start_at,
          color: currentStatus.color,
          status: currentStatus.label,
          auction_id: auction.id,
          groupSettingId: groupSetting.id,
          type: auction.type,
          isMultilot: groupSetting.auctions.length > 1,
          timing_rule: groupSetting.timing_rule
        })
      })

      updateCalendarDays()
    }
  },
  { immediate: true }
)

const updateCalendarDays = () => {
  if (!calendarRef.value) return

  daysArray.value = calendarRef.value.daysInMonth
  formatedDaysArray.value = daysArray.value
    .map((day) => {
      const eventsThisDay = events.value.filter((event) => {
        return dayjs(event.start).format('DD/MM/YYYY') === dayjs(day.isoDate).format('DD/MM/YYYY')
      })

      const sortEventByStatus = eventsThisDay.sort((a, b) => {
        if (a.status === 'active') return -1
        if (b.status === 'active') return 1
        if (a.status === 'upcoming') return -1
        if (b.status === 'upcoming') return 1
        return 0
      })

      return {
        status: sortEventByStatus[0]?.color,
        events: eventsThisDay,
        ...day,
        isWeekStart: dayjs(day.isoDate).day() === 1 // 1 = Monday, locale-independent
      }
    })
    .slice(0, 36) // Limit to 5 rows

  const findIndexOfFirstMonday = formatedDaysArray.value.findIndex((day) => day.isWeekStart)
  formatedDaysArray.value = formatedDaysArray.value.slice(findIndexOfFirstMonday)
  displayedMonth.value = dayjs(modelvalue.value[0]).month()
}

const firstLetterUppercase = (string) => {
  if (string === 'reverse') {
    string = 'english'
  }
  if (string.length === 0) {
    return string
  } else {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }
}
</script>
<style scoped>
.event-name {
  max-width: 250px;
}

.calendar-style:deep(.v-calendar-month__days) {
  display: none;
}

div:deep(.v-calendar__container) {
  border: none !important;
}

.outside-month {
  background-color: white !important;
  border: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}
.border-event {
  border: 1px solid rgb(var(--v-theme-primary)) !important;
}
.weekday-grid {
  max-width: 500px;
  max-height: 286px;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  align-items: center;
  justify-items: center;
  margin: auto;
}
@media screen and (max-width: 960px) {
  .weekday-grid {
    max-width: 500px;
    max-height: 350px;
  }
}
.grid-item {
  max-height: 45px;
  height: 45px;
  width: 42px;
  margin: 0 !important;
  margin-bottom: 8px !important;
}
@media screen and (max-width: 960px) {
  .grid-item {
    min-height: 20px;
    height: 40px;
    min-width: 30px;
    width: 35px;
  }
}
@media screen and (max-width: 1360px) {
  .grid-item {
    min-height: 20px;
    height: 40px;
    min-width: 30px;
    width: 35px;
  }
}
@media screen and (max-width: 1200px) {
  .grid-item {
    min-height: 18px;
    height: 32px;
    width: 25px;
  }
  .grid-item:deep(div) {
    font-size: 11px !important;
  }
}
.relative {
  position: relative;
}
.absolute {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}
.bg-none {
  background-color: transparent !important;
}
.list-item-shadow {
  box-shadow: 5px 10px 15px -10px rgba(0, 0, 0, 0.1) !important;
}
</style>
