-- Script de test des triggers webhook en DEV
-- Ce script crée un prebid de test et vérifie que le webhook est appelé

-- IMPORTANT: Assurez-vous que :
-- 1. Votre serveur Nuxt tourne sur localhost:3000
-- 2. Ngrok est actif et pointe vers localhost:3000
-- 3. Les logs du serveur sont visibles pour voir les appels webhook

-- ============================================
-- Option 1: Test avec un prebid existant
-- ============================================
-- Si vous avez déjà une enchère Dutch de test, vous pouvez créer un prebid :

-- SELECT id, type, title 
-- FROM auctions 
-- WHERE type = 'dutch' 
-- AND test = true 
-- LIMIT 1;

-- Puis créer un prebid (remplacer AUCTION_ID et SELLER_ID) :
-- INSERT INTO bids (auction_id, seller_id, type, price, created_at)
-- VALUES (
--   'AUCTION_ID',
--   'SELLER_ID',
--   'prebid',
--   100.0,
--   NOW()
-- )
-- RETURNING id, auction_id, type, price;

-- ============================================
-- Option 2: Vérifier les logs PostgreSQL
-- ============================================
-- Les webhooks génèrent des warnings si la config est manquante
-- Vérifiez les logs Supabase pour voir :
-- - "Webhook configuration (base_url or bearer_token) is missing or empty"
-- - Ou les appels HTTP réussis

-- ============================================
-- Option 3: Vérifier la configuration actuelle
-- ============================================
SELECT 
  'Configuration actuelle' AS test_type,
  key,
  CASE 
    WHEN key = 'bearer_token' THEN LEFT(value, 20) || '...'
    ELSE value
  END AS value_preview
FROM public.webhook_config
WHERE key IN ('base_url', 'bearer_token')
ORDER BY key;

-- ============================================
-- Option 4: Test de la fonction _call_webhook
-- ============================================
-- Vous pouvez tester directement la fonction (mais attention, cela appellera vraiment l'endpoint) :
-- SELECT _call_webhook(
--   '/api/v1/webhooks/bids/insert',
--   '{"record":{"id":"test","auction_id":"test","type":"prebid"}}'::jsonb
-- );

-- ============================================
-- Vérification des triggers actifs
-- ============================================
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN (
  'insert_bid',
  'insert_auction',
  'update_auction',
  'update_auction_timing',
  'insert_users'
)
ORDER BY event_object_table, trigger_name;

