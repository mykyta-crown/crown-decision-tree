const group = ref(null)
const currentGroupId = ref(null)

export default async function (groupId) {
  const supabase = useSupabaseClient()

  if (groupId && groupId !== currentGroupId.value) {
    currentGroupId.value = groupId

    const { data: fetchedGroup } = await supabase
      .from('auctions_group_settings')
      .select('*')
      .eq('id', groupId)
      .single()
    console.log('fetchedGroup', fetchedGroup)
    group.value = fetchedGroup
  }

  async function upsert(data) {
    const { data: updatedRecords } = await supabase
      .from('auctions_group_settings')
      .upsert(
        Object.assign(data, {
          id: currentGroupId
        })
      )
      .select()

    group.value = updatedRecords[0]
  }

  return { group, upsert }
}
