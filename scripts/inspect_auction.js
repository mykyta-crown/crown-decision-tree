import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.resolve(__dirname, '../.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envContent.split('\n').forEach((line) => {
  const [key, value] = line.split('=')
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '')
  }
})

const supabaseUrl = envVars.SUPABASE_URL
const supabaseKey = envVars.SUPABASE_ADMIN_KEY
const auctionId = process.argv[2] || '48e90a66-20b4-4d15-bf82-7bee6eb3a63a'

const headers = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json'
}

async function run() {
  try {
    console.log(`\n🔍 Inspecting auction: ${auctionId}\n`)

    // Get auction details
    const auctionRes = await fetch(`${supabaseUrl}/rest/v1/auctions?id=eq.${auctionId}&select=*`, {
      headers
    })
    const auctions = await auctionRes.json()

    if (!auctions || auctions.length === 0) {
      console.log('❌ Auction not found')
      return
    }

    const auction = auctions[0]

    console.log('📊 Auction Details:')
    console.log(`   Name: ${auction.name}`)
    console.log(`   Type: ${auction.type}`)
    console.log(`   Status: ${auction.status}`)
    console.log(`   Rank per line item: ${auction.rank_per_line_item ? '✅ YES' : '❌ NO'}`)
    console.log(`   Group ID: ${auction.auctions_group_settings_id}`)
    console.log(`   Start: ${auction.start_at}`)
    console.log(`   End: ${auction.end_at}`)

    // Get supplies
    const suppliesRes = await fetch(
      `${supabaseUrl}/rest/v1/supplies?auction_id=eq.${auctionId}&select=*`,
      { headers }
    )
    const supplies = await suppliesRes.json()

    console.log(`\n📦 Supplies: ${supplies.length}`)
    supplies.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.name} (quantity: ${s.quantity})`)
    })

    // Get sellers
    const sellersRes = await fetch(
      `${supabaseUrl}/rest/v1/auctions_sellers?auction_id=eq.${auctionId}&select=*`,
      { headers }
    )
    const sellers = await sellersRes.json()

    console.log(`\n👥 Registered sellers: ${sellers.length}`)
    sellers.forEach((s) => console.log(`   - ${s.seller_email}`))

    // Get bids count
    const bidsRes = await fetch(
      `${supabaseUrl}/rest/v1/bids?auction_id=eq.${auctionId}&select=id`,
      { headers }
    )
    const bids = await bidsRes.json()

    console.log(`\n💰 Total bids: ${bids.length}`)

    // URLs
    console.log('\n🔗 URLs:')
    console.log(
      `   Buyer: http://localhost:3000/auctions/${auction.auctions_group_settings_id}/lots/${auctionId}/buyer`
    )
    console.log(
      `   Seller: http://localhost:3000/auctions/${auction.auctions_group_settings_id}/lots/${auctionId}/seller`
    )

    console.log('\n✅ Test checklist for line-item ranking:')
    console.log(`   ${auction.rank_per_line_item ? '✅' : '❌'} rank_per_line_item enabled`)
    console.log(`   ${supplies.length > 1 ? '✅' : '❌'} Multiple supplies (${supplies.length})`)
    console.log(
      `   ${['english', 'reverse', 'sealed-bid'].includes(auction.type) ? '✅' : '❌'} Supported auction type (${auction.type})`
    )
    console.log(`   ${bids.length > 0 ? '✅' : '❌'} Has bids (${bids.length})`)
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

run()
