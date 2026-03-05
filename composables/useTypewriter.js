/**
 * Composable useTypewriter
 * Effet typewriter pour afficher progressivement du texte
 *
 * Usage:
 * const { displayedText, isTyping, start, stop, reset } = useTypewriter(textRef, speed)
 */

import { ref, watch, onUnmounted } from 'vue'

export const useTypewriter = (text, speed = 20) => {
  const displayedText = ref('')
  const isTyping = ref(false)
  const currentIndex = ref(0)
  const intervalId = ref(null)

  /**
   * Démarre l'animation typewriter
   */
  const start = (targetText) => {
    // Réinitialiser si on démarre une nouvelle animation
    stop()
    currentIndex.value = 0
    displayedText.value = ''
    isTyping.value = true

    if (!targetText || targetText.length === 0) {
      isTyping.value = false
      return
    }

    // Animer caractère par caractère
    intervalId.value = setInterval(() => {
      if (currentIndex.value < targetText.length) {
        displayedText.value += targetText[currentIndex.value]
        currentIndex.value++
      } else {
        // Animation terminée
        isTyping.value = false
        stop()
      }
    }, speed)
  }

  /**
   * Arrête l'animation
   */
  const stop = () => {
    if (intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
  }

  /**
   * Réinitialise l'animation
   */
  const reset = () => {
    stop()
    displayedText.value = ''
    currentIndex.value = 0
    isTyping.value = false
  }

  /**
   * Affiche instantanément tout le texte (skip animation)
   */
  const complete = (targetText) => {
    stop()
    displayedText.value = targetText
    currentIndex.value = targetText.length
    isTyping.value = false
  }

  /**
   * Watch le texte source pour démarrer automatiquement l'animation
   * Ignore les updates si le texte est identique (évite les re-animations inutiles)
   */
  watch(
    () => (typeof text === 'function' ? text() : text.value),
    (newText) => {
      // Si le nouveau texte commence par l'ancien (update progressive du streaming),
      // continuer l'animation depuis là où on en était
      if (newText && newText.startsWith(displayedText.value)) {
        // C'est un update progressif, pas besoin de recommencer
        if (displayedText.value !== newText) {
          // Mettre à jour le texte cible et continuer l'animation
          const remainingText = newText.slice(displayedText.value.length)
          if (remainingText && !isTyping.value) {
            // Reprendre l'animation pour le reste
            isTyping.value = true
            let index = 0
            intervalId.value = setInterval(() => {
              if (index < remainingText.length) {
                displayedText.value += remainingText[index]
                index++
              } else {
                isTyping.value = false
                stop()
              }
            }, speed)
          }
        }
      } else {
        // Nouveau texte complètement différent, recommencer l'animation
        start(newText)
      }
    },
    { immediate: true }
  )

  /**
   * Nettoyer l'interval au démontage
   */
  onUnmounted(() => {
    stop()
  })

  return {
    displayedText,
    isTyping,
    start,
    stop,
    reset,
    complete
  }
}
