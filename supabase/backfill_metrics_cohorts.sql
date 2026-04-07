-- =====================================================
-- BACKFILL FOR metrics_daily AND cohort_snapshots
-- =====================================================
--
-- Передумова:
-- - clients уже вирівняні через backfill_clients_consistency.sql
-- - first_order_date / last_order_date в clients вже відповідають валідним
--   замовленням з активних джерел і статусів
--
-- Цей файл:
-- 1. Перевизначає daily/cohort функції під ту саму фільтрацію.
-- 2. Дає batch-backfill для metrics_daily.
-- 3. Дає batch-backfill для cohort_snapshots.

-- =====================================================
-- 1. ЩОДЕННІ МЕТРИКИ
-- =====================================================

CREATE OR REPLACE FUNCTION update_daily_metrics(p_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS VOID AS $$
BEGIN
  INSERT INTO metrics_daily (
    date,
    new_clients,
    returning_clients,
    total_orders,
    total_revenue,
    avg_order_value,
    communications_sent,
    communications_opened,
    communications_clicked
  )
  WITH valid_orders AS (
    SELECT
      co.client_id,
      co.order_date,
      co.total_amount
    FROM client_orders co
    JOIN allowed_order_statuses aos
      ON aos.status_id = co.status_id
     AND aos.is_active = TRUE
    JOIN allowed_sources als
      ON als.source_id = co.source_id
     AND als.is_active = TRUE
    WHERE co.order_date = p_date
  )
  SELECT
    p_date,
    (SELECT COUNT(*) FROM clients WHERE first_order_date = p_date),
    (
      SELECT COUNT(DISTINCT vo.client_id)
      FROM valid_orders vo
      JOIN clients c
        ON c.client_id = vo.client_id
      WHERE c.first_order_date < p_date
    ),
    (SELECT COUNT(*) FROM valid_orders),
    (SELECT COALESCE(SUM(total_amount), 0) FROM valid_orders),
    (SELECT COALESCE(AVG(total_amount), 0) FROM valid_orders),
    (SELECT COUNT(*) FROM communication_log WHERE sent_at::DATE = p_date),
    (SELECT COUNT(*) FROM communication_log WHERE opened_at::DATE = p_date),
    (SELECT COUNT(*) FROM communication_log WHERE clicked_at::DATE = p_date)
  ON CONFLICT (date) DO UPDATE SET
    new_clients = EXCLUDED.new_clients,
    returning_clients = EXCLUDED.returning_clients,
    total_orders = EXCLUDED.total_orders,
    total_revenue = EXCLUDED.total_revenue,
    avg_order_value = EXCLUDED.avg_order_value,
    communications_sent = EXCLUDED.communications_sent,
    communications_opened = EXCLUDED.communications_opened,
    communications_clicked = EXCLUDED.communications_clicked;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION backfill_metrics_daily(
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_date_from DATE;
  v_date_to DATE;
  v_date DATE;
  v_count INTEGER := 0;
BEGIN
  SELECT COALESCE(
    p_date_from,
    (SELECT MIN(first_order_date) FROM clients WHERE first_order_date IS NOT NULL),
    CURRENT_DATE
  ) INTO v_date_from;

  SELECT COALESCE(
    p_date_to,
    (SELECT MAX(last_order_date) FROM clients WHERE last_order_date IS NOT NULL),
    CURRENT_DATE
  ) INTO v_date_to;

  IF v_date_from > v_date_to THEN
    RETURN 0;
  END IF;

  FOR v_date IN
    SELECT gs::DATE
    FROM generate_series(v_date_from, v_date_to, INTERVAL '1 day') gs
  LOOP
    PERFORM update_daily_metrics(v_date);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. КОГОРТНІ ЗНІМКИ
-- =====================================================

CREATE OR REPLACE FUNCTION generate_cohort_snapshot(p_month DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO cohort_snapshots (
    cohort_month,
    period_month,
    months_since_first,
    cohort_size,
    active_clients,
    retention_rate,
    total_revenue
  )
  WITH valid_orders_month AS (
    SELECT
      co.client_id,
      co.total_amount
    FROM client_orders co
    JOIN allowed_order_statuses aos
      ON aos.status_id = co.status_id
     AND aos.is_active = TRUE
    JOIN allowed_sources als
      ON als.source_id = co.source_id
     AND als.is_active = TRUE
    WHERE DATE_TRUNC('month', co.order_date) = DATE_TRUNC('month', p_month)
  )
  SELECT
    DATE_TRUNC('month', c.first_order_date)::DATE AS cohort_month,
    DATE_TRUNC('month', p_month)::DATE AS period_month,
    (
      EXTRACT(YEAR FROM AGE(DATE_TRUNC('month', p_month), DATE_TRUNC('month', c.first_order_date))) * 12
      + EXTRACT(MONTH FROM AGE(DATE_TRUNC('month', p_month), DATE_TRUNC('month', c.first_order_date)))
    )::INTEGER AS months_since_first,
    COUNT(DISTINCT c.client_id)::INTEGER AS cohort_size,
    COUNT(DISTINCT vom.client_id)::INTEGER AS active_clients,
    ROUND(
      COUNT(DISTINCT vom.client_id)::NUMERIC
      / NULLIF(COUNT(DISTINCT c.client_id), 0) * 100,
      2
    ) AS retention_rate,
    COALESCE(SUM(vom.total_amount), 0)::NUMERIC(12,2) AS total_revenue
  FROM clients c
  LEFT JOIN valid_orders_month vom
    ON vom.client_id = c.client_id
  WHERE c.first_order_date IS NOT NULL
    AND DATE_TRUNC('month', c.first_order_date) <= DATE_TRUNC('month', p_month)
  GROUP BY DATE_TRUNC('month', c.first_order_date)
  ON CONFLICT (cohort_month, period_month) DO UPDATE SET
    months_since_first = EXCLUDED.months_since_first,
    cohort_size = EXCLUDED.cohort_size,
    active_clients = EXCLUDED.active_clients,
    retention_rate = EXCLUDED.retention_rate,
    total_revenue = EXCLUDED.total_revenue;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION backfill_cohort_snapshots(
  p_month_from DATE DEFAULT NULL,
  p_month_to DATE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_month_from DATE;
  v_month_to DATE;
  v_month DATE;
  v_count INTEGER := 0;
BEGIN
  SELECT COALESCE(
    DATE_TRUNC('month', p_month_from)::DATE,
    (SELECT DATE_TRUNC('month', MIN(first_order_date))::DATE FROM clients WHERE first_order_date IS NOT NULL),
    DATE_TRUNC('month', CURRENT_DATE)::DATE
  ) INTO v_month_from;

  SELECT COALESCE(
    DATE_TRUNC('month', p_month_to)::DATE,
    (SELECT DATE_TRUNC('month', MAX(last_order_date))::DATE FROM clients WHERE last_order_date IS NOT NULL),
    DATE_TRUNC('month', CURRENT_DATE)::DATE
  ) INTO v_month_to;

  IF v_month_from > v_month_to THEN
    RETURN 0;
  END IF;

  FOR v_month IN
    SELECT gs::DATE
    FROM generate_series(v_month_from, v_month_to, INTERVAL '1 month') gs
  LOOP
    PERFORM generate_cohort_snapshot(v_month);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. ДІАГНОСТИКА
-- =====================================================

SELECT
  (SELECT COUNT(*) FROM metrics_daily) AS metrics_daily_rows,
  (SELECT COUNT(*) FROM cohort_snapshots) AS cohort_snapshot_rows,
  (SELECT MIN(first_order_date) FROM clients WHERE first_order_date IS NOT NULL) AS min_first_order_date,
  (SELECT MAX(last_order_date) FROM clients WHERE last_order_date IS NOT NULL) AS max_last_order_date;

-- =====================================================
-- 4. ЗАПУСК
-- =====================================================

-- Заповнити metrics_daily:
-- SELECT backfill_metrics_daily();

-- Заповнити cohort_snapshots:
-- SELECT backfill_cohort_snapshots();

-- =====================================================
-- 5. ПЕРЕВІРКА ПІСЛЯ BACKFILL
-- =====================================================

SELECT
  (SELECT COUNT(*) FROM metrics_daily) AS metrics_daily_rows_after_backfill,
  (SELECT COUNT(*) FROM cohort_snapshots) AS cohort_snapshot_rows_after_backfill,
  (SELECT MIN(date) FROM metrics_daily) AS metrics_min_date,
  (SELECT MAX(date) FROM metrics_daily) AS metrics_max_date,
  (SELECT MIN(cohort_month) FROM cohort_snapshots) AS cohorts_min_cohort_month,
  (SELECT MAX(period_month) FROM cohort_snapshots) AS cohorts_max_period_month;
