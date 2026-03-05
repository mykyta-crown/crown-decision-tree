/**
 * Utilitaire centralisé pour charger les variables d'environnement
 *
 * Usage dans un script:
 *   import { loadEnv } from './lib/env-loader.js'
 *   loadEnv() // charge .env.local par défaut
 *
 * Avec flag --prod:
 *   node script.js --prod
 *   // Charge automatiquement .env.production
 */

import { config } from 'dotenv'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '../..')

/**
 * Charge les variables d'environnement selon les arguments CLI
 * @param {Object} options - Options de configuration
 * @param {string} options.defaultEnv - Fichier .env par défaut (défaut: '.env.local')
 * @param {string} options.prodEnv - Fichier .env de production (défaut: '.env.production')
 * @returns {Object} Configuration chargée
 */
export function loadEnv(options = {}) {
  const { defaultEnv = '.env.local', prodEnv = '.env.production' } = options

  // Détecter si --prod ou --production est dans les arguments
  const isProd = process.argv.includes('--prod') || process.argv.includes('--production')

  // Choisir le bon fichier .env
  const envFile = isProd ? prodEnv : defaultEnv
  const envPath = join(rootDir, envFile)

  // Vérifier que le fichier existe
  if (!existsSync(envPath)) {
    console.error(`❌ Fichier d'environnement introuvable: ${envFile}`)
    console.error(`   Chemin attendu: ${envPath}`)
    console.error('')
    console.error('Fichiers .env disponibles:')
    const envFiles = ['.env', '.env.local', '.env.prod', '.env.production', '.env.test']
    envFiles.forEach((f) => {
      const path = join(rootDir, f)
      console.error(`   ${existsSync(path) ? '✅' : '❌'} ${f}`)
    })
    process.exit(1)
  }

  // Charger le fichier
  const result = config({ path: envPath })

  if (result.error) {
    console.error(`❌ Erreur lors du chargement de ${envFile}:`, result.error.message)
    process.exit(1)
  }

  // Afficher l'environnement chargé
  const envLabel = isProd ? '🔴 PRODUCTION' : '🟢 LOCAL/DEV'
  console.log(`${envLabel} - Chargé depuis: ${envFile}\n`)

  return {
    isProd,
    envFile,
    envPath
  }
}

/**
 * Valide que les variables d'environnement requises sont présentes
 * @param {string[]} requiredVars - Liste des variables requises
 */
export function validateEnv(requiredVars) {
  const missing = []

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }

  if (missing.length > 0) {
    console.error("❌ Variables d'environnement manquantes:")
    missing.forEach((varName) => {
      console.error(`   ✗ ${varName}`)
    })
    console.error('')
    process.exit(1)
  }

  console.log("✅ Variables d'environnement validées\n")
}

/**
 * Affiche les variables d'environnement (masque les valeurs sensibles)
 * @param {string[]} vars - Liste des variables à afficher
 */
export function displayEnv(vars) {
  console.log('📋 Configuration:')
  vars.forEach((varName) => {
    const value = process.env[varName]
    if (!value) {
      console.log(`   ${varName}: ❌ Non défini`)
    } else if (varName.includes('KEY') || varName.includes('SECRET') || varName.includes('TOKEN')) {
      // Masquer les valeurs sensibles
      console.log(`   ${varName}: ${value.substring(0, 8)}...${value.substring(value.length - 4)}`)
    } else {
      console.log(`   ${varName}: ${value}`)
    }
  })
  console.log('')
}
