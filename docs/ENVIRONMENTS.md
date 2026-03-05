# Environment Management

Ce document explique comment gérer les différents environnements (local vs production) pour les scripts et tests.

## Structure des fichiers d'environnement

```
.env              # Environnement actif (par défaut local)
.env.local        # Variables pour le développement local
.env.production   # Variables pour la production (téléchargées depuis Vercel)
.env.preview      # Variables pour l'environnement de preview (optionnel)
```

## Configuration initiale

### 1. Créer le fichier local

```bash
# Copier votre .env actuel vers .env.local
cp .env .env.local
```

### 2. Télécharger les variables de production

```bash
# Se connecter à Vercel (si pas déjà fait)
vercel login

# Télécharger les variables de production
vercel env pull .env.production --environment=production --yes

# Optionnel : télécharger les variables de preview
vercel env pull .env.preview --environment=preview --yes
```

### 3. Authentification Google Cloud (pour Cloud Tasks)

```bash
# S'authentifier avec Google Cloud pour accéder aux Cloud Tasks en local
gcloud auth application-default login

# Vérifier que vous êtes bien authentifié sur le bon projet
gcloud config get-value project
# Devrait afficher : crown-476614

# Si besoin, définir le projet
gcloud config set project crown-476614
```

## Utilisation

### Méthode 1 : Wrapper universel `run.js` (Recommandé)

**Tous les scripts existants** peuvent utiliser les flags d'environnement sans modification :

```bash
# Syntaxe
node scripts/run.js <script-name> [...args] [--production|--local]

# Exemples
node scripts/run.js cleanup_orphan_japanese_tasks.js --production
node scripts/run.js cleanup_orphan_japanese_tasks.js --production --delete
node scripts/run.js technical_test_auction.js <auction_id> --local
node scripts/run.js update_user_password.js user@test.com newPass --prod
```

**Flags disponibles :**

- `--production` ou `--prod` → charge `.env.production`
- `--local`, `--dev` ou `--development` → charge `.env.local`
- Aucun flag → charge `.env` (par défaut)

### Méthode 2 : Scripts npm (Encore plus simple)

```bash
# Avec flag explicite
npm run script <script-name> -- --production
npm run script <script-name> -- --local

# Raccourcis
npm run script:prod <script-name>   # Toujours en production
npm run script:local <script-name>  # Toujours en local

# Exemples
npm run script cleanup_orphan_japanese_tasks.js -- --production
npm run script:prod cleanup_orphan_japanese_tasks.js
npm run script:local technical_test_auction.js <auction_id>
```

### Le wrapper affiche automatiquement :

```
🌍 Environment: PRODUCTION
📄 Loaded: .env.production
🚀 Running: cleanup_orphan_japanese_tasks.js
```

### Méthode 3 : Import direct dans le script (Pour nouveaux scripts)

Pour les nouveaux scripts, vous pouvez importer directement le loader :

```javascript
#!/usr/bin/env node
import './lib/load-env.js' // Charge automatiquement selon les flags CLI

// Reste du script...
```

Puis l'utiliser avec :

```bash
node scripts/my-new-script.js --production
```

## Différences entre environnements

| Variable                    | Local (.env.local)          | Production (.env.production) |
| --------------------------- | --------------------------- | ---------------------------- |
| `SUPABASE_URL`              | DEV: `qzxnlhzlilysiklmbspn` | PROD: `jgwbqdpxygwsnswtnrxf` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé DEV                     | Clé PROD                     |
| `PG_URL`                    | Base DEV                    | Base PROD                    |
| Google Cloud Credentials    | Partagées (via gcloud)      | Partagées (via gcloud)       |

## Scripts disponibles

### Diagnostic et nettoyage

**`cleanup_orphan_japanese_tasks.js`** - Nettoie les tâches Cloud Tasks orphelines

```bash
# Analyser les tâches orphelines (sans supprimer)
node scripts/run-with-env.js production cleanup_orphan_japanese_tasks.js

# Supprimer les tâches orphelines
node scripts/run-with-env.js production cleanup_orphan_japanese_tasks.js --delete
```

