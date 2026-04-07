-- =====================================================
-- BACKFILL / CONSISTENCY CHECKS FOR clients
-- =====================================================
--
-- Призначення:
-- 1. Знайти розсинхрон денормалізованих полів у clients.
-- 2. Перерахувати агрегати clients з client_orders по активних статусах і джерелах.
-- 3. Оновити loyalty tier, churn, active flag.
-- 4. За потреби перерахувати RFM після backfill.
--
-- Важливо:
-- - Скрипт не чіпає loyalty_points.
-- - Скрипт не змінює історію замовлень.
-- - Джерелом істини для агрегатів є client_orders, filtered by:
--   allowed_order_statuses.is_active = true
--   allowed_sources.is_active = true

-- =====================================================
-- 1. ДІАГНОСТИКА
-- =====================================================

-- Базові контрольні цифри
SELECT
  (SELECT COUNT(*) FROM clients) AS clients_count,
  (SELECT COUNT(*) FROM client_orders) AS orders_count,
  (SELECT COUNT(*) FROM clients WHERE total_orders > 0) AS clients_with_orders,
  (SELECT COUNT(*) FROM clients WHERE last_order_date IS NOT NULL) AS clients_with_last_order,
  (SELECT COUNT(*) FROM clients WHERE is_active = TRUE) AS active_clients;

-- Клієнти, у яких є замовлення, але немає last_order_date
SELECT COUNT(*) AS clients_orders_without_last_order
FROM clients
WHERE total_orders > 0
  AND last_order_date IS NULL;

-- Клієнти, у яких записані агрегати, але вони не збігаються з валідними замовленнями
WITH valid_orders AS (
  SELECT
    co.client_id,
    COUNT(*)::INTEGER AS total_orders,
    COALESCE(SUM(co.total_amount), 0)::NUMERIC(10,2) AS total_spent,
    COALESCE(AVG(co.total_amount), 0)::NUMERIC(10,2) AS avg_order_value,
    MIN(co.order_date) AS first_order_date,
    MAX(co.order_date) AS last_order_date,
    (
      ARRAY_AGG(co.source_id ORDER BY co.order_date DESC NULLS LAST, co.order_id DESC)
    )[1] AS latest_source_id
  FROM client_orders co
  JOIN allowed_order_statuses aos
    ON aos.status_id = co.status_id
   AND aos.is_active = TRUE
  JOIN allowed_sources als
    ON als.source_id = co.source_id
   AND als.is_active = TRUE
  GROUP BY co.client_id
),
comparison AS (
  SELECT
    c.client_id,
    c.total_orders AS current_total_orders,
    COALESCE(v.total_orders, 0) AS expected_total_orders,
    c.total_spent AS current_total_spent,
    COALESCE(v.total_spent, 0)::NUMERIC(10,2) AS expected_total_spent,
    c.avg_order_value AS current_avg_order_value,
    COALESCE(v.avg_order_value, 0)::NUMERIC(10,2) AS expected_avg_order_value,
    c.first_order_date AS current_first_order_date,
    v.first_order_date AS expected_first_order_date,
    c.last_order_date AS current_last_order_date,
    v.last_order_date AS expected_last_order_date,
    c.source_id AS current_source_id,
    v.latest_source_id AS expected_source_id,
    c.is_active AS current_is_active,
    CASE
      WHEN v.last_order_date IS NULL THEN FALSE
      ELSE (CURRENT_DATE - v.last_order_date) <= 120
    END AS expected_is_active
  FROM clients c
  LEFT JOIN valid_orders v
    ON v.client_id = c.client_id
)
SELECT COUNT(*) AS inconsistent_clients
FROM comparison
WHERE current_total_orders IS DISTINCT FROM expected_total_orders
   OR current_total_spent IS DISTINCT FROM expected_total_spent
   OR current_avg_order_value IS DISTINCT FROM expected_avg_order_value
   OR current_first_order_date IS DISTINCT FROM expected_first_order_date
   OR current_last_order_date IS DISTINCT FROM expected_last_order_date
   OR current_source_id IS DISTINCT FROM expected_source_id
   OR current_is_active IS DISTINCT FROM expected_is_active;

