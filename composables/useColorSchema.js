import { useMemoize } from '@vueuse/core'

const getCachedColors = useMemoize(async (auctionGroupId) => {
  const { profile } = useUser()

  if (!profile.value) {
    return {}
  }

  const { data } = await $fetch('/api/v1/retrieve_colors', {
    method: 'POST',
    body: {
      groupId: auctionGroupId,
      profile: profile.value
    }
  })

  return data.colors
})

export default function (auctionGroupId) {
  const route = useRoute()

  async function getColors() {
    const colors = await getCachedColors(auctionGroupId || route.params.auctionGroupId)

    return colors
  }

  return { getColors }
}
