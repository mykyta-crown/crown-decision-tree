import { watch } from 'vue'
import useConsent from '../composables/useConsent'

export default defineNuxtPlugin(() => {
  const { gaConsent } = useConsent()

  function enableGa() {
    if (gaConsent.value) {
      useScriptGoogleAnalytics({
        id: 'G-W7VRCJ37RS'
      })
    }
  }

  watch(gaConsent, () => {
    enableGa()
  })

  enableGa()
})
