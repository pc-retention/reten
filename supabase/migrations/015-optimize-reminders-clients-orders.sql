-- Migration 015: Performance indexes + RPC for Clients, Reminders and Orders pages
-- Idempotent: uses CREATE INDEX IF NOT EXISTS, CREATE OR REPLACE, DROP IF EXISTS before recreate

CREATE INDEX IF NOT EXISTS idx_client_orders_client_status_source
  ON client_orders (client_id, status_id, source_id);

CREATE INDEX IF NOT EXISTS idx_client_purchases_client_barcode_reminder_sent
  ON client_purchases (client_id, barcode, reminder_date, reminder_sent);

CREATE INDEX IF NOT EXISTS idx_client_purchases_pending_reminder
  ON client_purchases (reminder_date)
  WHERE reminder_sent = FALSE;

CREATE INDEX IF NOT EXISTS idx_products_active_barcode
  ON products (is_active, barcode);

CREATE OR REPLACE FUNCTION get_clients_page(
  p_page INTEGER DEFAULT 0,
  p_page_size INTEGER DEFAULT 100,
  p_search TEXT DEFAULT NULL,
  p_segment TEXT DEFAULT 'all',
  p_tier TEXT DEFAULT 'all',
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT TRUE,
  p_sort_field TEXT DEFAULT 'total_spent',
  p_sort_asc BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  client_id BIGINT,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  instagram TEXT,
  source_id INTEGER,
  first_order_date DATE,
  last_order_date DATE,
  total_orders INTEGER,
  total_spent NUMERIC(10,2),
  avg_order_value NUMERIC(10,2),
  rfm_recency INTEGER,
  rfm_frequency INTEGER,
  rfm_monetary INTEGER,
  rfm_segment TEXT,
  rfm_updated_at TIMESTAMPTZ,
  loyalty_tier TEXT,
  loyalty_points INTEGER,
  is_active BOOLEAN,
  churn_risk TEXT,
  preferred_channel TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_offset INTEGER := GREATEST(p_page, 0) * GREATEST(p_page_size, 1);
  v_sort_field TEXT := CASE
    WHEN p_sort_field IN ('total_spent', 'last_order_date', 'total_orders') THEN p_sort_field
    ELSE 'total_spent'
  END;
  v_sort_direction TEXT := CASE WHEN p_sort_asc THEN 'ASC' ELSE 'DESC' END;
BEGIN
  RETURN QUERY EXECUTE format(
    $sql$
      WITH filtered AS (
        SELECT c.*
        FROM clients c
        WHERE c.is_active = $1
          AND EXISTS (
            SELECT 1
            FROM client_orders co
            JOIN allowed_order_statuses aos
              ON aos.status_id = co.status_id
             AND aos.is_active = TRUE
            JOIN allowed_sources als
              ON als.source_id = co.source_id
             AND als.is_active = TRUE
            WHERE co.client_id = c.client_id
          )
          AND (
            $2 IS NULL
            OR c.full_name ILIKE '%%' || $2 || '%%'
            OR c.phone ILIKE '%%' || $2 || '%%'
            OR c.email ILIKE '%%' || $2 || '%%'
          )
          AND ($3 IS NULL OR $3 = 'all' OR c.rfm_segment = $3)
          AND ($4 IS NULL OR $4 = 'all' OR c.loyalty_tier = $4)
          AND ($5 IS NULL OR c.last_order_date >= $5)
          AND ($6 IS NULL OR c.last_order_date <= $6)
      )
      SELECT
        filtered.client_id,
        filtered.full_name,
        filtered.phone,
        filtered.email,
        filtered.instagram,
        filtered.source_id,
        filtered.first_order_date,
        filtered.last_order_date,
        filtered.total_orders,
        filtered.total_spent,
        filtered.avg_order_value,
        filtered.rfm_recency,
        filtered.rfm_frequency,
        filtered.rfm_monetary,
        filtered.rfm_segment,
        filtered.rfm_updated_at,
        filtered.loyalty_tier,
        filtered.loyalty_points,
        filtered.is_active,
        filtered.churn_risk,
        filtered.preferred_channel,
        filtered.tags,
        filtered.created_at,
        filtered.updated_at,
        COUNT(*) OVER() AS total_count
      FROM filtered
      ORDER BY %I %s NULLS LAST
      OFFSET $7
      LIMIT $8
    $sql$,
    v_sort_field,
    v_sort_direction
  )
  USING
    p_is_active,
    NULLIF(BTRIM(p_search), ''),
    p_segment,
    p_tier,
    p_date_from,
    p_date_to,
    v_offset,
    p_page_size;
END;
$$;

CREATE OR REPLACE FUNCTION get_filtered_reminders(
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_client_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  client_id BIGINT,
  barcode TEXT,
  product_name TEXT,
  quantity INTEGER,
  usage_days INTEGER,
  total_usage_days INTEGER,
  purchase_date DATE,
  expected_end_date DATE,
  reminder_date DATE,
  reminder_sent BOOLEAN,
  source_channel TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  client_name TEXT,
  client_phone TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    cp.id,
    cp.client_id,
    cp.barcode,
    cp.product_name,
    cp.quantity,
    cp.usage_days,
    cp.total_usage_days,
    COALESCE(latest_purchase.purchase_date, cp.purchase_date) AS purchase_date,
    cp.expected_end_date,
    cp.reminder_date,
    cp.reminder_sent,
    cp.source_channel,
    cp.created_at,
    cp.updated_at,
    c.full_name AS client_name,
    c.phone AS client_phone
  FROM client_purchases cp
  JOIN clients c
    ON c.client_id = cp.client_id
  JOIN products p
    ON p.barcode = cp.barcode
   AND p.is_active = TRUE
  LEFT JOIN LATERAL (
    SELECT MAX(COALESCE(co.status_changed_at::DATE, co.order_date)) AS purchase_date
    FROM client_orders co
    JOIN client_order_items coi
      ON coi.order_id = co.order_id
     AND coi.client_id = cp.client_id
     AND coi.barcode = cp.barcode
    JOIN allowed_order_statuses aos
      ON aos.status_id = co.status_id
     AND aos.is_active = TRUE
    JOIN allowed_sources als
      ON als.source_id = co.source_id
     AND als.is_active = TRUE
  ) latest_purchase
    ON TRUE
  WHERE EXISTS (
    SELECT 1
    FROM client_orders co
    JOIN client_order_items coi
      ON coi.order_id = co.order_id
     AND coi.client_id = cp.client_id
     AND coi.barcode = cp.barcode
    JOIN allowed_order_statuses aos
      ON aos.status_id = co.status_id
     AND aos.is_active = TRUE
    JOIN allowed_sources als
      ON als.source_id = co.source_id
     AND als.is_active = TRUE
    WHERE co.client_id = cp.client_id
  )
    AND (p_client_id IS NULL OR cp.client_id = p_client_id)
    AND (p_date_from IS NULL OR cp.reminder_date >= p_date_from)
    AND (p_date_to IS NULL OR cp.reminder_date <= p_date_to)
  ORDER BY cp.reminder_date ASC, cp.client_id ASC;
$$;

DROP FUNCTION IF EXISTS get_orders_page(INTEGER, INTEGER, DATE, DATE, BOOLEAN);
DROP FUNCTION IF EXISTS get_orders_page(INTEGER, INTEGER, DATE, DATE, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION get_orders_page(
  p_page INTEGER DEFAULT 0,
  p_page_size INTEGER DEFAULT 100,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_sort_field TEXT DEFAULT 'order_date',
  p_sort_asc BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  client_id BIGINT,
  order_id BIGINT,
  order_date DATE,
  order_created_at TIMESTAMPTZ,
  status_changed_at TIMESTAMPTZ,
  status_id INTEGER,
  status_name TEXT,
  status_color TEXT,
  source_id INTEGER,
  source_name TEXT,
  source_color TEXT,
  total_amount NUMERIC(10,2),
  products_count INTEGER,
  created_at TIMESTAMPTZ,
  client_name TEXT,
  total_count BIGINT
)
LANGUAGE sql
STABLE
AS $$
  WITH filtered AS (
    SELECT
      co.id,
      co.client_id,
      co.order_id,
      co.order_date,
      COALESCE(co.order_created_at, co.order_date::TIMESTAMPTZ) AS order_created_at,
      co.status_changed_at,
      co.status_id,
      aos.status_name,
      aos.color AS status_color,
      co.source_id,
      als.source_name,
      als.color AS source_color,
      co.created_at,
      c.full_name AS client_name,
      COALESCE(SUM(coi.price * COALESCE(coi.quantity, 1)), 0)::NUMERIC(10,2) AS total_amount,
      COALESCE(SUM(COALESCE(coi.quantity, 1)), 0)::INTEGER AS products_count
    FROM client_orders co
    JOIN allowed_order_statuses aos
      ON aos.status_id = co.status_id
     AND aos.is_active = TRUE
    JOIN allowed_sources als
      ON als.source_id = co.source_id
     AND als.is_active = TRUE
    LEFT JOIN clients c
      ON c.client_id = co.client_id
    JOIN client_order_items coi
      ON coi.order_id = co.order_id
    JOIN products p
      ON p.barcode = coi.barcode
     AND p.is_active = TRUE
    WHERE (p_date_from IS NULL OR co.order_date >= p_date_from)
      AND (p_date_to IS NULL OR co.order_date <= p_date_to)
    GROUP BY
      co.id,
      co.client_id,
      co.order_id,
      co.order_date,
      COALESCE(co.order_created_at, co.order_date::TIMESTAMPTZ),
      co.status_changed_at,
      co.status_id,
      aos.status_name,
      aos.color,
      co.source_id,
      als.source_name,
      als.color,
      co.created_at,
      c.full_name
  )
  SELECT
    filtered.id,
    filtered.client_id,
    filtered.order_id,
    filtered.order_date,
    filtered.order_created_at,
    filtered.status_changed_at,
    filtered.status_id,
    filtered.status_name,
    filtered.status_color,
    filtered.source_id,
    filtered.source_name,
    filtered.source_color,
    filtered.total_amount,
    filtered.products_count,
    filtered.created_at,
    filtered.client_name,
    COUNT(*) OVER() AS total_count
  FROM filtered
  ORDER BY
    CASE WHEN p_sort_field = 'order_id' AND p_sort_asc THEN filtered.order_id END ASC NULLS LAST,
    CASE WHEN p_sort_field = 'order_id' AND NOT p_sort_asc THEN filtered.order_id END DESC NULLS LAST,
    CASE WHEN p_sort_field = 'order_created_at' AND p_sort_asc THEN filtered.order_created_at END ASC NULLS LAST,
    CASE WHEN p_sort_field = 'order_created_at' AND NOT p_sort_asc THEN filtered.order_created_at END DESC NULLS LAST,
    CASE WHEN p_sort_field = 'client_name' AND p_sort_asc THEN filtered.client_name END ASC NULLS LAST,
    CASE WHEN p_sort_field = 'client_name' AND NOT p_sort_asc THEN filtered.client_name END DESC NULLS LAST,
    CASE WHEN p_sort_field = 'order_date' AND p_sort_asc THEN filtered.order_date END ASC NULLS LAST,
    CASE WHEN p_sort_field = 'order_date' AND NOT p_sort_asc THEN filtered.order_date END DESC NULLS LAST,
    CASE WHEN p_sort_field = 'source_name' AND p_sort_asc THEN filtered.source_name END ASC NULLS LAST,
    CASE WHEN p_sort_field = 'source_name' AND NOT p_sort_asc THEN filtered.source_name END DESC NULLS LAST,
    CASE WHEN p_sort_field = 'status_changed_at' AND p_sort_asc THEN filtered.status_changed_at END ASC NULLS LAST,
    CASE WHEN p_sort_field = 'status_changed_at' AND NOT p_sort_asc THEN filtered.status_changed_at END DESC NULLS LAST,
    CASE WHEN p_sort_field = 'status_name' AND p_sort_asc THEN filtered.status_name END ASC NULLS LAST,
    CASE WHEN p_sort_field = 'status_name' AND NOT p_sort_asc THEN filtered.status_name END DESC NULLS LAST,
    CASE WHEN p_sort_field = 'products_count' AND p_sort_asc THEN filtered.products_count END ASC NULLS LAST,
    CASE WHEN p_sort_field = 'products_count' AND NOT p_sort_asc THEN filtered.products_count END DESC NULLS LAST,
    CASE WHEN p_sort_field = 'total_amount' AND p_sort_asc THEN filtered.total_amount END ASC NULLS LAST,
    CASE WHEN p_sort_field = 'total_amount' AND NOT p_sort_asc THEN filtered.total_amount END DESC NULLS LAST,
    filtered.order_date DESC NULLS LAST,
    filtered.order_id DESC
  OFFSET GREATEST(p_page, 0) * GREATEST(p_page_size, 1)
  LIMIT p_page_size;
$$;