-- Приклад розсинхронених рядків
WITH valid_orders AS (
  SELECT
    co.client_id,
    COUNT(*)::INTEGER AS total_orders,
    COALESCE(SUM(co.total_amount), 0)::NUMERIC(10,2) AS total_spent,
    COALESCE(AVG(co.total_amount), 0)::NUMERIC(10,2) AS avg_order_value,
    MIN(co.order_date) AS first_order_date,
    MAX(co.order_date) AS last_order_date,
    (
      ARRAY_AGG(co.source_id ORDER BY co.order_date DESC NULLS LAST, co.order_id DESC)
    )[1] AS latest_source_id
  FROM client_orders co
  JOIN allowed_order_statuses aos
    ON aos.status_id = co.status_id
   AND aos.is_active = TRUE
  JOIN allowed_sources als
    ON als.source_id = co.source_id
   AND als.is_active = TRUE
  GROUP BY co.client_id
)
SELECT
  c.client_id,
  c.full_name,
  c.total_orders AS current_total_orders,
  COALESCE(v.total_orders, 0) AS expected_total_orders,
  c.last_order_date AS current_last_order_date,
  v.last_order_date AS expected_last_order_date,
  c.is_active AS current_is_active,
  CASE
    WHEN v.last_order_date IS NULL THEN FALSE
    ELSE (CURRENT_DATE - v.last_order_date) <= 120
  END AS expected_is_active
FROM clients c
LEFT JOIN valid_orders v
  ON v.client_id = c.client_id
WHERE c.total_orders IS DISTINCT FROM COALESCE(v.total_orders, 0)
   OR c.last_order_date IS DISTINCT FROM v.last_order_date
   OR c.is_active IS DISTINCT FROM CASE
     WHEN v.last_order_date IS NULL THEN FALSE
     ELSE (CURRENT_DATE - v.last_order_date) <= 120
   END
ORDER BY c.client_id DESC
LIMIT 50;

-- =====================================================
-- 2. НОВА ФУНКЦІЯ BACKFILL ДЛЯ clients
-- =====================================================

-- Синхронізована версія calculate_client_stats(...)
-- Потрібна, щоб майбутні інкрементальні перерахунки не повертали стару логіку.
CREATE OR REPLACE FUNCTION calculate_client_stats(p_client_id BIGINT)
RETURNS VOID AS $$
DECLARE
  v_total_orders INTEGER;
  v_total_spent NUMERIC(10,2);
  v_avg_order NUMERIC(10,2);
  v_first_date DATE;
  v_last_date DATE;
  v_days_since INTEGER;
  v_churn TEXT;
  v_new_tier TEXT;
  v_latest_source_id INTEGER;
BEGIN
  WITH active_order_totals AS (
    SELECT
      coi.order_id,
      coi.client_id,
      COUNT(*)::INTEGER AS active_products_count,
      COALESCE(SUM(coi.price * coi.quantity), 0)::NUMERIC(10,2) AS active_total_amount
    FROM client_order_items coi
    JOIN products p
      ON p.barcode = coi.barcode
     AND p.is_active = TRUE
    GROUP BY coi.order_id, coi.client_id
  )
  SELECT
    COUNT(*)::INTEGER,
    COALESCE(SUM(aot.active_total_amount), 0)::NUMERIC(10,2),
    COALESCE(AVG(aot.active_total_amount), 0)::NUMERIC(10,2),
    MIN(co.order_date),
    MAX(co.order_date),
    (
      ARRAY_AGG(co.source_id ORDER BY co.order_date DESC NULLS LAST, co.order_id DESC)
    )[1]
  INTO
    v_total_orders,
    v_total_spent,
    v_avg_order,
    v_first_date,
    v_last_date,
    v_latest_source_id
  FROM client_orders co
  JOIN active_order_totals aot
    ON aot.order_id = co.order_id
   AND aot.client_id = co.client_id
   AND aot.active_products_count > 0
  JOIN allowed_order_statuses aos
    ON aos.status_id = co.status_id
   AND aos.is_active = TRUE
  JOIN allowed_sources als
    ON als.source_id = co.source_id
   AND als.is_active = TRUE
  WHERE co.client_id = p_client_id;

  IF v_last_date IS NULL THEN
    v_days_since := NULL;
    v_churn := 'high';
  ELSE
    v_days_since := CURRENT_DATE - v_last_date;

    IF v_days_since <= 30 THEN
      v_churn := 'low';
    ELSIF v_days_since <= 90 THEN
      v_churn := 'medium';
    ELSE
      v_churn := 'high';
    END IF;
  END IF;

  SELECT tier_name INTO v_new_tier
  FROM loyalty_tiers
  WHERE v_total_spent >= min_total_spent
    AND v_total_orders >= min_orders
  ORDER BY sort_order DESC
  LIMIT 1;

  IF v_new_tier IS NULL THEN
    v_new_tier := 'bronze';
  END IF;

  UPDATE clients
  SET
    total_orders = COALESCE(v_total_orders, 0),
    total_spent = COALESCE(v_total_spent, 0),
    avg_order_value = COALESCE(v_avg_order, 0),
    first_order_date = v_first_date,
    last_order_date = v_last_date,
    source_id = v_latest_source_id,
    churn_risk = v_churn,
    is_active = CASE
      WHEN v_last_date IS NULL THEN FALSE
      ELSE v_days_since <= 120
    END,
    loyalty_tier = v_new_tier,
    updated_at = NOW()
  WHERE client_id = p_client_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION backfill_clients_denormalized()
