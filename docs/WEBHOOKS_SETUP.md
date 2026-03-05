# Webhooks Setup Guide

## Overview

Les webhooks permettent à Supabase d'appeler automatiquement des endpoints API lors de certains événements (INSERT, UPDATE) sur les tables de la base de données.

Ces webhooks sont essentiels pour :

- **Dutch prebids** : Création des Cloud Tasks pour les enchères descendantes
- **Japanese rounds** : Programmation des rounds successifs
- **User profiles** : Création automatique des profils lors de l'inscription
- **Realtime** : Broadcast des changements aux clients connectés

## Architecture

```
Supabase Database Event → Supabase Dashboard Webhook → Vercel API Endpoint
                                                             ↓
                                                    Cloud Tasks / Broadcast
```

**Important** : Les webhooks sont configurés via **Supabase Dashboard**, pas via SQL migrations.

## Webhooks configurés

| Webhook Name     | Table             | Event  | Endpoint                           | Purpose                                            |
| ---------------- | ----------------- | ------ | ---------------------------------- | -------------------------------------------------- |
| `insert_bid`     | `public.bids`     | INSERT | `/api/v1/webhooks/bids/insert`     | Schedule Dutch prebids in Cloud Tasks (Dutch only) |
| `insert_auction` | `public.auctions` | INSERT | `/api/v1/webhooks/auctions/insert` | Schedule Japanese rounds in Cloud Tasks            |
| `update_auction` | `public.auctions` | UPDATE | `/api/v1/webhooks/auctions/update` | Handle auction state/timing changes                |
| `insert_users`   | `auth.users`      | INSERT | `/api/v1/webhooks/users/insert`    | Create user profiles automatically                 |

**Important: Prebid behavior by auction type:**

- **Dutch auctions**: Prebids create Cloud Tasks for auto-bid execution
  - Webhook creates Cloud Task, updates `bids.cloud_task`
- **English/Reverse auctions**: Prebids are supported but NO Cloud Tasks created
  - No auto-bid feature for English auctions
  - `bids.cloud_task = NULL` is expected and normal
- **Japanese/Sealed-bid auctions**: Prebids do not use Cloud Tasks

**Payload Format** : Supabase automatically generates payloads with structure:

```json
{
  "type": "INSERT" | "UPDATE" | "DELETE",
  "table": "table_name",
  "schema": "public",
  "record": { /* new row data */ },
  "old_record": { /* old row data for UPDATE */ }
}
```

## Configuration par environnement

### PROD (Production)

**Supabase Dashboard**: https://supabase.com/dashboard/project/jgwbqdpxygwsnswtnrxf/database/hooks

**Configuration commune pour les 4 webhooks** :

- **Method**: POST
- **Base URL**: `https://app.crown-procurement.com/api/v1/webhooks/`
- **Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer <PROD_BEARER_TOKEN>
  ```
- **Timeout**: 5000ms (5 seconds)

**Endpoints** :

1. `insert_bid` → `/bids/insert`
2. `insert_auction` → `/auctions/insert`
3. `update_auction` → `/auctions/update`
4. `insert_users` → `/users/insert`

**Variables Vercel requises** :

```bash
WEBHOOK_BEARER_TOKEN=<secure-random-token-prod>
```

### DEV (Development/Staging)

**Supabase Dashboard**: https://supabase.com/dashboard/project/qzxnlhzlilysiklmbspn/database/hooks

**Configuration commune pour les 4 webhooks** :

- **Method**: POST
- **Base URL**: `https://dev.crown.ovh/api/v1/webhooks/`
- **Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer <DEV_BEARER_TOKEN>
  ```
- **Timeout**: 5000ms

**Endpoints** : (mêmes que PROD, URL différente)

**Variables Vercel requises** :

```bash
WEBHOOK_BEARER_TOKEN=<different-token-dev>
```

### LOCAL (Development avec ngrok)

Pour tester les webhooks en local, utilisez ngrok pour exposer votre serveur local :

```bash
# Terminal 1: Démarrer le serveur Nuxt
npm run dev

# Terminal 2: Démarrer ngrok
ngrok http 3000
```

**Configuration dans Supabase Dashboard DEV** :

- **Base URL**: `https://your-ngrok-url.ngrok-free.dev/api/v1/webhooks/`
- **Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer local-dev-token-123
  ```

**Variables .env.local requises** :

```bash
WEBHOOK_BEARER_TOKEN="local-dev-token-123"
NGROK_URL="https://your-ngrok-url.ngrok-free.dev"
```

⚠️ **Important** : Le format du header Authorization doit inclure "Bearer " :

- ✅ Correct : `Authorization: Bearer your-token-here`
- ❌ Incorrect : `Authorization: your-token-here`

## Vérification de la configuration

### 1. Vérifier que les webhooks sont activés

Via Supabase Dashboard → Database → Database Webhooks :

- ✅ `insert_bid` - Enabled
- ✅ `insert_auction` - Enabled
- ✅ `update_auction` - Enabled
- ✅ `insert_users` - Enabled

### 2. Tester un webhook manuellement

```bash
curl -X POST https://app.crown-procurement.com/api/v1/webhooks/bids/insert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"record":{"id":"test","auction_id":"test-auction","seller_email":"test@test.com","type":"prebid","price":800}}'
```

### 3. Tester avec le script automatique

```bash
node scripts/test_webhook_insert_bid.js
```

Résultat attendu :

```
✅ SUCCESS! Cloud Task was created
   Task reference: projects/crown-476614/locations/europe-west1/queues/BidWatchQueue/tasks/...
