-- Migration 014: Analytics RPC functions — overview, metrics series, segments, cohorts
-- Idempotent: uses CREATE OR REPLACE

CREATE OR REPLACE FUNCTION get_overview_summary()
RETURNS TABLE (
  total_clients BIGINT,
  active_clients BIGINT,
  avg_ltv NUMERIC(12,2),
  avg_aov NUMERIC(12,2),
  retention_rate NUMERIC(7,2),
  churn_rate NUMERIC(7,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_clients,
    COUNT(*) FILTER (WHERE c.is_active = TRUE) AS active_clients,
    COALESCE(AVG(c.total_spent) FILTER (WHERE c.total_spent > 0), 0)::NUMERIC(12,2) AS avg_ltv,
    COALESCE(AVG(c.avg_order_value) FILTER (WHERE c.avg_order_value > 0), 0)::NUMERIC(12,2) AS avg_aov,
    ROUND(
      COUNT(*) FILTER (WHERE c.total_orders >= 2)::NUMERIC
      / NULLIF(COUNT(*), 0) * 100,
      2
    ) AS retention_rate,
    ROUND(
      COUNT(*) FILTER (WHERE c.is_active = FALSE)::NUMERIC
      / NULLIF(COUNT(*), 0) * 100,
      2
    ) AS churn_rate
  FROM clients c;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_metrics_series(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  new_clients INTEGER,
  returning_clients INTEGER,
  total_orders INTEGER,
  total_revenue NUMERIC(12,2),
  avg_order_value NUMERIC(10,2),
  communications_sent INTEGER,
  communications_opened INTEGER,
  communications_clicked INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    md.date,
    md.new_clients,
    md.returning_clients,
    md.total_orders,
    md.total_revenue,
    md.avg_order_value,
    md.communications_sent,
    md.communications_opened,
    md.communications_clicked
  FROM metrics_daily md
  WHERE md.date >= CURRENT_DATE - GREATEST(p_days - 1, 0)
  ORDER BY md.date ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_top_segments(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  segment_name TEXT,
  client_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.rfm_segment AS segment_name,
    COUNT(*) AS client_count
  FROM clients c
  WHERE c.rfm_segment IS NOT NULL
  GROUP BY c.rfm_segment
  ORDER BY client_count DESC, segment_name ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_analytics_summary(p_period_days INTEGER DEFAULT 30)
RETURNS TABLE (
  avg_ltv NUMERIC(12,2),
  avg_aov NUMERIC(12,2),
  retention_rate NUMERIC(7,2),
  churn_rate NUMERIC(7,2),
  total_revenue NUMERIC(12,2),
  revenue_change_pct NUMERIC(7,2)
) AS $$
DECLARE
  v_current_revenue NUMERIC(12,2);
  v_prev_revenue NUMERIC(12,2);
BEGIN
  SELECT COALESCE(SUM(md.total_revenue), 0)::NUMERIC(12,2)
  INTO v_current_revenue
  FROM metrics_daily md
  WHERE md.date >= CURRENT_DATE - GREATEST(p_period_days - 1, 0);

  SELECT COALESCE(SUM(md.total_revenue), 0)::NUMERIC(12,2)
  INTO v_prev_revenue
  FROM metrics_daily md
  WHERE md.date >= CURRENT_DATE - (GREATEST(p_period_days - 1, 0) * 2 + 1)
    AND md.date < CURRENT_DATE - GREATEST(p_period_days - 1, 0);

  RETURN QUERY
  SELECT
    COALESCE(AVG(c.total_spent) FILTER (WHERE c.total_spent > 0), 0)::NUMERIC(12,2) AS avg_ltv,
    COALESCE(AVG(c.avg_order_value) FILTER (WHERE c.avg_order_value > 0), 0)::NUMERIC(12,2) AS avg_aov,
    ROUND(
      COUNT(*) FILTER (WHERE c.total_orders >= 2)::NUMERIC
      / NULLIF(COUNT(*), 0) * 100,
      2
    ) AS retention_rate,
    ROUND(
      COUNT(*) FILTER (WHERE c.is_active = FALSE)::NUMERIC
      / NULLIF(COUNT(*), 0) * 100,
      2
    ) AS churn_rate,
    v_current_revenue,
    CASE
      WHEN COALESCE(v_prev_revenue, 0) = 0 THEN 0::NUMERIC(7,2)
      ELSE ROUND(((v_current_revenue - v_prev_revenue) / v_prev_revenue) * 100, 2)
    END AS revenue_change_pct
  FROM clients c;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_repeat_purchase_funnel()
RETURNS TABLE (
  step_name TEXT,
  client_count BIGINT,
  pct INTEGER,
  step_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH counts AS (
    SELECT
      COUNT(*) FILTER (WHERE total_orders >= 1) AS total1,
      COUNT(*) FILTER (WHERE total_orders >= 2) AS total2,
      COUNT(*) FILTER (WHERE total_orders >= 3) AS total3,
      COUNT(*) FILTER (WHERE total_orders >= 4) AS total4
    FROM clients
  ),
  funnel AS (
    SELECT '1 покупка'::TEXT AS step_name, total1::BIGINT AS client_count, 100::INTEGER AS pct, 1 AS step_order FROM counts
    UNION ALL
    SELECT '2 покупки'::TEXT, total2::BIGINT, CASE WHEN total1 = 0 THEN 0 ELSE ROUND(total2::NUMERIC / total1 * 100)::INTEGER END, 2 FROM counts
    UNION ALL
    SELECT '3 покупки'::TEXT, total3::BIGINT, CASE WHEN total1 = 0 THEN 0 ELSE ROUND(total3::NUMERIC / total1 * 100)::INTEGER END, 3 FROM counts
    UNION ALL
    SELECT '4+ покупок'::TEXT, total4::BIGINT, CASE WHEN total1 = 0 THEN 0 ELSE ROUND(total4::NUMERIC / total1 * 100)::INTEGER END, 4 FROM counts
  )
  SELECT funnel.step_name, funnel.client_count, funnel.pct, funnel.step_order
  FROM funnel
  ORDER BY step_order;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_ltv_by_segment(p_limit INTEGER DEFAULT 8)
RETURNS TABLE (
  segment_name TEXT,
  ltv NUMERIC(12,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.rfm_segment AS segment_name,
    ROUND(AVG(c.total_spent), 2)::NUMERIC(12,2) AS ltv
  FROM clients c
  WHERE c.rfm_segment IS NOT NULL
    AND c.total_spent > 0
  GROUP BY c.rfm_segment
  ORDER BY ltv DESC, segment_name ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_cohort_matrix()
RETURNS TABLE (
  id UUID,
  cohort_month DATE,
  period_month DATE,
  months_since_first INTEGER,
  cohort_size INTEGER,
  active_clients INTEGER,
  retention_rate NUMERIC(5,2),
  total_revenue NUMERIC(12,2),
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.id,
    cs.cohort_month,
    cs.period_month,
    cs.months_since_first,
    cs.cohort_size,
    cs.active_clients,
    cs.retention_rate,
    cs.total_revenue,
    cs.created_at
  FROM cohort_snapshots cs
  ORDER BY cs.cohort_month ASC, cs.months_since_first ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION get_overview_summary() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_metrics_series(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_top_segments(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_analytics_summary(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_repeat_purchase_funnel() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_ltv_by_segment(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_cohort_matrix() TO anon, authenticated;
