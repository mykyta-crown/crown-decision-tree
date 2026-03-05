import { useDocumentVisibility } from '@vueuse/core'

const channels = {}
const rooms = {}

function handleSubscribers(channelName, payload) {
  channels[channelName].forEach((subscriber) => {
    subscriber.handle(payload)
  })
}

export default function ({ channelName, callback }) {
  const supabase = useSupabaseClient()
  const { user } = useUser()
  const visibility = useDocumentVisibility()

  let visibilityError = false

  function handlePresence(payload) {
    // console.log(channelName, 'handlePresence', payload)

    if (payload.key && callback) {
      callback(payload)
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
      channels[channelName] = [{ handle: handlePresence }]

      const channel = supabase.channel(channelName)
      rooms[channelName] = channel

      channel
        .on('presence', { event: 'sync' }, (payload) => {
          handleSubscribers(channelName, payload)
        })
        .on('presence', { event: 'join' }, (payload) => {
          handleSubscribers(channelName, payload)
        })
        .on('presence', { event: 'leave' }, (payload) => {
          handleSubscribers(channelName, payload)
        })

      channel.subscribe((status) => {
        // console.log(channelName, 'Presence Status', status)

        if (status === 'SUBSCRIPTION_ERROR' && visibility === 'hidden') {
          unsubscribe()
          visibilityError = true
        }
      })
    } else {
      channels[channelName].push({
        handle: handlePresence
      })
    }
  }

  async function track() {
    if (!rooms[channelName]) {
      await startSubscription()
    }

    rooms[channelName].track({
      user: user.value.id,
      online_at: new Date().toISOString()
    })
  }

  watch(visibility, () => {
    // console.log(channelName, 'visibility change', visibilityError)
    if (visibility === 'visible' && visibilityError) {
      startSubscription()
    }
  })

  startSubscription()

  return { track }
}
