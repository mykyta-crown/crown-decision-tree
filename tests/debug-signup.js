import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const testEmail = `e2e-test-${Date.now()}-${Math.floor(Math.random() * 1000)}@gmail.com`
const testPassword = 'TestPass123!@#'

console.log('Testing signup with:')
console.log('Email:', testEmail)
console.log('Password:', testPassword)
console.log('')

const { data, error } = await supabase.auth.signUp({
  email: testEmail,
  password: testPassword,
  options: {
    emailRedirectTo: 'https://www.crown.ovh/auth/profile'
  }
})

if (error) {
  console.error('❌ Signup failed:')
  console.error('Error message:', error.message)
  console.error('Error code:', error.code)
  console.error('Error status:', error.status)
  console.error('Full error:', JSON.stringify(error, null, 2))
} else {
  console.log('✅ Signup succeeded!')
  console.log('User ID:', data.user?.id)
  console.log('User email:', data.user?.email)
  console.log('Email confirmed:', data.user?.email_confirmed_at)
}
