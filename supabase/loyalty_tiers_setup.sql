ALTER TABLE loyalty_tiers DISABLE ROW LEVEL SECURITY;

GRANT SELECT ON loyalty_tiers TO anon, authenticated;

DROP FUNCTION IF EXISTS get_loyalty_tiers_list();
DROP FUNCTION IF EXISTS upsert_loyalty_tier(TEXT, NUMERIC, INTEGER, NUMERIC, NUMERIC, TEXT, INTEGER);
DROP FUNCTION IF EXISTS seed_default_loyalty_tiers();

CREATE OR REPLACE FUNCTION get_loyalty_tiers_list()
RETURNS TABLE (
  tier_name TEXT,
  min_total_spent NUMERIC,
  min_orders INTEGER,
  cashback_percent NUMERIC,
  bonus_multiplier NUMERIC,
  perks TEXT,
  sort_order INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    tier_name,
    min_total_spent,
    min_orders,
    cashback_percent,
    bonus_multiplier,
    perks,
    sort_order
  FROM loyalty_tiers
  ORDER BY sort_order ASC, min_total_spent ASC;
$$;

CREATE OR REPLACE FUNCTION upsert_loyalty_tier(
  p_tier_name TEXT,
  p_min_total_spent NUMERIC,
  p_min_orders INTEGER,
  p_cashback_percent NUMERIC,
  p_bonus_multiplier NUMERIC,
  p_perks TEXT,
  p_sort_order INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier_name TEXT := NULLIF(BTRIM(p_tier_name), '');
BEGIN
  IF v_tier_name IS NULL THEN
    RAISE EXCEPTION 'tier_name is required';
  END IF;

  INSERT INTO loyalty_tiers (
    tier_name,
    min_total_spent,
    min_orders,
    cashback_percent,
    bonus_multiplier,
    perks,
    sort_order
  )
  VALUES (
    v_tier_name,
    COALESCE(p_min_total_spent, 0),
    COALESCE(p_min_orders, 0),
    COALESCE(p_cashback_percent, 0),
    COALESCE(p_bonus_multiplier, 1),
    COALESCE(NULLIF(BTRIM(p_perks), ''), ''),
    COALESCE(p_sort_order, 999)
  )
  ON CONFLICT (tier_name) DO UPDATE
  SET
    min_total_spent = EXCLUDED.min_total_spent,
    min_orders = EXCLUDED.min_orders,
    cashback_percent = EXCLUDED.cashback_percent,
    bonus_multiplier = EXCLUDED.bonus_multiplier,
    perks = EXCLUDED.perks,
    sort_order = EXCLUDED.sort_order;
END;
$$;

CREATE OR REPLACE FUNCTION seed_default_loyalty_tiers()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO loyalty_tiers (tier_name, min_total_spent, min_orders, cashback_percent, bonus_multiplier, perks, sort_order) VALUES
    ('bronze', 0, 1, 3, 1.0, 'Базові привілеї', 1),
    ('silver', 2000, 3, 5, 1.5, 'Безкоштовна доставка', 2),
    ('gold', 5000, 7, 7, 2.0, 'Ранній доступ до новинок', 3),
    ('platinum', 15000, 15, 10, 3.0, 'VIP підтримка, персональний менеджер', 4)
  ON CONFLICT (tier_name) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION get_loyalty_tiers_list() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION upsert_loyalty_tier(TEXT, NUMERIC, INTEGER, NUMERIC, NUMERIC, TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION seed_default_loyalty_tiers() TO anon, authenticated;
