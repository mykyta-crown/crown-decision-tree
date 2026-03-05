#!/usr/bin/env node

/**
 * Universal Script Runner with Environment Management
 *
 * This wrapper allows any script to use environment flags without modification.
 *
 * Usage:
 *   node scripts/run.js <script-name> [...args] [--production|--local]
 *
 * Examples:
 *   node scripts/run.js cleanup_orphan_japanese_tasks.js --production
 *   node scripts/run.js technical_test_auction.js <auction_id> --local
 *   node scripts/run.js update_user_password.js user@test.com pass123 --prod
 *
 * Or with npm scripts (see package.json):
 *   npm run script cleanup_orphan_japanese_tasks.js --production
 *   npm run script:prod cleanup_orphan_japanese_tasks.js
 *   npm run script:local technical_test_auction.js <auction_id>
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// Parse arguments
const args = process.argv.slice(2)

if (args.length < 1) {
  console.error('❌ Usage: node scripts/run.js <script-name> [...args] [--production|--local]')
  console.error('')
  console.error('Examples:')
  console.error('  node scripts/run.js cleanup_orphan_japanese_tasks.js --production')
  console.error('  node scripts/run.js technical_test_auction.js <id> --local')
  console.error('  node scripts/run.js update_user_password.js user@test.com pass --prod')
  process.exit(1)
}

// Extract script name and other arguments
const [scriptName, ...scriptArgs] = args

// Detect environment flags
let envFile = '.env' // default
let envName = 'DEFAULT'
const envFlags = [
  '--production',
  '--prod',
  '--preview',
  '--staging',
  '--local',
  '--dev',
  '--development'
]

// Check for environment flags in arguments
if (scriptArgs.some((arg) => ['--production', '--prod'].includes(arg))) {
  envFile = '.env.production'
  envName = 'PRODUCTION'
} else if (scriptArgs.some((arg) => ['--preview', '--staging'].includes(arg))) {
  envFile = '.env.preview'
  envName = 'PREVIEW'
} else if (scriptArgs.some((arg) => ['--local', '--dev', '--development'].includes(arg))) {
  envFile = '.env.local'
  envName = 'LOCAL'
}

const envPath = join(rootDir, envFile)

// Check if the environment file exists
if (!fs.existsSync(envPath)) {
  console.error(`\n❌ Environment file not found: ${envFile}`)
  console.error('')

  if (envFile === '.env.production') {
    console.error('💡 To download production environment variables:')
    console.error('   vercel env pull .env.production --environment=production --yes')
  } else if (envFile === '.env.local') {
    console.error('💡 To create local environment file:')
    console.error('   cp .env .env.local')
  } else {
    console.error('💡 Make sure you have a .env file in the project root')
  }

  console.error('')
  process.exit(1)
}

// Build script path
const scriptPath = scriptName.startsWith('/') ? scriptName : join(__dirname, scriptName)

// Check if script exists
if (!fs.existsSync(scriptPath)) {
  console.error(`\n❌ Script not found: ${scriptPath}`)
  console.error('')
  console.error('💡 Make sure the script exists in the scripts/ directory')
  console.error(`   Looking for: ${scriptPath}`)
  process.exit(1)
}

// Load environment file
const result = dotenv.config({ path: envPath })

if (result.error) {
  console.error(`\n❌ Error loading ${envFile}:`, result.error.message)
  process.exit(1)
}

// Display environment info (only if not default)
if (envName !== 'DEFAULT') {
  console.log(`🌍 Environment: ${envName}`)
  console.log(`📄 Loaded: ${envFile}`)
}
console.log(`🚀 Running: ${scriptName}`)
console.log('')

// Merge environment variables
const finalEnv = { ...process.env, ...result.parsed }

// Execute the script with the loaded environment
// Pass all arguments except environment flags
const cleanArgs = scriptArgs.filter((arg) => !envFlags.includes(arg))

const child = spawn('node', [scriptPath, ...cleanArgs], {
  cwd: rootDir,
  env: finalEnv,
  stdio: 'inherit'
})

child.on('exit', (code) => {
  process.exit(code || 0)
})

child.on('error', (error) => {
  console.error(`\n❌ Failed to execute script:`, error.message)
  process.exit(1)
})
