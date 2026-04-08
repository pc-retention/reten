-- Migration 016: RPC for Products, Loyalty and Campaigns pages
-- Idempotent: uses CREATE OR REPLACE, DROP IF EXISTS before recreate

DROP FUNCTION IF EXISTS get_products_page(INTEGER, INTEGER, TEXT, TEXT, BOOLEAN, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS get_products_page(INTEGER, INTEGER, TEXT, TEXT, TEXT, BOOLEAN, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS get_product_summary();
DROP FUNCTION IF EXISTS create_campaign(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, TIMESTAMPTZ, TEXT);
DROP FUNCTION IF EXISTS update_campaign(UUID, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, TIMESTAMPTZ, TEXT);
DROP FUNCTION IF EXISTS delete_campaign(UUID);
DROP FUNCTION IF EXISTS get_campaigns_calendar(TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_products_page(
  p_page INTEGER DEFAULT 0,
  p_page_size INTEGER DEFAULT 100,
  p_search TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'all',
  p_brand TEXT DEFAULT 'all',
  p_is_active BOOLEAN DEFAULT TRUE,
  p_sort_field TEXT DEFAULT 'name',
  p_sort_asc BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  barcode TEXT,
  name TEXT,
  usage_days INTEGER,
  category TEXT,
  brand TEXT,
  brand_color TEXT,
  price NUMERIC(10,2),
  cross_sell_barcodes TEXT[],
  is_active BOOLEAN,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INTEGER := GREATEST(p_page, 0) * GREATEST(p_page_size, 1);
  v_sort_field TEXT := CASE
    WHEN p_sort_field IN ('barcode', 'name', 'category', 'brand', 'price', 'usage_days') THEN p_sort_field
    ELSE 'name'
  END;
  v_sort_direction TEXT := CASE WHEN p_sort_asc THEN 'ASC' ELSE 'DESC' END;
BEGIN
  RETURN QUERY EXECUTE format(
    $sql$
      WITH filtered AS (
        SELECT
          p.*,
          pb.brand_color
        FROM products p
        LEFT JOIN product_brands pb
          ON pb.brand_name = p.brand
        WHERE p.is_active = $1
          AND (
            $2 IS NULL
            OR p.name ILIKE '%%' || $2 || '%%'
            OR p.barcode ILIKE '%%' || $2 || '%%'
          )
          AND ($3 IS NULL OR $3 = 'all' OR p.category = $3)
          AND ($4 IS NULL OR $4 = 'all' OR p.brand = $4)
      )
      SELECT
        filtered.barcode,
        filtered.name,
        filtered.usage_days,
        filtered.category,
        filtered.brand,
        filtered.brand_color,
        filtered.price,
        filtered.cross_sell_barcodes,
        filtered.is_active,
        filtered.image_url,
        filtered.created_at,
        filtered.updated_at,
        COUNT(*) OVER() AS total_count
      FROM filtered
      ORDER BY %I %s NULLS LAST
      OFFSET $5
      LIMIT $6
    $sql$,
    v_sort_field,
    v_sort_direction
  )
  USING
    p_is_active,
    NULLIF(BTRIM(p_search), ''),
    p_category,
    p_brand,
    v_offset,
    p_page_size;
END;
$$;

CREATE OR REPLACE FUNCTION get_product_summary()
RETURNS TABLE (
  active_count BIGINT,
  inactive_count BIGINT,
  unknown_count BIGINT,
  categories_count BIGINT,
  brands_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM products WHERE is_active = TRUE) AS active_count,
    (SELECT COUNT(*) FROM products WHERE is_active = FALSE) AS inactive_count,
    (SELECT COUNT(*) FROM unknown_barcodes) AS unknown_count,
    (SELECT COUNT(*) FROM product_categories) AS categories_count,
    (SELECT COUNT(*) FROM product_brands) AS brands_count;
$$;

CREATE OR REPLACE FUNCTION get_product_categories_summary()
RETURNS TABLE (
  category TEXT,
  product_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pc.category_name AS category,
    COUNT(p.barcode) AS product_count
  FROM product_categories pc
  LEFT JOIN products p
    ON p.category = pc.category_name
  GROUP BY pc.category_name
  ORDER BY product_count DESC, pc.category_name ASC;
$$;

CREATE OR REPLACE FUNCTION get_unknown_barcodes_page(
  p_page INTEGER DEFAULT 0,
  p_page_size INTEGER DEFAULT 100,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  barcode TEXT,
  first_seen_at TIMESTAMPTZ,
  seen_count INTEGER,
  last_order_id BIGINT,
  sample_name TEXT,
  total_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT ub.*
    FROM unknown_barcodes ub
    WHERE
      p_search IS NULL
      OR ub.sample_name ILIKE '%' || p_search || '%'
      OR ub.barcode ILIKE '%' || p_search || '%'
  )
  SELECT
    filtered.barcode,
    filtered.first_seen_at,
    filtered.seen_count,
    filtered.last_order_id,
    filtered.sample_name,
    COUNT(*) OVER() AS total_count
  FROM filtered
  ORDER BY filtered.seen_count DESC, filtered.first_seen_at ASC
  OFFSET GREATEST(p_page, 0) * GREATEST(p_page_size, 1)
  LIMIT p_page_size;
$$;

CREATE OR REPLACE FUNCTION get_loyalty_overview()
RETURNS TABLE (
  total_clients BIGINT,
  total_points BIGINT,
  avg_points BIGINT,
  participation_rate NUMERIC(5,1),
  transactions_count BIGINT,
  bronze_count BIGINT,
  silver_count BIGINT,
  gold_count BIGINT,
  platinum_count BIGINT
)
LANGUAGE sql
STABLE
AS $$
  WITH filtered_clients AS (
    SELECT c.*
    FROM clients c
    WHERE c.is_active = TRUE
      AND c.total_orders > 0
  )
  SELECT
    COUNT(*) AS total_clients,
    COALESCE(SUM(loyalty_points), 0)::BIGINT AS total_points,
    COALESCE(ROUND(AVG(loyalty_points)), 0)::BIGINT AS avg_points,
    COALESCE(ROUND(100.0 * SUM(CASE WHEN loyalty_points > 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1), 0) AS participation_rate,
    (
      SELECT COUNT(*)
      FROM loyalty_transactions lt
      JOIN filtered_clients fc
        ON fc.client_id = lt.client_id
    ) AS transactions_count,
    SUM(CASE WHEN loyalty_tier = 'bronze' THEN 1 ELSE 0 END)::BIGINT AS bronze_count,
    SUM(CASE WHEN loyalty_tier = 'silver' THEN 1 ELSE 0 END)::BIGINT AS silver_count,
    SUM(CASE WHEN loyalty_tier = 'gold' THEN 1 ELSE 0 END)::BIGINT AS gold_count,
    SUM(CASE WHEN loyalty_tier = 'platinum' THEN 1 ELSE 0 END)::BIGINT AS platinum_count
  FROM filtered_clients;
$$;

CREATE OR REPLACE FUNCTION get_loyalty_top_clients(
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  client_id BIGINT,
  full_name TEXT,
  loyalty_tier TEXT,
  loyalty_points INTEGER
)
LANGUAGE sql
STABLE
AS $$
  SELECT client_id, full_name, loyalty_tier, loyalty_points
  FROM clients
  WHERE is_active = TRUE
    AND total_orders > 0
  ORDER BY loyalty_points DESC, client_id ASC
  LIMIT GREATEST(p_limit, 1);
$$;

CREATE OR REPLACE FUNCTION get_loyalty_transactions_page(
  p_page INTEGER DEFAULT 0,
  p_page_size INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  client_id BIGINT,
  transaction_type TEXT,
  points INTEGER,
  reason TEXT,
  order_id BIGINT,
  created_at TIMESTAMPTZ,
  client_name TEXT,
  total_count BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    lt.id,
    lt.client_id,
    lt.transaction_type,
    lt.points,
    lt.reason,
    lt.order_id,
    lt.created_at,
    c.full_name AS client_name,
    COUNT(*) OVER() AS total_count
  FROM loyalty_transactions lt
  JOIN clients c
    ON c.client_id = lt.client_id
   AND c.is_active = TRUE
   AND c.total_orders > 0
  ORDER BY lt.created_at DESC
  OFFSET GREATEST(p_page, 0) * GREATEST(p_page_size, 1)
  LIMIT p_page_size;
$$;

CREATE OR REPLACE FUNCTION get_campaigns_page(
  p_page INTEGER DEFAULT 0,
  p_page_size INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  target_segment TEXT,
  target_clients_count INTEGER,
  channel TEXT,
  template_id TEXT,
  scheduled_at TIMESTAMPTZ,
  status TEXT,
  sent_count INTEGER,
  opened_count INTEGER,
  clicked_count INTEGER,
  conversion_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.name,
    c.type,
    c.target_segment,
    c.target_clients_count,
    c.channel,
    c.template_id,
    c.scheduled_at,
    c.status,
    c.sent_count,
    c.opened_count,
    c.clicked_count,
    c.conversion_count,
    c.created_at,
    c.updated_at,
    COUNT(*) OVER() AS total_count
  FROM campaigns c
  ORDER BY c.scheduled_at DESC NULLS LAST, c.created_at DESC
  OFFSET GREATEST(p_page, 0) * GREATEST(p_page_size, 1)
  LIMIT p_page_size;
$$;

CREATE OR REPLACE FUNCTION get_campaigns_calendar(
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  target_segment TEXT,
  target_clients_count INTEGER,
  channel TEXT,
  template_id TEXT,
  scheduled_at TIMESTAMPTZ,
  status TEXT,
  sent_count INTEGER,
  opened_count INTEGER,
  clicked_count INTEGER,
  conversion_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.name,
    c.type,
    c.target_segment,
    c.target_clients_count,
    c.channel,
    c.template_id,
    c.scheduled_at,
    c.status,
    c.sent_count,
    c.opened_count,
    c.clicked_count,
    c.conversion_count,
    c.created_at,
    c.updated_at
  FROM campaigns c
  WHERE c.scheduled_at IS NOT NULL
    AND c.scheduled_at >= p_start
    AND c.scheduled_at <= p_end
  ORDER BY c.scheduled_at ASC, c.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION create_campaign(
  p_name TEXT,
  p_type TEXT DEFAULT 'manual',
  p_target_segment TEXT DEFAULT NULL,
  p_target_clients_count INTEGER DEFAULT 0,
  p_channel TEXT DEFAULT NULL,
  p_template_id TEXT DEFAULT NULL,
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL,
  p_status TEXT DEFAULT 'draft'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_name TEXT := NULLIF(BTRIM(p_name), '');
BEGIN
  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Campaign name cannot be empty';
  END IF;

  INSERT INTO campaigns (
    name,
    type,
    target_segment,
    target_clients_count,
    channel,
    template_id,
    scheduled_at,
    status
  )
  VALUES (
    v_name,
    COALESCE(NULLIF(BTRIM(p_type), ''), 'manual'),
    NULLIF(BTRIM(p_target_segment), ''),
    GREATEST(COALESCE(p_target_clients_count, 0), 0),
    NULLIF(BTRIM(p_channel), ''),
    NULLIF(BTRIM(p_template_id), ''),
    p_scheduled_at,
    COALESCE(NULLIF(BTRIM(p_status), ''), 'draft')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_campaign(
  p_id UUID,
  p_name TEXT,
  p_type TEXT DEFAULT 'manual',
  p_target_segment TEXT DEFAULT NULL,
  p_target_clients_count INTEGER DEFAULT 0,
  p_channel TEXT DEFAULT NULL,
  p_template_id TEXT DEFAULT NULL,
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL,
  p_status TEXT DEFAULT 'draft'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT := NULLIF(BTRIM(p_name), '');
BEGIN
  IF p_id IS NULL THEN
    RAISE EXCEPTION 'Campaign id is required';
  END IF;

  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Campaign name cannot be empty';
  END IF;

  UPDATE campaigns
  SET
    name = v_name,
    type = COALESCE(NULLIF(BTRIM(p_type), ''), 'manual'),
    target_segment = NULLIF(BTRIM(p_target_segment), ''),
    target_clients_count = GREATEST(COALESCE(p_target_clients_count, 0), 0),
    channel = NULLIF(BTRIM(p_channel), ''),
    template_id = NULLIF(BTRIM(p_template_id), ''),
    scheduled_at = p_scheduled_at,
    status = COALESCE(NULLIF(BTRIM(p_status), ''), 'draft'),
    updated_at = NOW()
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION delete_campaign(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_id IS NULL THEN
    RAISE EXCEPTION 'Campaign id is required';
  END IF;

  DELETE FROM campaigns
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_ab_variant_summary()
RETURNS TABLE (
  variant TEXT,
  total_messages BIGINT,
  opened_messages BIGINT,
  clicked_messages BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ab_variant AS variant,
    COUNT(*) AS total_messages,
    COUNT(opened_at) AS opened_messages,
    COUNT(clicked_at) AS clicked_messages
  FROM communication_log
  WHERE ab_variant IS NOT NULL
  GROUP BY ab_variant
  ORDER BY ab_variant;
$$;

GRANT EXECUTE ON FUNCTION get_products_page(INTEGER, INTEGER, TEXT, TEXT, TEXT, BOOLEAN, TEXT, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_product_summary() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_product_categories_summary() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_unknown_barcodes_page(INTEGER, INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_loyalty_overview() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_loyalty_top_clients(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_loyalty_transactions_page(INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_campaigns_page(INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_campaigns_calendar(TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_campaign(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, TIMESTAMPTZ, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_campaign(UUID, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, TIMESTAMPTZ, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_campaign(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_ab_variant_summary() TO anon, authenticated;
