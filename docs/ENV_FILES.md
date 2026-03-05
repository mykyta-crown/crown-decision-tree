# Environment Files Setup

## 📁 Clean Structure

Après nettoyage, vous avez maintenant une structure **simple et claire** :

```
.env               # Default fallback (git ignored)
.env.local         # Local development ✅ USE THIS
.env.production    # Production ✅ USE THIS
.env.preview       # Preview/Staging (optional)
.env.example       # Template for onboarding
```

## 🧹 What was cleaned up?

❌ **Removed (redundant):**

- `.env.vercel` - Ancien format Vercel CLI
- `.env.vercel.preview` - Redondant avec `.env.preview`
- `.env.vercel.production` - Redondant avec `.env.production`

✅ **Kept (essential):**

- `.env.local` - Développement local quotidien
- `.env.production` - Scripts de production
- `.env` - Fallback par défaut

## 🚀 Quick Setup

### 1. Local Development

```bash
# Option A: Use existing .env
# .env.local should already exist (copy of .env)

# Option B: Create from example
cp .env.example .env.local
```

### 2. Production Scripts

```bash
# Login to Vercel (once)
vercel login

# Download production environment
vercel env pull .env.production --environment=production --yes
```

### 3. Preview/Staging (Optional)

```bash
# Download preview environment
vercel env pull .env.preview --environment=preview --yes
```

## 🎯 Usage Examples

### Run scripts with specific environment:

```bash
# Production
node scripts/run.js cleanup_orphan_japanese_tasks.js --production
npm run script:prod technical_test_auction.js <id>

# Preview (staging)
node scripts/run.js technical_test_auction.js <id> --preview
npm run script:preview cleanup_orphan_japanese_tasks.js

# Local
node scripts/run.js update_user_password.js user@test.com pass --local
npm run script:local addCredits.js user@test.com 1000
```

## 📊 Environment Comparison

| Environment    | File              | Usage              | Supabase Project                |
| -------------- | ----------------- | ------------------ | ------------------------------- |
| **Local**      | `.env.local`      | Daily development  | DEV (`qzxnlhzlilysiklmbspn`)    |
| **Preview**    | `.env.preview`    | Staging/testing    | DEV ou PROD selon config Vercel |
| **Production** | `.env.production` | Production scripts | PROD (`jgwbqdpxygwsnswtnrxf`)   |

## 🔄 Update Environment Variables

Quand les variables changent sur Vercel :

```bash
# Re-download production
vercel env pull .env.production --environment=production --yes

# Re-download preview
vercel env pull .env.preview --environment=preview --yes
```

## 🔒 Security & Git

Tous les fichiers `.env*` (sauf `.env.example`) sont dans `.gitignore` :

```gitignore
# Local env files
.env
.env.*
!.env.example
```

**Ne jamais commiter les fichiers `.env*` !**

## ❓ FAQ

### Why keep both `.env` and `.env.local`?

- `.env` = fallback par défaut (compatible avec la plupart des outils)
- `.env.local` = explicite pour le développement local
- Pratique : garder les deux avec le même contenu

### Can I delete old `.env.vercel*` files?

✅ Oui, ils sont déjà supprimés ! Backupés dans `.env.backup.YYYYMMDD/` si besoin.

### Which file for daily development?

👉 `.env.local` - c'est le plus clair et explicite

### How to test scripts safely?

```bash
# 1. Test en local d'abord
npm run script:local technical_test_auction.js <id>

# 2. Si OK, lancer en production
npm run script:prod technical_test_auction.js <id>
```

### What if a script uses wrong environment?

Vérifiez que vous utilisez le wrapper avec un flag :

```bash
# ❌ Wrong - uses .env by default
node scripts/cleanup_orphan_japanese_tasks.js

# ✅ Correct - explicit environment
node scripts/run.js cleanup_orphan_japanese_tasks.js --production
npm run script:prod cleanup_orphan_japanese_tasks.js
```

## 🎓 Best Practices

### Sécurité

1. **Never commit** `.env*` files (except `.env.example`)
2. **⚠️ JAMAIS de clés en dur** dans les scripts - toujours utiliser `process.env`
3. **Valider les variables** requises au début de chaque script

```javascript
// ✅ BON - Validation des variables requises
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// ❌ MAUVAIS - Clé en dur
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1...' // JAMAIS!
```

### Utilisation

4. **Always specify** the environment with flags
5. **Test locally** before running on production
6. **Re-download** `.env.production` after Vercel config changes
7. **Use npm scripts** for convenience: `npm run script:prod <script>`

## 📚 Related Documentation

- **[ENVIRONMENTS.md](./ENVIRONMENTS.md)** - Complete environment management guide
- **[SCRIPTS.md](./SCRIPTS.md)** - All available scripts
- **[scripts/README.md](../scripts/README.md)** - Quick start guide
