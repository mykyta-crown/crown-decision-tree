import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

export default function (startAt, endAt, type = null) {
  const { now } = useNow()
  const startDate = dayjs(startAt)

  if (type === 'sealed-bid') {
    const endDate = dayjs(endAt)

    // Check if auction hasn't started yet (for training auctions)
    if (now.value.isBefore(startDate)) {
      return { label: 'upcoming', color: 'yellow', temporality: `Upcoming ${startDate.fromNow()}` }
    }

    if (now.value.isAfter(endDate)) {
      return { label: 'closed', color: 'sky', temporality: `Finished ${endDate.fromNow()}` }
    }

    return { label: 'active', color: 'grass', temporality: 'Active' }
  }

  if (now.value.isAfter(startDate)) {
    const endDate = dayjs(endAt)

    if (now.value.isAfter(endDate)) {
      return { label: 'closed', color: 'sky', temporality: `Finished ${endDate.fromNow()}` }
    } else {
      return { label: 'active', color: 'grass', temporality: `Active ${startDate.fromNow()}` }
    }
  } else {
    return { label: 'upcoming', color: 'yellow', temporality: `Upcoming ${startDate.fromNow()}` }
  }
}
