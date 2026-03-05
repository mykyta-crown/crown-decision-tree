import { useDocumentVisibility, useMemoize } from '@vueuse/core'

// Helper to generate cache key (must match the memoize getKey function)
function getCacheKey(table, operator, col, val) {
  return `${table}_${operator}_${col}_${val}`
}

const fetchMemoizeData = useMemoize(
  async (supabase, table, { operator, col, val }) => {
    const query = supabase.from(table).select('*')

    const hasFilter = operator && col && val

    const { data } = hasFilter ? await query[operator](col, val) : await query
    return data
  },
  {
    getKey: (supabase, table, { operator, col, val }) => getCacheKey(table, operator, col, val)
  }
)

const channels = {}

export default function ({ table, filter }) {
  // const schema = 'public'
  const supabase = useSupabaseClient()
  const visibility = useDocumentVisibility()

  const channelName = `broadcast_${table}_${filter}`
  const subscribedData = ref([])
  // Version counter that increments on any data change (INSERT, UPDATE, DELETE)
  const dataVersion = ref(0)
  const [col, operatorValue] = filter ? filter.split('=') : ['', '']
  const [operator, val] = operatorValue.split('.')

  // Calculate the cache key for THIS specific subscription
  const cacheKey = getCacheKey(table, operator, col, val)

  let visibilityError = false

  // Invalidate only this subscription's cache entry (not all caches)
  function invalidateCache() {
    fetchMemoizeData.cache.delete(cacheKey)
  }

  async function fetchData() {
    subscribedData.value = await fetchMemoizeData(supabase, table, { operator, col, val })
    return subscribedData
  }

  function handlePayload({ event, payload }) {
    // console.log(channelName, 'handlePayload', payload)
    if (event === 'INSERT') {
      const payloadIndex = subscribedData.value.findIndex((obj) => obj.id === payload.record.id)
      if (payloadIndex === -1) {
        subscribedData.value.unshift(payload.record)
      }
    } else if (event === 'UPDATE') {
      const updateIndex = subscribedData.value.findIndex((obj) => obj.id === payload.record.id)
      if (updateIndex !== -1) {
        subscribedData.value.splice(updateIndex, 1, payload.record)
      }
    } else if (event === 'DELETE') {
      const deleteIndex = subscribedData.value.findIndex((obj) => obj.id === payload.old_record.id)
      if (deleteIndex !== -1) {
        subscribedData.value.splice(deleteIndex, 1)
      }
    }
    // Increment version to signal data change (for watchers that need to detect UPDATE events)
    dataVersion.value++
  }

  function unsubscribe() {
    try {
      supabase.removeChannel(channelName)
    } catch (err) {
      console.log('Error unsubscribing', channelName, err)
    }
  }

  function handleBroadcast(payload) {
    // console.log(channelName, 'handleBroadcast', payload)
    channels[channelName].forEach((subscriber) => {
      subscriber.handle(payload)
    })
    // Invalidate only this subscription's cache (not all caches)
    invalidateCache()
  }

  async function startSubscription() {
    if (!channels[channelName]) {
      await supabase.realtime.setAuth()
      channels[channelName] = [{ handle: handlePayload, fetch: fetchData }]
      const channel = supabase.channel(channelName, {
        config: { private: true }
      })

      channel
        .on('broadcast', { event: 'INSERT' }, handleBroadcast)
        .on('broadcast', { event: 'UPDATE' }, handleBroadcast)
        .on('broadcast', { event: 'DELETE' }, handleBroadcast)
        .subscribe((status, error) => {
          if (status === 'SUBSCRIPTION_ERROR' && visibility === 'hidden') {
            invalidateCache()
            unsubscribe()
            visibilityError = true
          }

          // Note: We don't fetch on SUBSCRIBED anymore - each subscriber fetches once via fetchData() below
        })
    } else {
      channels[channelName].push({
        handle: handlePayload,
        fetch: fetchData
      })
    }

    // Each subscriber fetches once to populate their own subscribedData
    await fetchData()
  }

  watch(visibility, () => {
    // console.log(channelName, 'visibility change', visibilityError)
    if (visibility === 'visible' && visibilityError) {
      invalidateCache()
      startSubscription()
    }
  })

  startSubscription()
  // }

  return { subscribedData, dataVersion, fetchData, unsubscribe }
}
