import { useDocumentVisibility, useMemoize } from '@vueuse/core'

// Helper to generate cache key (must match the memoize getKey function)
function getCacheKey(table, operator, col, val, select) {
  return `${table}_${operator}_${col}_${val}_${select || '*'}`
}

const fetchMemoizeData = useMemoize(
  async (supabase, table, { operator, col, val, select }) => {
    const selectClause = select || '*'
    const query = supabase.from(table).select(selectClause)

    const hasFilter = operator && col && val

    const { data } = hasFilter ? await query[operator](col, val) : await query
    return data
  },
  {
    getKey: (supabase, table, { operator, col, val, select }) =>
      getCacheKey(table, operator, col, val, select)
  }
)

const channels = {}

export default function ({ table, filter, select }) {
  const schema = 'public'
  const supabase = useSupabaseClient()
  const visibility = useDocumentVisibility()

  const channelName = `${table}_${filter}`
  const subscribedData = ref([])
  const [col, operatorValue] = filter ? filter.split('=') : ['', '']
  const [operator, val] = operatorValue.split('.')

  // Calculate the cache key for THIS specific subscription
  const cacheKey = getCacheKey(table, operator, col, val, select)

  let visibilityError = false

  // Invalidate only this subscription's cache entry (not all caches)
  function invalidateCache() {
    fetchMemoizeData.cache.delete(cacheKey)
  }

  async function fetchData() {
    subscribedData.value = await fetchMemoizeData(supabase, table, { operator, col, val, select })
    return subscribedData
  }

  function handlePayload(payload) {
    if (payload.eventType === 'INSERT') {
      // For INSERT, fetch complete data to get all joins (profiles, etc.)
      // The payload.new only contains the table columns, not joins
      invalidateCache()
      fetchData()
    } else if (payload.eventType === 'UPDATE') {
      const updateIndex = subscribedData.value.findIndex((obj) => obj.id === payload.new.id)
      if (updateIndex !== -1) {
        subscribedData.value.splice(updateIndex, 1, payload.new)
      }
    } else if (payload.eventType === 'DELETE') {
      // Clear cache on DELETE to ensure fresh data (important for training reset)
      invalidateCache()
      const deleteIndex = subscribedData.value.findIndex((obj) => obj.id === payload.old.id)
      if (deleteIndex !== -1) {
        subscribedData.value.splice(deleteIndex, 1)
      }
    }
  }

  function unsubscribe() {
    try {
      supabase.removeChannel(channelName)
    } catch (err) {
      console.log('Error unsubscribing', channelName, err)
    }
  }

  async function startSubscription() {
    if (!channels[channelName]) {
      await supabase.realtime.setAuth()
      channels[channelName] = [{ handle: handlePayload, fetch: fetchData }]
      const channel = supabase.channel(channelName)

      channel.on('postgres_changes', { event: '*', schema, table, filter }, (payload) => {
        channels[channelName].forEach((subscriber) => {
          subscriber.handle(payload)
        })
        // Invalidate only this subscription's cache (not all caches)
        invalidateCache()
      })

      channel.subscribe((status) => {
        if (status === 'SUBSCRIPTION_ERROR' && visibility === 'hidden') {
          invalidateCache()
          unsubscribe()
          visibilityError = true
        }

        if (status === 'SUBSCRIBED') {
          channels[channelName].forEach((subscriber) => {
            subscriber.fetch()
          })
        }
      })
    } else {
      channels[channelName].push({
        handle: handlePayload,
        fetch: fetchData
      })
    }

    fetchData()
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

  return { subscribedData, fetchData, unsubscribe }
}
