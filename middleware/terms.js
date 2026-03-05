export default defineNuxtRouteMiddleware(async (to, from) => {
  const supabase = useSupabaseClient()

  const { getSession } = useUser()
  const { user } = await getSession()

  const validatedTerms = ref(false)
  const terms = ref(null)

  const { data: auctionsGroup } = await supabase
    .from('auctions')
    .select('id, lot_number, type')
    .eq('auctions_group_settings_id', to.params.auctionGroupId)

  // Handle case where query fails or returns no auctions
  if (!auctionsGroup || auctionsGroup.length === 0) {
    return
  }

  auctionsGroup.sort((a, b) => a.lot_number - b.lot_number)

  if (!validatedTerms.value) {
    terms.value = await Promise.all(
      auctionsGroup.map(async (auction) => {
        const { data } = await supabase
          .from('auctions_sellers')
          .select('terms_accepted, auction_id')
          .eq('seller_email', user.value.email)
          .eq('auction_id', auction.id)
          .single()
        return data
      })
    )

    // Handle case where terms query fails
    if (!terms.value || terms.value.length === 0) {
      console.warn(
        '[Middleware:terms] Terms query returned no results for user:',
        user.value?.email
      )
      return
    }

    validatedTerms.value = await terms.value.every((e) => e && e.terms_accepted)
  }
  const isMultilot = to.query.multilot === 'true'

  if (!validatedTerms.value) {
    if (!from.name?.includes('terms')) {
      const firstFalseTerms = await terms.value.find((e) => e && !e.terms_accepted)
      return navigateTo(
        `/auctions/${to.params.auctionGroupId}/lots/${firstFalseTerms.auction_id}/terms${auctionsGroup[0].type ? '?type=' + auctionsGroup[0].type : ''}${isMultilot ? '&multilot=true' : ''}`
      )
    } else {
      return navigateTo(
        `/auctions/${to.params.auctionGroupId}/lots/${to.params.auctionId}/terms${auctionsGroup[0].type ? '?type=' + auctionsGroup[0].type : ''}${isMultilot ? '&multilot=true' : ''}`
      )
    }
  }
  return
})
