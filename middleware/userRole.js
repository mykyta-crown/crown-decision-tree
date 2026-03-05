export default defineNuxtRouteMiddleware(async () => {
  const { getSession, isAdmin, isBuyer } = useUser()
  await getSession()

  if (isAdmin.value || isBuyer.value) {
    return
  } else {
    // console.log('not admin or not buyer')
    return navigateTo('/home')
  }
})
