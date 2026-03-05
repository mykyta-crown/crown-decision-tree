# Crown Scripts

Collection d'utilitaires pour gérer les enchères, utilisateurs, et tâches Cloud Tasks.

## 📚 Documentation complète

- **[docs/SCRIPTS.md](../docs/SCRIPTS.md)** - Liste complète de tous les scripts disponibles
- **[docs/ENVIRONMENTS.md](../docs/ENVIRONMENTS.md)** - Gestion des environnements (local vs production)

## 🚀 Quick Start

### 1. Configuration initiale

```bash
# Créer le fichier d'environnement local
cp .env .env.local

# Télécharger les variables de production
vercel login
vercel env pull .env.production --environment=production --yes

# S'authentifier avec Google Cloud (pour Cloud Tasks)
gcloud auth application-default login
```

### 2. Exécuter un script

**Méthode la plus simple** - Utilisez les flags d'environnement :

```bash
# Avec le wrapper run.js
node scripts/run.js <script-name> [...args] [--production|--local]

# Ou avec npm scripts
npm run script <script-name> -- --production
npm run script:prod <script-name>  # Raccourci production
npm run script:local <script-name> # Raccourci local

# Exemples concrets
node scripts/run.js technical_test_auction.js <auction_id> --production
node scripts/run.js cleanup_orphan_japanese_tasks.js --local
npm run script:prod update_user_password.js user@example.com newPass123
```

**Tous les scripts existants fonctionnent sans modification !**

## 🛠️ Scripts les plus utilisés

### Diagnostic et santé

```bash
# Vérifier la santé d'un groupe d'enchères
npm run script:prod technical_test_auction.js <auction_group_id>

# Nettoyer les tâches orphelines (Japanese auctions)
node scripts/run.js cleanup_orphan_japanese_tasks.js --production
node scripts/run.js cleanup_orphan_japanese_tasks.js --production --delete
```

### Gestion des enchères

```bash
# Démarrer une enchère immédiatement
npm run script:local start_auction_now.js <auction_id>

# Forcer la fin d'une enchère
node scripts/run.js forceAuctionEnd.js <auction_id> --local

# Inspecter une enchère
npm run script:local inspect_auction.js <auction_id>
```

### Gestion des utilisateurs

```bash
# Ajouter des crédits
node scripts/run.js addCredits.js user@example.com 1000 --local

# Mettre à jour un mot de passe
npm run script:local update_user_password.js user@example.com newPassword
```

## ⚠️ Bonnes pratiques

### ✅ À faire

- **Utiliser `run.js` ou npm scripts** avec les flags `--production` / `--local`
- **Tester d'abord en local** avant d'exécuter en production
- **Vérifier l'environnement actif** (affiché automatiquement)

```bash
# ✅ Bon
node scripts/run.js cleanup_orphan_japanese_tasks.js --production
npm run script:prod technical_test_auction.js <id>
```

### ❌ À éviter

- **Ne pas exécuter directement** sans le wrapper ou flags :
  ```bash
  # ❌ Mauvais - utilise .env par défaut
  node scripts/cleanup_orphan_japanese_tasks.js
  ```
- **Ne pas modifier** `.env.production` manuellement
- **Ne pas commiter** les fichiers `.env.*`

### 🔒 Sécurité - Création de scripts

**⚠️ RÈGLE CRITIQUE : Jamais de clés en dur !**

```javascript
// ❌ INTERDIT - Clés en dur
const API_KEY = 'sk-1234567890'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1...'

// ✅ OBLIGATOIRE - Variables d'environnement
const API_KEY = process.env.OPENROUTER_API_KEY
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
```

**Pourquoi ?**

- Évite de commiter des secrets dans Git
- Sécurise les credentials
- Facilite la rotation des clés

## 📖 Structure de la documentation

```
docs/
├── SCRIPTS.md        # Liste complète des scripts
├── ENVIRONMENTS.md   # Gestion des environnements
├── API.md            # Documentation des API
├── DATABASE.md       # Schéma de la base de données
└── ...

scripts/
├── run-with-env.js   # Wrapper pour choisir l'environnement
├── cleanup_orphan_japanese_tasks.js
├── technical_test_auction.js
├── update_user_password.js
└── ...
```

## 🆘 Besoin d'aide ?

1. Consultez **[docs/SCRIPTS.md](../docs/SCRIPTS.md)** pour la liste complète
2. Consultez **[docs/ENVIRONMENTS.md](../docs/ENVIRONMENTS.md)** pour les problèmes d'environnement
3. Vérifiez que vous êtes authentifié :
   ```bash
   gcloud auth application-default login
   vercel login
   ```
