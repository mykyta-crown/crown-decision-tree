# Webhook System Fix - Action Plan

**Date**: 2025-12-13
**Status**: 🚨 CRITICAL - Webhooks non-fonctionnels en production
**Impact**: Dutch prebids et Japanese rounds ne sont pas schedulés

---

## Problème Identifié

### Chronologie

1. **10 décembre 2025** - Migration `20251210085312_update_webhooks_for_dev.sql`
   - ❌ A supprimé TOUS les triggers webhook (prod et dev)
   - But initial: Séparer les environnements dev/prod

2. **12 décembre 2025** - Tentatives de réparation
   - ❌ Migration avec `supabase_functions.http_request` → fonction non fiable
   - ❌ Migration avec `pg_net.http_post` → fonction non disponible/non fiable
   - ❌ Configuration via Supabase Dashboard → payload vide `{}`

### Cause Racine

Les webhooks configurés via le dashboard Supabase n'envoient **pas le bon format de payload**:

- **Reçu par l'API**: `{}` (vide)
- **Attendu par l'API**: `{"record": {...}}`

Vos endpoints vérifient `body.record` (ex: `bids/insert.post.js:31`), donc ils échouent avec payload vide.

---

## Solution Recommandée

### Approche: Webhooks Supabase Dashboard avec Payload Template Correct

**Avantages**:

- ✅ Solution native Supabase (pas de code custom)
- ✅ Fiable et maintenue par Supabase
- ✅ Facile à configurer différemment par environnement
- ✅ Visible dans le dashboard (facile à débugger)
- ✅ Supporte les templates `{{ record }}` et `{{ old_record }}`

**Inconvénients**:

- ⚠️ Configuration manuelle (pas via migration)
- ⚠️ Doit être refaite sur chaque environnement

---

## Plan d'Action (Étape par Étape)

### Phase 1: Nettoyage (DEV puis PROD)

**Objectif**: Supprimer toutes les tentatives précédentes de webhooks

**✅ TERMINÉ** - Migration consolidée appliquée sur DEV

#### 1.1 Migration Consolidée

Une migration consolidée a remplacé 6 migrations webhook confuses :

**Remplacées** :

- `20251210085312_update_webhooks_for_dev.sql`
- `20251212170000_fix_insert_bid_webhook_payload.sql`
- `20251212170500_webhook_config_table.sql`
- `20251212171000_fix_webhook_function_for_pg_net.sql`
- `20251212180000_fix_insert_bid_trigger.sql`
- `20251213120000_restore_webhook_system.sql`

**Par** :

- `20251210090000_webhook_system_setup.sql` (propre et consolidée)

```bash
# ✅ Appliqué sur DEV (qzxnlhzlilysiklmbspn)
# Vérifier l'état:
supabase migration list

# Pour PROD: La migration sera appliquée automatiquement par Vercel
git push origin main  # Après merge de dev
```

**Ce que fait la migration**:

- Supprime tous les triggers custom (`insert_bid`, `insert_auction`, etc.)
- Supprime toutes les fonctions custom (`trigger_insert_bid()`, `_call_webhook()`, etc.)
- Supprime la table `webhook_config`
- Nettoie les GUC settings

#### 1.2 Vérifier le nettoyage

Exécutez dans Supabase SQL Editor:

```sql
-- Vérifier qu'il n'y a plus de triggers webhook custom
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('insert_bid', 'insert_auction', 'update_auction', 'insert_users');
-- Doit retourner 0 ligne

-- Vérifier qu'il n'y a plus de fonction _call_webhook
SELECT proname FROM pg_proc WHERE proname = '_call_webhook';
-- Doit retourner 0 ligne
```

### Phase 2: Configuration des Webhooks (DEV pour tester)

**Objectif**: Configurer les webhooks via Supabase Dashboard avec le bon payload

#### 2.1 Préparer le Bearer Token

```bash
# Générer un token sécurisé
TOKEN=$(openssl rand -base64 32)
echo $TOKEN

# L'ajouter dans Vercel (choisir "Development" pour DEV)
vercel env add WEBHOOK_BEARER_TOKEN

# Copier le token pour l'utiliser dans Supabase
```

#### 2.2 Configurer les webhooks dans Supabase Dashboard

