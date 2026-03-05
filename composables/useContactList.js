import { uniq } from 'lodash'
const contacts = ref([])

export default function () {
  const supabase = useSupabaseClient()
  const { user, isAdmin } = useUser()

  async function fetchContacts() {
    const { data: auctions } = await supabase
      .from('auctions')
      .select('id, auctions_sellers(seller_email)')
      .eq('buyer_id', user.value?.id)

    const contactsQuery = supabase.from('profiles').select('*, companies(*)')

    if (!isAdmin.value) {
      const emails = []
      if (auctions) {
        auctions.forEach((a) => {
          emails.push(...a.auctions_sellers.map((s) => s.seller_email))
        })
      }

      contactsQuery.in('email', uniq(emails))
    }

    const { data: profiles } = await contactsQuery

    contacts.value = profiles

    return profiles
  }
  if (!contacts.value.length) {
    fetchContacts()
  }

  watch(user, async () => {
    await fetchContacts()
  })

  return { fetchContacts, contacts }
}
