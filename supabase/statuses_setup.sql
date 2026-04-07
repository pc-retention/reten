-- 1. Створення таблиці (якщо раптом вона не створилась)
CREATE TABLE IF NOT EXISTS allowed_order_statuses (
  status_id INTEGER PRIMARY KEY,
  status_name TEXT NOT NULL,
  group_name TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE allowed_order_statuses
ADD COLUMN IF NOT EXISTS color TEXT;

ALTER TABLE allowed_sources
ADD COLUMN IF NOT EXISTS color TEXT;

-- 2. ВИМКНЕННЯ RLS (найчастіша причина, чому фронтенд бачить 0 рядків)
ALTER TABLE allowed_order_statuses DISABLE ROW LEVEL SECURITY;
GRANT ALL ON allowed_order_statuses TO anon, authenticated, service_role;

-- 3. Примусове додавання всіх статусів (з вашого скріншоту KeyCRM)
INSERT INTO allowed_order_statuses (status_id, status_name, group_name, is_active) VALUES
  (1, 'НОВИЙ', '1', false),
  (2, 'В ОБРОБЦІ', '2', false),
  (3, 'ОЧІКУВАННЯ ОПЛАТИ', '2', false),
  (4, 'УЗГОДЖЕНЕ', '2', false),
  (42, 'УЗГОДЖЕНЕ ПОВТОРНО(проблемні)', '2', false),
  (44, 'УЗГОДЖЕНЕ ТЕРМІНОВЕ', '2', false),
  (8, 'Готується до відправлення', '4', false),
  (23, 'ЗБИРАЄТЬСЯ', '4', false),
  (32, 'Очікує збірки', '4', false),
  (33, 'Зібрано', '4', false),
  (24, 'Очікується наявність', '2', false),
  (43, 'ПРОБЛЕМНЕ ЗАМОВЛЕННЯ', '2', false),
  (46, 'ПЕРЕДЗАМОВЛЕННЯ НОВИНКИ', '2', false),
  (37, 'Переробка', '3', false),
  (21, 'ВІДПРАВЛЕНЕ', '4', false),
  (25, 'Прибуло на відділення', '4', false),
  (26, 'ВІДМОВА ОДЕРЖУВАЧА', '4', false),
  (12, 'ВИКОНАНО', '5', true),  
  (35, 'БРАК', '5', false),
  (36, 'Утилізовано', '5', false),
  (48, 'Розсилка', '5', false),
  (13, 'incorrect_data', '6', false),
  (14, 'underbid', '6', false),
  (15, 'not_available', '6', false),
  (16, 'bought_elsewhere', '6', false),
  (17, 'delivery_did_not_arrange', '6', false),
  (18, 'did_not_arrange_price', '6', false),
  (19, 'canceled', '6', false),
  (20, 'Повернення', '6', false),
  (27, 'ОБ''ЄДНАЛИ З ІНШИМ ЗАМОВЛЕННЯМ', '6', false),
  (28, 'НЕ ДОЧЕКАЛИСЯ ОПЛАТУ', '6', false),
  (30, 'Дублікат', '6', false),
  (31, 'клієнт передумав', '6', false),
  (34, 'Клієнт нічого не замовляв', '6', false),
  (39, 'Поверненно на склад', '6', false),
  (47, 'СКАСОВАНЕ СПЛАЧЕНЕ', '6', false)
ON CONFLICT (status_id) DO UPDATE SET 
  status_name = EXCLUDED.status_name,
  group_name = EXCLUDED.group_name;

-- 4. Оновлення функції підрахунку аналітики
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
BEGIN
  -- ТЕПЕР МИ РАХУЄМО ТІЛЬКИ ДОЗВОЛЕНІ СТАТУСИ!
  SELECT
    COUNT(co.*), COALESCE(SUM(co.total_amount), 0), COALESCE(AVG(co.total_amount), 0),
    MIN(co.order_date), MAX(co.order_date)
  INTO v_total_orders, v_total_spent, v_avg_order, v_first_date, v_last_date
  FROM client_orders co
  JOIN allowed_order_statuses aos ON co.status_id = aos.status_id
  WHERE co.client_id = p_client_id AND aos.is_active = TRUE;

  v_days_since := CURRENT_DATE - v_last_date;

  IF v_days_since <= 30 THEN v_churn := 'low';
  ELSIF v_days_since <= 90 THEN v_churn := 'medium';
  ELSE v_churn := 'high';
  END IF;

  SELECT tier_name INTO v_new_tier
  FROM loyalty_tiers
  WHERE v_total_spent >= min_total_spent AND v_total_orders >= min_orders
  ORDER BY sort_order DESC LIMIT 1;

  IF v_new_tier IS NULL THEN v_new_tier := 'bronze'; END IF;

  UPDATE clients SET
    total_orders = v_total_orders,
    total_spent = v_total_spent,
    avg_order_value = v_avg_order,
    first_order_date = v_first_date,
    last_order_date = v_last_date,
    churn_risk = v_churn,
    is_active = (v_days_since <= 120),
    loyalty_tier = v_new_tier,
    updated_at = NOW()
  WHERE client_id = p_client_id;
END;
$$ LANGUAGE plpgsql;
