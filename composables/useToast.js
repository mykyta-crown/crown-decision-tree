/**
 * Composable useToast
 * Gestion des notifications toast/snackbar à l'échelle de l'application
 *
 * Usage:
 * const toast = useToast()
 * toast.success('Operation completed!')
 * toast.error('Something went wrong')
 * toast.warning('Be careful')
 * toast.info('Here is some info')
 */

import { ref } from 'vue'

// État global partagé entre toutes les instances
const toastState = ref({
  visible: false,
  message: '',
  type: 'info',
  duration: 3000,
  action: null, // { label: string, callback: function }
  timeoutId: null
})

export const useToast = () => {
  /**
   * Affiche un toast
   * @param {string|object} messageOrOptions - Le message ou un objet d'options
   * @param {string} type - Le type de toast (success, error, warning, info)
   * @param {number} duration - Durée d'affichage en ms (par défaut 3000)
   */
  const show = (messageOrOptions, type = 'info', duration = 3000) => {
    // Clear any existing timeout
    if (toastState.value.timeoutId) {
      clearTimeout(toastState.value.timeoutId)
    }

    // Support both string and object parameter
    if (typeof messageOrOptions === 'string') {
      toastState.value = {
        visible: true,
        message: messageOrOptions,
        type,
        duration,
        action: null,
        timeoutId: null
      }
    } else {
      const { message, action, timeout = 3000 } = messageOrOptions
      toastState.value = {
        visible: true,
        message,
        type: messageOrOptions.type || type,
        duration: timeout,
        action: action || null,
        timeoutId: null
      }
    }

    // Auto-hide after duration if no action is provided
    if (!toastState.value.action) {
      const timeoutId = setTimeout(() => {
        hide()
      }, toastState.value.duration)
      toastState.value.timeoutId = timeoutId
    }
  }

  /**
   * Masque le toast
   */
  const hide = () => {
    if (toastState.value.timeoutId) {
      clearTimeout(toastState.value.timeoutId)
    }
    toastState.value.visible = false
    toastState.value.action = null
    toastState.value.timeoutId = null
  }

  /**
   * Affiche un toast de succès
   */
  const success = (message, duration) => {
    show(message, 'success', duration)
  }

  /**
   * Affiche un toast d'erreur
   */
  const error = (message, duration) => {
    show(message, 'error', duration)
  }

  /**
   * Affiche un toast d'avertissement
   */
  const warning = (message, duration) => {
    show(message, 'warning', duration)
  }

  /**
   * Affiche un toast d'information
   */
  const info = (message, duration) => {
    show(message, 'info', duration)
  }

  return {
    // État (pour le composant ToastNotification)
    state: toastState,

    // Actions
    show,
    hide,
    success,
    error,
    warning,
    info
  }
}
