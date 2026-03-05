/**
 * Composable: useDocuments
 * Gestion des documents attachés aux conversations
 */

export const useDocuments = () => {
  const supabase = useSupabaseClient()
  const documents = ref([])
  const loading = ref(false)
  const uploading = ref(false)
  const error = ref(null)
  const uploadProgress = ref(0)

  /**
   * Récupérer les documents d'une conversation
   */
  const fetchDocuments = async (conversationId) => {
    if (!conversationId) return

    loading.value = true
    error.value = null

    try {
      const { documents: docs, total_tokens } = await $fetch(
        `/api/conversations/${conversationId}/documents/list`
      )
      documents.value = docs || []
      return { documents: docs, total_tokens }
    } catch (err) {
      error.value = err.data?.message || 'Failed to fetch documents'
      console.error('Error fetching documents:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Upload un document vers une conversation
   */
  const uploadDocument = async (conversationId, file) => {
    if (!conversationId || !file) {
      throw new Error('Conversation ID and file are required')
    }

    uploading.value = true
    uploadProgress.value = 0
    error.value = null

    try {
      // Créer le FormData
      const formData = new FormData()
      formData.append('file', file)

      // Simuler la progression (car $fetch ne supporte pas onUploadProgress directement)
      const progressInterval = setInterval(() => {
        if (uploadProgress.value < 90) {
          uploadProgress.value += 10
        }
      }, 200)

      // Upload
      const { document } = await $fetch(`/api/conversations/${conversationId}/documents/upload`, {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      uploadProgress.value = 100

      // Ajouter le document à la liste locale
      if (document) {
        documents.value.push(document)
      }

      return document
    } catch (err) {
      error.value = err.data?.message || 'Failed to upload document'
      console.error('Error uploading document:', err)
      throw err
    } finally {
      uploading.value = false
      // Reset progress après 1 seconde
      setTimeout(() => {
        uploadProgress.value = 0
      }, 1000)
    }
  }

  /**
   * Supprimer un document
   */
  const deleteDocument = async (conversationId, docId) => {
    if (!conversationId || !docId) {
      throw new Error('Conversation ID and document ID are required')
    }

    loading.value = true
    error.value = null

    try {
      await $fetch(`/api/conversations/${conversationId}/documents/${docId}`, { method: 'DELETE' })

      // Retirer le document de la liste locale
      documents.value = documents.value.filter((doc) => doc.id !== docId)

      return true
    } catch (err) {
      error.value = err.data?.message || 'Failed to delete document'
      console.error('Error deleting document:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Valider un fichier avant upload
   */
  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!file) {
      return { valid: false, error: 'No file provided' }
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File too large. Maximum size is 10MB' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only PDF and DOCX files are supported' }
    }

    return { valid: true }
  }

  /**
   * Formater la taille du fichier pour l'affichage
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * Obtenir l'icône pour un type de fichier
   */
  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') {
      return 'mdi-file-pdf-box'
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return 'mdi-file-word-box'
    }
    return 'mdi-file-document'
  }

  /**
   * Calculer le total des tokens estimés pour tous les documents
   */
  const totalEstimatedTokens = computed(() => {
    return documents.value.reduce((sum, doc) => sum + (doc.estimated_tokens || 0), 0)
  })

  /**
   * Calculer le total des mots pour tous les documents
   */
  const totalWordCount = computed(() => {
    return documents.value.reduce((sum, doc) => sum + (doc.word_count || 0), 0)
  })

  /**
   * Réinitialiser l'état
   */
  const reset = () => {
    documents.value = []
    loading.value = false
    uploading.value = false
    error.value = null
    uploadProgress.value = 0
  }

  return {
    // State
    documents,
    loading,
    uploading,
    error,
    uploadProgress,
    totalEstimatedTokens,
    totalWordCount,

    // Actions
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    validateFile,
    reset,

    // Helpers
    formatFileSize,
    getFileIcon
  }
}
