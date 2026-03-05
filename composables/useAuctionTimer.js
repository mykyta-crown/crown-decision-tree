import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import durationPlugin from 'dayjs/plugin/duration'
import { onScopeDispose, getCurrentInstance } from 'vue'
import getAuctionStatus from '@/utils/getAuctionStatus'
import useNow from '@/composables/useNow'

dayjs.extend(durationPlugin)
dayjs.extend(relativeTime)

// const { now } = useNow()
// const now = ref(dayjs())

export default function (auctionRef, intervalLog) {
  const { now } = useNow()

  // Real/test sealed-bid: active from creation (use created_at)
  // Training sealed-bid: controlled by Start Training button (use start_at)
  const startDate = computed(() => {
    if (!auctionRef?.value) return null
    if (auctionRef.value.type === 'sealed-bid' && auctionRef.value.usage !== 'training') {
      return auctionRef.value.created_at
    }
    return auctionRef.value.start_at
  })

  const initialStart =
    auctionRef?.value?.type === 'sealed-bid' && auctionRef?.value?.usage !== 'training'
      ? auctionRef?.value?.created_at
      : auctionRef?.value?.start_at

  const status = ref(
    getAuctionStatus(initialStart, auctionRef?.value?.end_at, auctionRef?.value?.type)
  )
  const start = computed(() => (startDate.value ? dayjs(startDate.value) : null))
  const end = computed(() => (auctionRef?.value?.end_at ? dayjs(auctionRef.value.end_at) : null))

  // const intervalId =
  const intervalId = setInterval(() => {
    if (!auctionRef?.value?.type || !start.value || !end.value) {
      return
    }
    const newStatus = getAuctionStatus(start.value, end.value, auctionRef.value.type)

    if (intervalLog) {
      console.log('auctioninterval log auctionTimer', newStatus)
    }

    if (newStatus.label !== status.value.label) {
      status.value = newStatus
    }
  }, 1000)

  // Use onScopeDispose instead of onUnmounted to safely handle cleanup
  // even when called after await in async setup()
  // Fall back to onUnmounted if we have an active component instance
  if (getCurrentInstance()) {
    onUnmounted(() => clearInterval(intervalId))
  } else {
    onScopeDispose(() => clearInterval(intervalId))
  }

  const startInDuration = computed(() =>
    start.value ? dayjs.duration(start.value.diff(now.value)) : dayjs.duration(0)
  )
  const endInDuration = computed(() =>
    end.value ? dayjs.duration(end.value.diff(now.value)) : dayjs.duration(0)
  )
  const duration = computed(() =>
    start.value && end.value ? dayjs.duration(end.value.diff(start.value)) : dayjs.duration(0)
  )

  return {
    now,
    status,
    start,
    end,
    startInDuration,
    endInDuration,
    duration
  }
}
