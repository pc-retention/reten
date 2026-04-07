-- Migration 004: RPC wrappers for all remaining direct table access
-- Purpose: all frontend data access goes through SECURITY DEFINER functions (RLS-safe)

-- DROP existing functions that may conflict on return type change
DROP FUNCTION IF EXISTS get_settings_list();
DROP FUNCTION IF EXISTS get_communication_templates_list();
DROP FUNCTION IF EXISTS delete_client_purchase(UUID);
DROP FUNCTION IF EXISTS get_client_by_id(INTEGER);
DROP FUNCTION IF EXISTS get_client_orders(INTEGER);
DROP FUNCTION IF EXISTS get_client_comms(INTEGER);
DROP FUNCTION IF EXISTS get_client_loyalty_transactions(INTEGER);
DROP FUNCTION IF EXISTS get_rfm_segment_action(TEXT);
DROP FUNCTION IF EXISTS update_client_active(INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS get_automation_queue();
DROP FUNCTION IF EXISTS get_communication_log_all();
DROP FUNCTION IF EXISTS get_win_back_candidates();

-- ============================================================
-- 1. Settings & templates (SettingsPage)
-- ============================================================

CREATE FUNCTION get_settings_list()
RETURNS SETOF settings
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM settings ORDER BY key;
$$;

CREATE FUNCTION get_communication_templates_list()
RETURNS SETOF communication_templates
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM communication_templates ORDER BY communication_type, channel;
$$;

-- ============================================================
-- 2. Client purchases delete (RemindersPage)
-- ============================================================

CREATE FUNCTION delete_client_purchase(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM client_purchases WHERE id = p_id;
END;
$$;

-- ============================================================
-- 3. Client card queries (ClientsPage)
-- ============================================================

CREATE FUNCTION get_client_by_id(p_client_id INTEGER)
RETURNS SETOF clients
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM clients WHERE client_id = p_client_id LIMIT 1;
$$;

CREATE FUNCTION get_client_orders(p_client_id INTEGER)
RETURNS SETOF client_orders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM client_orders
  WHERE client_id = p_client_id
  ORDER BY order_date DESC
  LIMIT 50;
$$;

CREATE FUNCTION get_client_comms(p_client_id INTEGER)
RETURNS SETOF communication_log
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM communication_log
  WHERE client_id = p_client_id
  ORDER BY sent_at DESC
  LIMIT 50;
$$;

CREATE FUNCTION get_client_loyalty_transactions(p_client_id INTEGER)
RETURNS SETOF loyalty_transactions
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM loyalty_transactions
  WHERE client_id = p_client_id
  ORDER BY created_at DESC
  LIMIT 50;
$$;

CREATE FUNCTION get_rfm_segment_action(p_segment_name TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT recommended_action FROM rfm_segments
  WHERE segment_name = p_segment_name
  LIMIT 1;
$$;

-- ============================================================
-- 4. Toggle client active (ClientsPage)
-- ============================================================

CREATE FUNCTION update_client_active(
  p_client_id INTEGER,
  p_is_active  BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE clients
  SET is_active = p_is_active
  WHERE client_id = p_client_id;
END;
$$;

-- ============================================================
-- 5. Automations data (AutomationsPage)
-- ============================================================

CREATE FUNCTION get_automation_queue()
RETURNS TABLE (
  id               UUID,
  client_id        INTEGER,
  automation_type  TEXT,
  trigger_data     JSONB,
  scheduled_at     TIMESTAMPTZ,
  status           TEXT,
  skip_reason      TEXT,
  created_at       TIMESTAMPTZ,
  client_name      TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    aq.id,
    aq.client_id,
    aq.automation_type,
    aq.trigger_data,
    aq.scheduled_at,
    aq.status,
    aq.skip_reason,
    aq.created_at,
    c.full_name AS client_name
  FROM automation_queue aq
  LEFT JOIN clients c ON c.client_id = aq.client_id
  ORDER BY aq.scheduled_at ASC;
$$;

CREATE FUNCTION get_communication_log_all()
RETURNS SETOF communication_log
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM communication_log ORDER BY sent_at DESC;
$$;

CREATE FUNCTION get_win_back_candidates()
RETURNS SETOF win_back_candidates
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM win_back_candidates;
$$;

-- ============================================================
-- 6. Update product fields (ProductsPage — saveProduct)
-- ============================================================

CREATE OR REPLACE FUNCTION update_product(
  p_barcode    TEXT,
  p_name       TEXT,
  p_category   TEXT,
  p_brand      TEXT,
  p_price      NUMERIC,
  p_usage_days INTEGER,
  p_image_url  TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET name       = p_name,
      category   = p_category,
      brand      = p_brand,
      price      = p_price,
      usage_days = p_usage_days,
      image_url  = p_image_url,
      updated_at = NOW()
  WHERE barcode = p_barcode;
END;
$$;
