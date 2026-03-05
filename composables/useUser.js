import { ref } from 'vue'
import { update as intercomUpdate } from '@intercom/messenger-js-sdk'

let subscribed = false

const user = ref(null)
const profile = ref(null)

const isAdmin = computed(() => {
  return profile.value?.admin
})

const isBuyer = computed(() => {
  return isAdmin.value || profile.value?.role === 'buyer' || profile.value?.role === 'super_buyer'
})

export default function () {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const config = useRuntimeConfig()

  async function setUser(session) {
    // console.log('setUser', session)
    if (session) {
      user.value = session.user

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*, companies(*)')
        .eq('id', user.value.id)
        .single()

      profile.value = profiles

      // console.log('profile', profile.value)

      // Handle case where profile query fails
      if (!profile.value) {
        console.warn('[useUser] Profile query failed for user:', user.value?.id)
        return { user, profile }
      }

      if (profile.value.onboarding_step < 1) {
        router.push('/onboarding')
      }

      // Only update Intercom if enabled via environment variable
      if (config.public.enableIntercom) {
        const intercomToken = await $fetch('/api/v1/intercom', {
          method: 'get',
          query: {
            userId: user.value.id
          }
        })

        // Only update Intercom if company data is available
        if (profile.value.companies) {
          intercomUpdate({
            intercom_user_jwt: intercomToken,
            name: `${profile.value.first_name} ${profile.value.last_name}`,
            user_role: profile.value.role,
            company: {
              id: profile.value.companies.id,
              name: profile.value.companies.name,
              legal_id: profile.value.companies.legal_id,
              phone: profile.value.companies.phone,
              address: profile.value.companies.address
            }
          })
        }
      }
    } else {
      user.value = null
      profile.value = null
    }

    return { user, profile }
  }

  async function getSession(refetch) {
    if (!user.value || refetch) {
      const { data } = await supabase.auth.getSession()
      return setUser(data.session)
    } else {
      return { user, profile }
    }
  }

  if (!subscribed) {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session)
    })

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // router.push('/')
        window.location.href = '/auth/signin'
      } else {
        setUser(session)
      }
    })

    subscribed = true
  }

  return { user, profile, isAdmin, isBuyer, getSession }
}
