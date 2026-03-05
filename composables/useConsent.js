const consentKey = 'ga-consent'
const consentValue = ref(localStorage.getItem(consentKey))

export default function () {
  const gaConsent = computed(() => {
    return consentValue.value === 'true'
  })

  function setConsent(val) {
    localStorage.setItem(consentKey, val)
    consentValue.value = localStorage.getItem(consentKey)
  }

  return { setConsent, consentValue, gaConsent }
}
