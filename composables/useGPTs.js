/**
 * Composable: useGPTs
 * Gestion des GPTs (AI Assistants)
 */

export const useGPTs = () => {
  const gpts = ref([])
  const currentGPT = ref(null)
  const loading = ref(false)
  const error = ref(null)

  /**
   * Créer un nouveau GPT (admin seulement)
   */
  const createGPT = async (gptData) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch('/api/gpts/create', {
        method: 'POST',
        body: gptData
      })

      if (data) {
        gpts.value.unshift(data)
        return data
      }
    } catch (err) {
      error.value = err.data?.message || 'Failed to create GPT'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupérer la liste des GPTs accessibles
   */
  const fetchGPTs = async () => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch('/api/gpts/list')
      gpts.value = data || []
      return data
    } catch (err) {
      error.value = err.data?.message || 'Failed to fetch GPTs'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupérer un GPT par son ID
   */
  const fetchGPTById = async (id) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch(`/api/gpts/${id}`)
      currentGPT.value = data
      return data
    } catch (err) {
      error.value = err.data?.message || 'Failed to fetch GPT'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Mettre à jour un GPT (admin seulement)
   */
  const updateGPT = async (id, updates) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch(`/api/gpts/${id}`, {
        method: 'PATCH',
        body: updates
      })

      if (data) {
        // Mettre à jour dans la liste locale
        const index = gpts.value.findIndex((g) => g.id === id)
        if (index !== -1) {
          gpts.value[index] = data
        }
        if (currentGPT.value?.id === id) {
          currentGPT.value = data
        }
        return data
      }
    } catch (err) {
      error.value = err.data?.message || 'Failed to update GPT'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Supprimer un GPT (admin seulement)
   */
  const deleteGPT = async (id) => {
    loading.value = true
    error.value = null

    try {
      await $fetch(`/api/gpts/${id}`, {
        method: 'DELETE'
      })

      // Supprimer de la liste locale
      gpts.value = gpts.value.filter((g) => g.id !== id)
      if (currentGPT.value?.id === id) {
        currentGPT.value = null
      }
    } catch (err) {
      error.value = err.data?.message || 'Failed to delete GPT'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Assigner des utilisateurs à un GPT (admin seulement)
   */
  const assignUsers = async (gptId, userIds = [], companyIds = []) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch('/api/gpts/assign-users', {
        method: 'POST',
        body: {
          gpt_id: gptId,
          user_ids: userIds,
          company_ids: companyIds
        }
      })

      return data
    } catch (err) {
      error.value = err.data?.message || 'Failed to assign users'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Rechercher/filtrer les GPTs localement
   */
  const searchGPTs = (query) => {
    if (!query) return gpts.value

    const lowerQuery = query.toLowerCase()
    return gpts.value.filter(
      (gpt) =>
        gpt.name.toLowerCase().includes(lowerQuery) ||
        gpt.description?.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Filtrer par provider
   */
  const filterByProvider = (provider) => {
    if (!provider) return gpts.value
    return gpts.value.filter((gpt) => gpt.provider === provider)
  }

  return {
    // State
    gpts,
    currentGPT,
    loading,
    error,

    // Methods
    createGPT,
    fetchGPTs,
    fetchGPTById,
    updateGPT,
    deleteGPT,
    assignUsers,
    searchGPTs,
    filterByProvider
  }
}
