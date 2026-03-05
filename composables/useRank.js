import { useMemoize } from '@vueuse/core'

const getCachedRank = useMemoize(
  async (userId, auctionId) => {
    const supabase = useSupabaseClient()

    const { data: rank } = await supabase.rpc('get_seller_rank', {
      p_seller_id: userId,
      p_auction_id: auctionId
    })

    return rank
  },
  {
    getKey(userId, auctionId) {
      setTimeout(() => {
        getCachedRank.clear()
      }, 200)

      return `${userId}-${auctionId}-${Math.round(Date.now() / 200)}`
    }
  }
)

export default function () {
  async function fetchRank(userId, auctionId) {
    return await getCachedRank(userId, auctionId)
  }

  return { fetchRank }
}
