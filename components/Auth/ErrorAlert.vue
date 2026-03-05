<template>
  <v-alert
    v-model="oppened"
    color="error"
    :text="errorsMap[authError] || errorsMap.other"
    closable
  />
</template>

<script setup>
import { ref, watch, toRef } from 'vue'

const props = defineProps({
  authError: {
    type: String,
    default() {
      return ''
    }
  }
})

const oppened = ref(false)

watch(toRef(props, 'authError'), () => {
  oppened.value = true
})

const errorsMap = {
  'User already registered': 'Invalid email or password',
  'Invalid email or password': 'Invalid email or password',
  'Invalid password': 'Invalid password',
  'Invalid login credentials': 'Invalid email or password',
  'Email not confirmed': 'Email not confirmed',
  other: 'An error occured, please try again or contact our support team.'
}
</script>
