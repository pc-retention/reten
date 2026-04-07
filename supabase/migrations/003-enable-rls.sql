-- Migration 003: Enable RLS on all tables + SECURITY DEFINER on all functions
-- Purpose: block direct anon access to tables; all data access must go through RPC functions

-- ============================================================
-- 1. Enable RLS on all tables (no policies = deny by default)
-- ============================================================

ALTER TABLE products                ENABLE ROW LEVEL SECURITY;
ALTER TABLE unknown_barcodes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_purchases        ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_queue        ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_back_candidates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfm_config              ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfm_segments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_snapshots        ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_daily           ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_sources         ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_order_statuses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log                ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns               ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Set SECURITY DEFINER on all public functions
--    Functions run as owner (postgres), bypass RLS.
--    Also set search_path to prevent search_path injection.
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      p.proname AS name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind IN ('f', 'p')  -- regular functions and procedures
  LOOP
    EXECUTE format(
      'ALTER FUNCTION public.%I(%s) SECURITY DEFINER SET search_path = public',
      r.name, r.args
    );
  END LOOP;
END $$;