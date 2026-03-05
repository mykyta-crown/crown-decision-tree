const commercials_files = ref(null)

export default async function (auctionId) {
  const supabase = useSupabaseClient()
  const route = useRoute()

  const { data: filesFolder } = await supabase.storage
    .from('commercials_docs')
    .list(`${route.params.auctionGroupId}/${auctionId}`)

  commercials_files.value = await Promise.all(
    filesFolder.map(async (file) => {
      const { data } = await supabase.storage
        .from('commercials_docs')
        .getPublicUrl(`${route.params.auctionGroupId}/${auctionId}/${file.name}`)
      // console.log('DATA file retrieved', data)
      return {
        name: file.name,
        size: file.metadata.size,
        updated_at: file.updated_at,
        type: file.metadata.mimetype,
        url: data.publicUrl
      }
    })
  )

  // console.log('commercials_files', commercials_files.value)

  return { commercials_files }
}
