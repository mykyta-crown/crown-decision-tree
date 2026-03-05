import { ref } from 'vue'
import dayjs from 'dayjs'

const STORAGE_KEY = 'crown_duplicate_auction_state'

/**
 * Charger les traductions pour la duplication
 * @param {string} locale - Code de langue (en, fr)
 * @returns {Promise<Object>} Traductions builder
 */
async function loadBuilderTranslations(locale) {
  try {
    const translations = await queryContent(`${locale}/builder`).findOne()
    return translations
  } catch (error) {
    console.error('[useDuplicateAuctionState] Error loading translations:', error)
    return null
  }
}

/**
 * Composable pour gérer l'état de duplication des enchères entre la liste et le builder
 * Utilise sessionStorage pour persister l'état et permettre le refresh de la page
 */
export const useDuplicateAuctionState = () => {
  const { loadAuctionData, convertAuctionsToLots } = useAuctionDuplication()

  const isLoading = ref(false)
  const error = ref(null)

  /**
   * Préparer une enchère pour duplication et naviguer vers le builder
   * @param {string} auctionId - ID du groupe d'enchères à dupliquer
   * @param {object} router - Instance Vue Router
   */
  const prepareDuplication = async (auctionId, router) => {
    try {
      isLoading.value = true
      error.value = null

      // Obtenir la locale actuelle
      const locale = useState('locale')
      const currentLocale = locale.value || 'en'

      // Charger les traductions
      const translations = await loadBuilderTranslations(currentLocale)
      const namePrefix = translations?.duplication?.namePrefix || 'Copy of auction'

      // Charger les données de l'enchère (enchères, vendeurs, fournitures, handicaps)
      const data = await loadAuctionData(auctionId)

      if (!data || !data.auctions?.length) {
        throw new Error("Aucune donnée d'enchère trouvée")
      }

      const originalAuction = data.auctions[0]
      const timingRule = data.timingRule

      // Convertir les enchères en format lots
      const lots = await convertAuctionsToLots(data.auctions, auctionId)

      // Transformer en format builder
      const builderState = {
        basics: {
          // Nom avec préfixe traduit
          name: `${namePrefix} ${originalAuction.name}`,
          description: originalAuction.description,
          type: originalAuction.type,
          usage: originalAuction.usage,

          // Date et heure pré-remplies depuis l'original (éditables)
          date: dayjs(originalAuction.start_at).format('YYYY-MM-DD'),
          time: dayjs(originalAuction.start_at).format('HH:mm'),

          // Autres paramètres de base
          currency: originalAuction.currency,
          timezone: originalAuction.timezone,
          log_visibility: originalAuction.log_visibility,
          max_rank_displayed: originalAuction.max_rank_displayed,
          company_id: originalAuction.company_id,
          buyer_id: originalAuction.buyer_id,
          test: originalAuction.test,
          published: false, // Toujours non publié pour les duplicatas
          prefered: originalAuction.auctions_sellers?.find((seller) => seller.time_per_round)
            ? true
            : false
        },

        // Fournisseurs depuis auctions_sellers
        suppliers: data.auctions[0].auctions_sellers.map((seller) => ({
          email: seller.seller_email,
          company_name: seller.company_name || seller.seller_email
        })),

        // Lots convertis
        lots: lots,

        // Règle de timing (serial, parallel, staggered)
        timingRule: timingRule,

        // Suivre le type original pour détecter les changements
        originalType: originalAuction.type
      }

      // Stocker dans sessionStorage (persiste lors du refresh)
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(builderState))

      // Naviguer vers le builder avec mode=duplicate
      router.push('/builder?mode=duplicate')
    } catch (err) {
      error.value = err.message
      console.error(
        '[useDuplicateAuctionState] Erreur lors de la préparation de la duplication:',
        err
      )
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Récupérer l'état de duplication depuis sessionStorage
   * @returns {object|null} État du builder ou null si absent
   */
  const getDuplicateState = () => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const state = JSON.parse(stored)
      console.log('[useDuplicateAuctionState] État de duplication chargé:', {
        name: state.basics?.name,
        type: state.basics?.type,
        lotCount: state.lots?.length,
        supplierCount: state.suppliers?.length
      })

      return state
    } catch (err) {
      console.error("[useDuplicateAuctionState] Erreur lors de la lecture de l'état:", err)
      return null
    }
  }

  /**
   * Nettoyer l'état de duplication (appelé après sauvegarde ou navigation)
   */
  const clearDuplicateState = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
      console.log('[useDuplicateAuctionState] État de duplication nettoyé')
    } catch (err) {
      console.error("[useDuplicateAuctionState] Erreur lors du nettoyage de l'état:", err)
    }
  }

  return {
    prepareDuplication,
    getDuplicateState,
    clearDuplicateState,
    isLoading,
    error
  }
}