**URL DEV**: https://supabase.com/dashboard/project/qzxnlhzlilysiklmbspn/database/hooks

Pour chaque webhook, suivre exactement le guide dans `WEBHOOK_SETUP_GUIDE.md`:

1. **insert_bid** (CRITIQUE pour Dutch auctions)
   - Table: `public.bids`
   - Event: INSERT
   - URL: `https://dev.crown.ovh/api/v1/webhooks/bids/insert`
   - Headers:
     ```
     Content-Type: application/json
     Authorization: Bearer <YOUR_TOKEN>
     ```
   - **Payload (CRITIQUE)**:
     ```json
     {
       "record": {{ record }}
     }
     ```

2. **insert_auction** (CRITIQUE pour Japanese auctions)
   - Table: `public.auctions`
   - Event: INSERT
   - URL: `https://dev.crown.ovh/api/v1/webhooks/auctions/insert`
   - Headers: (même que ci-dessus)
   - **Payload**:
     ```json
     {
       "record": {{ record }}
     }
     ```

3. **update_auction**
   - Table: `public.auctions`
   - Event: UPDATE
   - URL: `https://dev.crown.ovh/api/v1/webhooks/auctions/update`
   - Headers: (même que ci-dessus)
   - **Payload**:
     ```json
     {
       "record": {{ record }},
       "old_record": {{ old_record }}
     }
     ```

4. **insert_users**
   - Table: `auth.users`
   - Event: INSERT
   - URL: `https://dev.crown.ovh/api/v1/webhooks/users/insert`
   - Headers: (même que ci-dessus)
   - **Payload**:
     ```json
     {
       "record": {{ record }}
     }
     ```

⚠️ **ATTENTION**: Le payload doit utiliser **double curly braces** `{{ }}` - c'est la syntaxe template de Supabase.

### Phase 3: Tests DEV

**Objectif**: Valider que les webhooks fonctionnent correctement

#### 3.1 Test automatisé

```bash
# Lancer le script de test
node scripts/test_webhook_insert_bid.js

# Attendu: "✅ SUCCESS! Cloud Task was created"
```

#### 3.2 Test manuel

1. Créer une enchère Dutch de test via l'UI
2. Créer un prebid
3. Vérifier dans les logs Vercel:

   ```bash
   vercel logs --follow
   ```

   Chercher: `[WEBHOOK BID INSERT]` et vérifier que `bid.id` est présent

4. Vérifier que le Cloud Task a été créé:

   ```bash
   gcloud tasks list --queue=BidWatchQueue --limit=5
   ```

5. Vérifier dans la base de données:
   ```sql
   SELECT id, auction_id, type, price, cloud_task
   FROM bids
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   La colonne `cloud_task` doit être remplie avec le chemin du task.

#### 3.3 Vérifier les logs Supabase

Dans Supabase Dashboard → Logs → Postgres Logs:

- Chercher: "webhook"
- Vérifier qu'il n'y a pas d'erreurs "timeout" ou "connection refused"

### Phase 4: Déploiement PROD

**Objectif**: Appliquer la même configuration en production

#### 4.1 Merger vers main

```bash
# Après validation complète sur DEV
git checkout main
git merge dev
git push origin main
```

La migration sera automatiquement appliquée par Vercel lors du build.

#### 4.2 Configurer le Bearer Token PROD

```bash
# Générer un NOUVEAU token (différent de DEV)
TOKEN_PROD=$(openssl rand -base64 32)

# L'ajouter dans Vercel (choisir "Production")
vercel env add WEBHOOK_BEARER_TOKEN
```

#### 4.3 Configurer les webhooks PROD

**URL PROD**: https://supabase.com/dashboard/project/jgwbqdpxygwsnswtnrxf/database/hooks

Répéter exactement les mêmes étapes que Phase 2.2, mais avec:

- URL de base: `https://app.crown-procurement.com`
- Token: Le token PROD (différent de DEV)

#### 4.4 Tests PROD

1. Créer une enchère Dutch **de test** (`test: true`)
2. Créer un prebid
3. Vérifier les logs Vercel PROD: `vercel logs --prod --follow`
4. Vérifier Cloud Tasks: `gcloud tasks list --queue=BidWatchQueue`

