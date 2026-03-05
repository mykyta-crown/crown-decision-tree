export default function ({ auctionId }) {
  const auction = ref(null)
  let fetchAuction = null

  const { subscribedData, fetchData } = useBroadcast({
    table: 'auctions',
    filter: `id=eq.${auctionId}`
  })

  fetchAuction = fetchData
  watch(
    subscribedData,
    () => {
      auction.value = subscribedData.value?.[0] || null
    },
    { deep: true }
  )

  return { auction, fetchAuction }
}
