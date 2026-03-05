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
const auctionId = '48e90a66-20b4-4d15-bf82-7bee6eb3a63a'

const headers = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json'
}

async function run() {
  try {
    // Get auction sellers
    const sellersRes = await fetch(
      `${supabaseUrl}/rest/v1/auctions_sellers?auction_id=eq.${auctionId}&select=*`,
      { headers }
    )
    const sellers = await sellersRes.json()

    console.log('Registered sellers for this auction:')
    sellers.forEach((s) => console.log(' -', s.seller_email))

    // Get all bids for this auction
    const bidsRes = await fetch(
      `${supabaseUrl}/rest/v1/bids?auction_id=eq.${auctionId}&select=id,seller_id,created_at`,
      { headers }
    )
    const bids = await bidsRes.json()

    console.log('\nBids in auction:', bids.length)

    // Get profiles for bid owners
    const sellerIds = [...new Set(bids.map((b) => b.seller_id))]
    const profilesRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?select=id,email&id=in.(${sellerIds.join(',')})`,
      { headers }
    )
    const profiles = await profilesRes.json()

    console.log('\nBid owners:')
    profiles.forEach((p) => {
      const bidCount = bids.filter((b) => b.seller_id === p.id).length
      const isRegistered = sellers.some((s) => s.seller_email === p.email)
      console.log(` - ${p.email} (${bidCount} bids) ${!isRegistered ? '⚠️ NOT REGISTERED' : '✓'}`)
    })
  } catch (err) {
    console.error('Error:', err)
  }
}

run()
