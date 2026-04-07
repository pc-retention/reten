ALTER TABLE rfm_segments DISABLE ROW LEVEL SECURITY;
ALTER TABLE rfm_config DISABLE ROW LEVEL SECURITY;

GRANT SELECT ON rfm_segments TO anon, authenticated;
GRANT SELECT ON rfm_config TO anon, authenticated;

DROP FUNCTION IF EXISTS get_rfm_segments_list();
DROP FUNCTION IF EXISTS get_rfm_config_list();
DROP FUNCTION IF EXISTS upsert_rfm_segment(TEXT, INTEGER[], INTEGER[], INTEGER[], TEXT, INTEGER, TEXT, INTEGER);
DROP FUNCTION IF EXISTS upsert_rfm_config(TEXT, INTEGER, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS seed_default_rfm_reference();

CREATE OR REPLACE FUNCTION get_rfm_segments_list()
RETURNS TABLE (
  segment_name TEXT,
  r_scores INTEGER[],
  f_scores INTEGER[],
  m_scores INTEGER[],
  color TEXT,
  priority INTEGER,
  recommended_action TEXT,
  communication_frequency_days INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    segment_name,
    r_scores,
    f_scores,
    m_scores,
    color,
    priority,
    recommended_action,
    communication_frequency_days
  FROM rfm_segments
  ORDER BY priority ASC, segment_name ASC;
$$;

CREATE OR REPLACE FUNCTION get_rfm_config_list()
RETURNS TABLE (
  metric TEXT,
  score INTEGER,
  min_value NUMERIC,
  max_value NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    metric,
    score,
    min_value,
    max_value
  FROM rfm_config
  ORDER BY metric ASC, score DESC;
$$;

CREATE OR REPLACE FUNCTION upsert_rfm_segment(
  p_segment_name TEXT,
  p_r_scores INTEGER[],
  p_f_scores INTEGER[],
  p_m_scores INTEGER[],
  p_color TEXT,
  p_priority INTEGER,
  p_recommended_action TEXT,
  p_communication_frequency_days INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_segment_name TEXT := NULLIF(BTRIM(p_segment_name), '');
BEGIN
  IF v_segment_name IS NULL THEN
    RAISE EXCEPTION 'segment_name is required';
  END IF;

  INSERT INTO rfm_segments (
    segment_name,
    r_scores,
    f_scores,
    m_scores,
    color,
    priority,
    recommended_action,
    communication_frequency_days
  )
  VALUES (
    v_segment_name,
    COALESCE(p_r_scores, '{}'),
    COALESCE(p_f_scores, '{}'),
    COALESCE(p_m_scores, '{}'),
    NULLIF(BTRIM(p_color), ''),
    COALESCE(p_priority, 999),
    COALESCE(NULLIF(BTRIM(p_recommended_action), ''), ''),
    COALESCE(p_communication_frequency_days, 3)
  )
  ON CONFLICT (segment_name) DO UPDATE
  SET
    r_scores = EXCLUDED.r_scores,
    f_scores = EXCLUDED.f_scores,
    m_scores = EXCLUDED.m_scores,
    color = EXCLUDED.color,
    priority = EXCLUDED.priority,
    recommended_action = EXCLUDED.recommended_action,
    communication_frequency_days = EXCLUDED.communication_frequency_days;
END;
$$;

CREATE OR REPLACE FUNCTION upsert_rfm_config(
  p_metric TEXT,
  p_score INTEGER,
  p_min_value NUMERIC,
  p_max_value NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metric TEXT := NULLIF(BTRIM(p_metric), '');
BEGIN
  IF v_metric IS NULL THEN
    RAISE EXCEPTION 'metric is required';
  END IF;

  INSERT INTO rfm_config (
    metric,
    score,
    min_value,
    max_value
  )
  VALUES (
    v_metric,
    p_score,
    p_min_value,
    p_max_value
  )
  ON CONFLICT (metric, score) DO UPDATE
  SET
    min_value = EXCLUDED.min_value,
    max_value = EXCLUDED.max_value;
END;
$$;

CREATE OR REPLACE FUNCTION seed_default_rfm_reference()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO rfm_config (metric, score, min_value, max_value) VALUES
    ('recency', 5, 0, 15),
    ('recency', 4, 16, 30),
    ('recency', 3, 31, 60),
    ('recency', 2, 61, 120),
    ('recency', 1, 121, 9999),
    ('frequency', 5, 10, 9999),
    ('frequency', 4, 7, 9),
    ('frequency', 3, 4, 6),
    ('frequency', 2, 2, 3),
    ('frequency', 1, 1, 1),
    ('monetary', 5, 10000, 999999),
    ('monetary', 4, 5000, 9999),
    ('monetary', 3, 2000, 4999),
    ('monetary', 2, 500, 1999),
    ('monetary', 1, 0, 499)
  ON CONFLICT (metric, score) DO NOTHING;

  INSERT INTO rfm_segments (segment_name, r_scores, f_scores, m_scores, color, priority, recommended_action, communication_frequency_days) VALUES
    ('Champions', '{5}', '{5}', '{5}', '#22c55e33', 1, 'VIP-оффери, ексклюзив', 7),
    ('Loyal', '{4,5}', '{3,4,5}', '{3,4,5}', '#3b82f633', 2, 'Upsell, програма лояльності', 5),
    ('Potential Loyal', '{4,5}', '{1,2}', '{1,2}', '#8b5cf633', 3, 'Стимулювати 2-3 покупку', 5),
    ('New Customers', '{5}', '{1}', '{1}', '#06b6d433', 4, 'Welcome flow, onboarding', 3),
    ('Promising', '{3,4}', '{1,2}', '{1,2}', '#f59e0b33', 5, 'Нагадування, знижка', 5),
    ('Need Attention', '{3}', '{3,4}', '{3,4}', '#f9731633', 6, 'Реактивація, спеціальна акція', 3),
    ('About To Sleep', '{2,3}', '{2,3}', '{2,3}', '#ef444433', 7, 'Win-back м''який', 3),
    ('At Risk', '{1,2}', '{3,4,5}', '{3,4,5}', '#dc262633', 8, 'Win-back терміновий (цінні!)', 2),
    ('Can''t Lose Them', '{1}', '{5}', '{5}', '#991b1b33', 9, 'Агресивний win-back, дзвінок', 1),
    ('Hibernating', '{1,2}', '{1,2}', '{1,2}', '#6b728033', 10, 'Останній шанс або відпустити', 7),
    ('Lost', '{1}', '{1}', '{1}', '#37415133', 11, 'Не витрачати ресурси', 30)
  ON CONFLICT (segment_name) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION get_rfm_segments_list() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_rfm_config_list() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION upsert_rfm_segment(TEXT, INTEGER[], INTEGER[], INTEGER[], TEXT, INTEGER, TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION upsert_rfm_config(TEXT, INTEGER, NUMERIC, NUMERIC) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION seed_default_rfm_reference() TO anon, authenticated;
