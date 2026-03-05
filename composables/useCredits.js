/**
 * Composable: useCredits
 * Gestion des crédits utilisateur avec updates temps réel
 */

export const useCredits = () => {
  const supabase = useSupabaseClient()
  const user = ref(null)

  const creditsRemaining = ref(0)
  const creditsTotal = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const realtimeChannel = ref(null)

  // Récupérer le user directement depuis Supabase auth
  supabase.auth.getUser().then(({ data }) => {
    user.value = data.user
    console.log('[useCredits] User loaded from auth:', user.value?.id)

    // Setup listener dès que user est disponible
    if (user.value?.id) {
      fetchBalance()
      listenToCredits()
    }
  })

  // Écouter les changements d'auth state
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('[useCredits] Auth state changed:', event)
    const newUser = session?.user || null

    if (newUser?.id !== user.value?.id) {
      user.value = newUser

      if (newUser?.id) {
        fetchBalance()
        listenToCredits()
      } else {
        stopListening()
        creditsRemaining.value = 0
        creditsTotal.value = 0
      }
    }
  })

  /**
   * Récupérer le solde de crédits
   */
  const fetchBalance = async () => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch('/api/credits/balance')

      if (data) {
        creditsRemaining.value = data.credits_remaining
        creditsTotal.value = data.credits_total
      }

      return data
    } catch (err) {
      error.value = err.data?.message || 'Failed to fetch credits'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Ajouter des crédits (admin seulement)
   */
  const addCredits = async (userId, amount) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch('/api/credits/add', {
        method: 'POST',
        body: { user_id: userId, amount }
      })

      // Si c'est l'utilisateur courant, mettre à jour localement
      if (userId === user.value?.id && data) {
        creditsRemaining.value = data.credits_remaining
        creditsTotal.value = data.credits_total
      }

      return data
    } catch (err) {
      error.value = err.data?.message || 'Failed to add credits'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Vérifier si l'utilisateur a assez de crédits
   */
  const hasEnoughCredits = computed(() => creditsRemaining.value > 0)

  /**
   * Calculer le pourcentage de crédits restants
   */
  const creditsPercentage = computed(() => {
    if (creditsTotal.value === 0) return 0
    return Math.round((creditsRemaining.value / creditsTotal.value) * 100)
  })

  /**
   * Statut des crédits (pour affichage)
   */
  const creditsStatus = computed(() => {
    if (creditsRemaining.value === 0) return 'empty'
    if (creditsRemaining.value < creditsTotal.value * 0.2) return 'low'
    return 'ok'
  })

  /**
   * Setup Supabase Realtime listener pour les crédits
   * Écoute les updates de crédits en temps réel
   */
  const listenToCredits = () => {
    // Si pas d'utilisateur, pas besoin d'écouter les crédits
    if (!user.value?.id) {
      console.log('[useCredits] No user, skipping credits listener')
      return
    }

    console.log('[useCredits] Setting up credits listener for user:', user.value.id)

    // Nettoyer l'ancienne subscription si elle existe
    if (realtimeChannel.value) {
      console.log('[useCredits] Cleaning up old subscription')
      realtimeChannel.value.unsubscribe()
    }

    // Créer un nouveau channel Realtime
    realtimeChannel.value = supabase
      .channel(`user-credits-${user.value.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${user.value.id}`
        },
        (payload) => {
          console.log('[useCredits] 💰 Credits Realtime event:', payload.eventType, payload.new)

          if (payload.new) {
            creditsRemaining.value = payload.new.credits_remaining
            creditsTotal.value = payload.new.credits_total
          }
        }
      )
      .subscribe((status) => {
        console.log('[useCredits] Realtime subscription status:', status)
      })

    return realtimeChannel.value
  }

  /**
   * Arrêter d'écouter les updates Realtime
   */
  const stopListening = () => {
    if (realtimeChannel.value) {
      realtimeChannel.value.unsubscribe()
      realtimeChannel.value = null
    }
  }

  /**
   * Nettoyer lors de la destruction
   */
  onUnmounted(() => {
    stopListening()
  })

  return {
    // State
    creditsRemaining,
    creditsTotal,
    loading,
    error,

    // Computed
    hasEnoughCredits,
    creditsPercentage,
    creditsStatus,

    // Methods
    fetchBalance,
    addCredits,
    listenToCredits,
    stopListening
  }
}
