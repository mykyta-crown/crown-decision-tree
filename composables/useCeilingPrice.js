export default function (auctionId, sellerEmail = null) {
  const supabase = useSupabaseClient()

  const ceilingSupplies = ref([])
  const loaded = ref(false)
  const sellerEmailRef = ref(sellerEmail)

  const ceilingPrice = computed(() => {
    const total = ceilingSupplies.value.reduce((price, supplie) => {
      let sellerData = null

      if (sellerEmailRef.value) {
        // Admin panel: chercher le ceiling du seller spécifique (pas de fallback)
        sellerData = supplie.supplies_sellers.find((ss) => ss.seller_email === sellerEmailRef.value)
      } else {
        // Supplier view: utiliser le premier (comportement existant)
        sellerData = supplie.supplies_sellers[0]
      }

      return price + supplie.quantity * (sellerData?.ceiling || 0)
    }, 0)
    // Arrondir à 2 décimales pour éviter les problèmes de précision des floats
    return Math.round(total * 100) / 100
  })

  async function fetchCeiling() {
    const { data: supplies } = await supabase
      .from('supplies')
      .select('*, supplies_sellers(*)')
      .eq('auction_id', auctionId)

    ceilingSupplies.value = supplies
    loaded.value = true

    return {
      ceilingSupplies
    }
  }

  // Fonction pour mettre à jour le seller email (utile pour le watch)
  function setSellerEmail(email) {
    sellerEmailRef.value = email
  }

  fetchCeiling()

  return {
    fetchCeiling,
    ceilingSupplies,
    ceilingPrice,
    loaded,
    setSellerEmail
  }
}