RETURNS TABLE (
  updated_clients BIGINT,
  recalculated_rfm INTEGER
) AS $$
DECLARE
  v_updated_clients BIGINT;
  v_recalculated_rfm INTEGER;
BEGIN
  WITH active_order_totals AS (
    SELECT
      coi.order_id,
      coi.client_id,
      COUNT(*)::INTEGER AS active_products_count,
      COALESCE(SUM(coi.price * coi.quantity), 0)::NUMERIC(10,2) AS active_total_amount
    FROM client_order_items coi
    JOIN products p
      ON p.barcode = coi.barcode
     AND p.is_active = TRUE
    GROUP BY coi.order_id, coi.client_id
  ),
  valid_orders AS (
    SELECT
      co.client_id,
      COUNT(*)::INTEGER AS total_orders,
      COALESCE(SUM(aot.active_total_amount), 0)::NUMERIC(10,2) AS total_spent,
      COALESCE(AVG(aot.active_total_amount), 0)::NUMERIC(10,2) AS avg_order_value,
      MIN(co.order_date) AS first_order_date,
      MAX(co.order_date) AS last_order_date,
      (
        ARRAY_AGG(co.source_id ORDER BY co.order_date DESC NULLS LAST, co.order_id DESC)
      )[1] AS latest_source_id
    FROM client_orders co
    JOIN active_order_totals aot
      ON aot.order_id = co.order_id
     AND aot.client_id = co.client_id
     AND aot.active_products_count > 0
    JOIN allowed_order_statuses aos
      ON aos.status_id = co.status_id
     AND aos.is_active = TRUE
    JOIN allowed_sources als
      ON als.source_id = co.source_id
     AND als.is_active = TRUE
    GROUP BY co.client_id
  ),
  tiered AS (
    SELECT
      c.client_id,
      COALESCE(v.total_orders, 0)::INTEGER AS total_orders,
      COALESCE(v.total_spent, 0)::NUMERIC(10,2) AS total_spent,
      COALESCE(v.avg_order_value, 0)::NUMERIC(10,2) AS avg_order_value,
      v.first_order_date,
      v.last_order_date,
      v.latest_source_id,
      CASE
        WHEN v.last_order_date IS NULL THEN 'high'
        WHEN (CURRENT_DATE - v.last_order_date) <= 30 THEN 'low'
        WHEN (CURRENT_DATE - v.last_order_date) <= 90 THEN 'medium'
        ELSE 'high'
      END AS churn_risk,
      CASE
        WHEN v.last_order_date IS NULL THEN FALSE
        ELSE (CURRENT_DATE - v.last_order_date) <= 120
      END AS is_active,
      COALESCE(
        (
          SELECT lt.tier_name
          FROM loyalty_tiers lt
          WHERE COALESCE(v.total_spent, 0) >= lt.min_total_spent
            AND COALESCE(v.total_orders, 0) >= lt.min_orders
          ORDER BY lt.sort_order DESC
          LIMIT 1
        ),
        'bronze'
      ) AS loyalty_tier
    FROM clients c
    LEFT JOIN valid_orders v
      ON v.client_id = c.client_id
  ),
  updated AS (
    UPDATE clients c
    SET
      total_orders = t.total_orders,
      total_spent = t.total_spent,
      avg_order_value = t.avg_order_value,
      first_order_date = t.first_order_date,
      last_order_date = t.last_order_date,
      source_id = t.latest_source_id,
      churn_risk = t.churn_risk,
      is_active = t.is_active,
      loyalty_tier = t.loyalty_tier,
      updated_at = NOW()
    FROM tiered t
    WHERE c.client_id = t.client_id
      AND (
        c.total_orders IS DISTINCT FROM t.total_orders
        OR c.total_spent IS DISTINCT FROM t.total_spent
        OR c.avg_order_value IS DISTINCT FROM t.avg_order_value
        OR c.first_order_date IS DISTINCT FROM t.first_order_date
        OR c.last_order_date IS DISTINCT FROM t.last_order_date
        OR c.source_id IS DISTINCT FROM t.latest_source_id
        OR c.churn_risk IS DISTINCT FROM t.churn_risk
        OR c.is_active IS DISTINCT FROM t.is_active
        OR c.loyalty_tier IS DISTINCT FROM t.loyalty_tier
      )
    RETURNING c.client_id
  )
  SELECT COUNT(*) INTO v_updated_clients
  FROM updated;

  SELECT recalculate_all_rfm() INTO v_recalculated_rfm;

  RETURN QUERY
  SELECT v_updated_clients, v_recalculated_rfm;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS refresh_clients_denormalized();

