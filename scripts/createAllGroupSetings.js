import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

async function update() {
  const { data: auctions } = await supabase.from('auctions').select('*')

  for (let index = 0; index < auctions.length; index++) {
    const auction = auctions[index]

    if (!auction.auctions_group_settings_id) {
      const groupData = {
        name: auction.name,
        description: auction.description,
        buyer_id: auction.buyer_id,
        timing_rule: 'serial'
      }

      // console.log(groupData)

      const { data: newGroups, error } = await supabase
        .from('auctions_group_settings')
        .insert([groupData])
        .select()

      console.log(index, auctions.length, error)

      const group = newGroups[0]

      await supabase
        .from('auctions')
        .update({
          auctions_group_settings_id: group.id
        })
        .eq('id', auction.id)
    }
  }
}

update()