```

## Dépannage

### ❌ Prebids créés sans cloud_task

**Cause** : Le webhook `insert_bid` n'est pas appelé ou échoue.

**Solution** :

1. **Vérifier que le webhook est activé** dans Supabase Dashboard
2. **Vérifier l'URL** : Doit pointer vers le bon environnement
3. **Vérifier le Bearer token** :
   - Format : `Authorization: Bearer your-token`
   - Token doit correspondre à `WEBHOOK_BEARER_TOKEN` dans Vercel
4. **Vérifier les logs Vercel** :
   ```bash
   vercel logs --follow
   ```
5. **Vérifier les logs Supabase** : Dashboard → Logs → Postgres Logs

### ❌ "Unauthorized access attempt" dans les logs

**Cause** : Le Bearer token ne correspond pas entre Supabase et Vercel.

**Solution** :

1. Vérifier le token dans Supabase Dashboard webhook
2. Vérifier `WEBHOOK_BEARER_TOKEN` dans Vercel :
   ```bash
   vercel env ls | grep WEBHOOK_BEARER_TOKEN
   ```
3. Vérifier que le format inclut "Bearer " : `Authorization: Bearer token`
4. Redéployer si le token a changé :
   ```bash
   vercel --prod
   ```

### ❌ "WEBHOOK_BEARER_TOKEN not configured" dans les logs

**Cause** : La variable d'environnement n'est pas définie dans Vercel.

**Solution** :

```bash
# Générer un token
openssl rand -base64 32

# Ajouter à Vercel
vercel env add WEBHOOK_BEARER_TOKEN
# Sélectionner l'environnement (Production/Development)

# Redéployer
vercel --prod
```

### ❌ Webhooks fonctionnent en PROD mais pas en DEV

**Cause** : Les webhooks sont configurés par projet Supabase, pas partagés.

**Solution** : Configurer les webhooks séparément dans chaque Dashboard :

- PROD : https://supabase.com/dashboard/project/jgwbqdpxygwsnswtnrxf/database/hooks
- DEV : https://supabase.com/dashboard/project/qzxnlhzlilysiklmbspn/database/hooks

### ❌ ngrok tunnel not accessible

**Cause** : ngrok n'est pas en cours d'exécution ou l'URL a changé.

**Solution** :

1. Démarrer ngrok : `ngrok http 3000`
2. Copier la nouvelle URL ngrok
3. Mettre à jour les webhooks dans Supabase Dashboard DEV
4. Mettre à jour `.env.local` avec la nouvelle URL

## Scripts utiles

### Réparer les prebids existants sans cloud_task

Si des prebids ont été créés AVANT la configuration des webhooks :

```bash
node scripts/repairPrebids.js --auction-id <uuid>
# Ou pour tous les prebids récents :
node scripts/repairPrebids.js --since 2025-12-13 --limit 100
```

Le script :

- Récupère les prebids avec `cloud_task IS NULL`
- Replay le webhook `/api/v1/webhooks/bids/insert`
- Crée les Cloud Tasks manquants

### Tester la configuration d'un groupe d'enchères

```bash
node scripts/technical_test_auction.js <auction_group_id>
```

Le script vérifie notamment :

- ✅ Prebids ont un `cloud_task` défini
- ✅ Cloud Tasks existent dans GCP
- ✅ Payloads des Cloud Tasks sont corrects

## Variables d'environnement requises

### Vercel Production

```bash
# Webhook authentication
WEBHOOK_BEARER_TOKEN=<secure-random-token-prod>

# GCP Cloud Tasks (pour les prebids et Japanese rounds)
GCP_PROJECT_NUMBER=...
GCP_WORKLOAD_IDENTITY_POOL_ID=...
GCP_WORKLOAD_IDENTITY_PROVIDER_ID=...
GCP_SERVICE_ACCOUNT_EMAIL=...
```

### Vercel Development/Preview

```bash
# Webhook authentication
WEBHOOK_BEARER_TOKEN=<different-token-dev>

# GCP credentials (mêmes que PROD)
```

### Local (.env.local)

```bash
# Webhook authentication
WEBHOOK_BEARER_TOKEN="local-dev-token-123"

# ngrok tunnel URL
NGROK_URL="https://your-ngrok-url.ngrok-free.dev"
GCP_ENDPOINT="https://your-ngrok-url.ngrok-free.dev"
```

## Génération de Bearer Tokens sécurisés

```bash
# Générer un token aléatoire de 32 bytes (256 bits)
openssl rand -base64 32

# Exemple de sortie:
# 3K8vN2kL9mP5qR7tU1wX4yZ6aB8cD0eF2gH4iJ6kL8mN0pQ2rS4tU6vW8xY0zA2b
```

**Best practices** :

- ✅ Utilisez des tokens **différents** pour DEV et PROD
- ✅ Gardez les tokens **secrets** - ne les committez jamais dans git
- ✅ Rotez les tokens **régulièrement** (tous les 6 mois minimum)
- ✅ Le même token doit être dans **Vercel ET Supabase Dashboard**

## Historique

- **2025-12-10** : Anciennes migrations avec triggers SQL et GUCs supprimées
- **2025-12-13** : Migration vers Supabase Dashboard webhooks (plus de triggers custom)
- **2025-12-13** : Consolidation de 6 migrations confuses en 1 seule migration de cleanup
- **2025-12-13** : Documentation mise à jour pour refléter l'approche Dashboard-only

## Voir aussi

- `docs/WEBHOOK_SETUP_GUIDE.md` - Guide détaillé pas-à-pas pour configurer les webhooks
- `docs/API.md` - Documentation des endpoints webhook
- `docs/DATABASE.md` - Schema et business logic PostgreSQL
- `docs/BROWSER_TESTING.md` - Tests E2E incluant les prebids
