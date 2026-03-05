-- Script de vérification des triggers webhook en production
-- Usage: Exécuter via Supabase SQL Editor ou psql

-- ============================================
-- 1. Vérifier que les triggers existent
-- ============================================
SELECT
  trigger_name,
  event_object_schema,
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

-- ============================================
-- 2. Vérifier la configuration webhook (GUCs)
-- ============================================
SELECT
  current_setting('app.webhook_base_url', true) AS webhook_base_url,
  CASE 
    WHEN current_setting('app.webhook_bearer_token', true) IS NOT NULL 
    THEN LEFT(current_setting('app.webhook_bearer_token', true), 20) || '...'
    ELSE NULL
  END AS webhook_bearer_token_preview;

-- ============================================
-- 3. Vérifier la table webhook_config (si elle existe)
-- ============================================
SELECT 
  key,
  CASE 
    WHEN key = 'bearer_token' 
    THEN LEFT(value, 20) || '...'
    ELSE value
  END AS value_preview,
  updated_at
FROM public.webhook_config
WHERE key IN ('base_url', 'bearer_token')
ORDER BY key;

-- ============================================
-- 4. Vérifier quelle fonction _call_webhook est active
-- ============================================
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = '_call_webhook';

-- ============================================
-- 5. Vérifier les fonctions trigger
-- ============================================
SELECT 
  p.proname AS function_name,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%webhook_config%' THEN 'Uses webhook_config table'
    WHEN pg_get_functiondef(p.oid) LIKE '%current_setting%' THEN 'Uses GUCs (current_setting)'
    ELSE 'Unknown'
  END AS config_method
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'trigger_insert_bid',
    'trigger_insert_auction',
    'trigger_update_auction',
    'trigger_insert_users'
  )
ORDER BY p.proname;

-- ============================================
-- 6. Résumé de vérification
-- ============================================
DO $$
DECLARE
  trigger_count INT;
  guc_base_url TEXT;
  guc_token TEXT;
  config_table_exists BOOLEAN;
  config_base_url TEXT;
  config_token TEXT;
BEGIN
  -- Compter les triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_name IN (
    'insert_bid',
    'insert_auction',
    'update_auction',
    'update_auction_timing',
    'insert_users'
  );

  -- Vérifier les GUCs
  BEGIN
    guc_base_url := current_setting('app.webhook_base_url', true);
    guc_token := current_setting('app.webhook_bearer_token', true);
  EXCEPTION WHEN OTHERS THEN
    guc_base_url := NULL;
    guc_token := NULL;
  END;

  -- Vérifier la table webhook_config
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'webhook_config'
  ) INTO config_table_exists;

  IF config_table_exists THEN
    SELECT value INTO config_base_url FROM public.webhook_config WHERE key = 'base_url';
    SELECT value INTO config_token FROM public.webhook_config WHERE key = 'bearer_token';
  END IF;

  -- Afficher le résumé
  RAISE NOTICE '========================================';
  RAISE NOTICE 'WEBHOOK TRIGGERS STATUS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Triggers found: % / 5', trigger_count;
  
  IF trigger_count = 5 THEN
    RAISE NOTICE '✅ All triggers are present';
  ELSE
    RAISE NOTICE '❌ Missing triggers! Expected 5, found %', trigger_count;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Configuration Method:';
  
  IF config_table_exists AND (config_base_url IS NOT NULL AND config_base_url != '') THEN
    RAISE NOTICE '✅ Using webhook_config table';
    RAISE NOTICE '   base_url: %', config_base_url;
    RAISE NOTICE '   bearer_token: % (configured)', CASE WHEN config_token IS NOT NULL AND config_token != '' THEN 'YES' ELSE 'NO' END;
  ELSIF guc_base_url IS NOT NULL AND guc_base_url != '' THEN
    RAISE NOTICE '✅ Using GUCs (app.webhook_base_url)';
    RAISE NOTICE '   base_url: %', guc_base_url;
    RAISE NOTICE '   bearer_token: % (configured)', CASE WHEN guc_token IS NOT NULL THEN 'YES' ELSE 'NO' END;
  ELSE
    RAISE NOTICE '❌ No webhook configuration found!';
    RAISE NOTICE '   Webhooks will be skipped with warnings.';
  END IF;

  RAISE NOTICE '========================================';
END $$;