⚠️ **Ne pas tester avec de vraies enchères** tant que tout n'est pas validé.

### Phase 5: Monitoring

**Objectif**: S'assurer que tout fonctionne à long terme

#### 5.1 Vérification quotidienne (première semaine)

```bash
# Vérifier les erreurs webhook dans Supabase logs
# Dashboard → Logs → Postgres Logs → Filter: "webhook"

# Vérifier les erreurs dans Vercel
vercel logs --prod | grep ERROR
```

#### 5.2 Alertes à mettre en place (optionnel)

- Sentry: Monitorer les erreurs sur `/api/v1/webhooks/*`
- Supabase: Configurer des alertes email si webhook échoue
- Cloud Tasks: Monitorer la queue `BidWatchQueue` et `JapaneseRoundHandler`

---

## Checklist de Validation Finale

Avant de considérer le problème résolu, vérifier:

### DEV

- [ ] Migration `20251213120000_restore_webhook_system.sql` appliquée
- [ ] 4 webhooks configurés dans Supabase Dashboard
- [ ] Script `test_webhook_insert_bid.js` passe (✅ SUCCESS)
- [ ] Test manuel Dutch prebid fonctionne (Cloud Task créé)
- [ ] Test manuel Japanese auction fonctionne (rounds schedulés)
- [ ] Logs Vercel montrent les webhooks reçus avec `body.record` présent
- [ ] Aucune erreur dans Supabase Postgres Logs

### PROD

- [ ] Migration appliquée automatiquement par Vercel build
- [ ] 4 webhooks configurés dans Supabase Dashboard (avec URLs prod)
- [ ] Bearer token PROD différent de DEV
- [ ] Test Dutch prebid fonctionne (avec `test: true`)
- [ ] Test Japanese auction fonctionne (avec `test: true`)
- [ ] Logs Vercel PROD montrent webhooks reçus correctement
- [ ] Aucune erreur dans Supabase Postgres Logs

---

## En Cas de Problème

### Webhook ne se déclenche pas

1. Vérifier dans Supabase Dashboard → Database Webhooks que le webhook est "Enabled"
2. Vérifier que l'événement correspond (INSERT sur `bids` doit trigger `insert_bid`)
3. Vérifier les logs Supabase: Dashboard → Logs → Postgres Logs

### Payload vide dans l'API

1. Éditer le webhook dans Supabase Dashboard
2. Vérifier que le payload est **exactement** `{"record": {{ record }}}`
3. Vérifier les **double curly braces** `{{ }}` (pas simple `{ }`)

### Erreur "Unauthorized"

1. Vérifier que le Bearer token dans Supabase webhook header correspond au token dans Vercel
2. Vérifier via: `vercel env ls`
3. Si différent, corriger et redéployer: `vercel --prod`

### Cloud Task non créé

1. Vérifier que le webhook a bien été appelé (logs Vercel)
2. Vérifier que `body.record` est présent (pas vide)
3. Vérifier que `x-vercel-oidc-token` est présent (requis pour Cloud Tasks)
4. Vérifier les permissions GCP: `gcloud tasks queues describe BidWatchQueue`

---

## Ressources

- **Guide complet**: `WEBHOOK_SETUP_GUIDE.md`
- **Script de test**: `scripts/test_webhook_insert_bid.js`
- **Migration de nettoyage**: `supabase/migrations/20251213120000_restore_webhook_system.sql`
- **Documentation database**: `docs/DATABASE.md` (section "Triggers & Webhooks")

---

## Support

Si après avoir suivi ce plan le problème persiste:

1. Exporter les logs Supabase: Dashboard → Logs → Download
2. Exporter les logs Vercel: `vercel logs --prod > vercel-logs.txt`
3. Vérifier la configuration webhook: Supabase Dashboard → Database Webhooks → Screenshot
4. Tester l'endpoint directement:
   ```bash
   curl -X POST https://app.crown-procurement.com/api/v1/webhooks/bids/insert \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"record": {"id": "test", "auction_id": "test", "type": "prebid"}}'
   ```

---

**Dernière mise à jour**: 2025-12-13
**Auteur**: Claude Code Assistant
**Statut**: Prêt pour exécution