**Sortie exemple :**

```
📊 Found 20 tasks in queue
📊 Found 435 Japanese auctions in database
📅 Tasks scheduled for December 30th: 20
🚨 Orphan tasks (no matching auction): 0
```

**`technical_test_auction.js`** - Test technique complet d'un groupe d'enchères

```bash
node scripts/run-with-env.js production technical_test_auction.js <auction_group_id>
```

### Gestion des utilisateurs

**`update_user_password.js`** - Met à jour le mot de passe d'un utilisateur

```bash
node scripts/run-with-env.js local update_user_password.js user@example.com newPassword
```

## Bonnes pratiques

### Exécution des scripts

1. **Toujours utiliser `run.js`** pour exécuter des scripts
2. **Tester d'abord en local** avant d'exécuter en production
3. **Ne jamais commiter** les fichiers `.env.*` (déjà dans `.gitignore`)
4. **Rafraîchir `.env.production`** régulièrement si les variables changent sur Vercel

### 🔒 Sécurité - Création de scripts

**⚠️ RÈGLE CRITIQUE : Ne JAMAIS écrire de clés en dur dans les scripts**

**❌ Interdit :**

```javascript
// ❌ JAMAIS DE CLÉS EN DUR
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
const API_KEY = 'sk-1234567890abcdef'
const DATABASE_PASSWORD = 'monMotDePasse123'
```

**✅ Toujours utiliser les variables d'environnement :**

```javascript
// ✅ BON - Variables d'environnement
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const API_KEY = process.env.OPENROUTER_API_KEY
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD

// Validation
if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
```

**Pourquoi ?**

- Évite de commiter des secrets dans Git
- Permet de changer les clés sans modifier le code
- Sécurise les credentials sensibles
- Facilite le travail en équipe

### ❌ À éviter

1. **Ne pas exécuter directement** les scripts avec `node scripts/xxx.js`
2. **Ne pas modifier** `.env.production` manuellement (utiliser Vercel UI)
3. **Ne pas partager** les fichiers `.env.*` (ils contiennent des secrets)

## Mettre à jour les variables de production

Si vous avez modifié des variables d'environnement sur Vercel :

```bash
# Re-télécharger les variables
vercel env pull .env.production --environment=production --yes

# Les nouveaux scripts utiliseront automatiquement les nouvelles valeurs
node scripts/run-with-env.js production <script>
```

## Troubleshooting

### Erreur : "Environment file not found"

```bash
# Pour production
vercel env pull .env.production --environment=production --yes

# Pour local
cp .env .env.local
```

### Erreur : "invalid_grant" ou "reauth related error"

Authentifiez-vous avec Google Cloud :

```bash
gcloud auth application-default login
```

### Erreur : "The specified token is not valid"

Reconnectez-vous à Vercel :

```bash
vercel login
```

### Script utilise les mauvaises variables

Vérifiez que vous utilisez le wrapper ou les flags :

```bash
# ❌ Mauvais - utilise .env par défaut
node scripts/cleanup_orphan_japanese_tasks.js

# ✅ Bon - utilise le wrapper avec flag
node scripts/run.js cleanup_orphan_japanese_tasks.js --production

# ✅ Bon - utilise npm script
npm run script:prod cleanup_orphan_japanese_tasks.js
```

## Ajouter un nouveau script

Si vous créez un nouveau script, assurez-vous qu'il :

1. **Charge dotenv** : `import 'dotenv/config'` en haut du fichier
2. **Utilise les variables standards** : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.
3. **Est documenté** dans `docs/SCRIPTS.md`

Exemple :

```javascript
#!/usr/bin/env node
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jgwbqdpxygwsnswtnrxf.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Votre logique ici...
```

## Sécurité

- Les fichiers `.env.*` sont dans `.gitignore` - **ne les commitez jamais**
- Les credentials Google Cloud sont stockés dans `~/.config/gcloud/` - **ne les partagez jamais**
- Utilisez toujours des clés de service (service role keys) pour les scripts, jamais des clés anonymes (anon keys)
