export default function () {
  const supabase = useSupabaseClient()

  async function fetchProfiles(auctions_sellers) {
    const emailsProfilesQuery = auctions_sellers
      .reduce((acc, curr) => {
        return (acc += `email.eq.${curr.seller_email},`)
      }, '')
      .slice(0, -1)

    const { data: existingParticipantsProfiles, error: errorProfiles } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .or(emailsProfilesQuery)

    if (errorProfiles) {
      console.log('ERROR existingParticipantsProfiles: ', existingParticipantsProfiles)
    }

    const suppliers = auctions_sellers.map((seller) => {
      const seller_profile = existingParticipantsProfiles.find(
        (existProfile) => existProfile.email === seller.seller_email
      )
      const identifier = seller_profile?.companies?.name ?? seller.seller_email
      return { ...seller, seller_profile, identifier }
    })

    return suppliers
  }

  return { fetchProfiles }
}