CREATE OR REPLACE FUNCTION refresh_clients_denormalized()
RETURNS TABLE (
  updated_clients BIGINT,
  recalculated_rfm INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM backfill_clients_denormalized();
$$;

GRANT EXECUTE ON FUNCTION refresh_clients_denormalized() TO anon, authenticated;

-- =====================================================
-- 3. ВИКОНАННЯ BACKFILL
-- =====================================================

-- Запустити backfill:
-- SELECT * FROM backfill_clients_denormalized();

-- =====================================================
-- 4. ПЕРЕВІРКА ПІСЛЯ BACKFILL
-- =====================================================

-- Повторна швидка перевірка ключових аномалій
SELECT
  COUNT(*) FILTER (WHERE total_orders > 0 AND last_order_date IS NULL) AS orders_without_last_order,
  COUNT(*) FILTER (WHERE total_orders = 0 AND last_order_date IS NOT NULL) AS last_order_without_orders,
  COUNT(*) FILTER (WHERE total_spent > 0 AND total_orders = 0) AS spent_without_orders,
  COUNT(*) FILTER (WHERE total_orders > 0 AND avg_order_value = 0) AS orders_without_avg
FROM clients;

-- Повторна повна перевірка консистентності після виконання функції
WITH valid_orders AS (
  SELECT
    co.client_id,
    COUNT(*)::INTEGER AS total_orders,
    COALESCE(SUM(co.total_amount), 0)::NUMERIC(10,2) AS total_spent,
    COALESCE(AVG(co.total_amount), 0)::NUMERIC(10,2) AS avg_order_value,
    MIN(co.order_date) AS first_order_date,
    MAX(co.order_date) AS last_order_date,
    (
      ARRAY_AGG(co.source_id ORDER BY co.order_date DESC NULLS LAST, co.order_id DESC)
    )[1] AS latest_source_id
  FROM client_orders co
  JOIN allowed_order_statuses aos
    ON aos.status_id = co.status_id
   AND aos.is_active = TRUE
  JOIN allowed_sources als
    ON als.source_id = co.source_id
   AND als.is_active = TRUE
  GROUP BY co.client_id
),
comparison AS (
  SELECT
    c.client_id,
    c.total_orders AS current_total_orders,
    COALESCE(v.total_orders, 0) AS expected_total_orders,
    c.total_spent AS current_total_spent,
    COALESCE(v.total_spent, 0)::NUMERIC(10,2) AS expected_total_spent,
    c.avg_order_value AS current_avg_order_value,
    COALESCE(v.avg_order_value, 0)::NUMERIC(10,2) AS expected_avg_order_value,
    c.first_order_date AS current_first_order_date,
    v.first_order_date AS expected_first_order_date,
    c.last_order_date AS current_last_order_date,
    v.last_order_date AS expected_last_order_date,
    c.source_id AS current_source_id,
    v.latest_source_id AS expected_source_id,
    c.is_active AS current_is_active,
    CASE
      WHEN v.last_order_date IS NULL THEN FALSE
      ELSE (CURRENT_DATE - v.last_order_date) <= 120
    END AS expected_is_active
  FROM clients c
  LEFT JOIN valid_orders v
    ON v.client_id = c.client_id
)
SELECT COUNT(*) AS inconsistent_clients_after_backfill
FROM comparison
WHERE current_total_orders IS DISTINCT FROM expected_total_orders
   OR current_total_spent IS DISTINCT FROM expected_total_spent
   OR current_avg_order_value IS DISTINCT FROM expected_avg_order_value
   OR current_first_order_date IS DISTINCT FROM expected_first_order_date
   OR current_last_order_date IS DISTINCT FROM expected_last_order_date
   OR current_source_id IS DISTINCT FROM expected_source_id
   OR current_is_active IS DISTINCT FROM expected_is_active;
