-- =====================================================
-- CRM RETENTION PLATFORM v4 — Повна SQL-схема
-- Supabase PostgreSQL
-- =====================================================

-- ═══ РОЗШИРЕННЯ ═══
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════
-- БЛОК A: ТОВАРИ
-- ═══════════════════════════════════════════════════

-- A1. Довідник товарів
CREATE TABLE IF NOT EXISTS products (
  barcode TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  usage_days INTEGER NOT NULL DEFAULT 30,
  category TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  cross_sell_barcodes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- A2. Невідомі штрихкоди
CREATE TABLE IF NOT EXISTS unknown_barcodes (
  barcode TEXT PRIMARY KEY,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  seen_count INTEGER DEFAULT 1,
  last_order_id BIGINT,
  sample_name TEXT
);

-- ═══════════════════════════════════════════════════
-- БЛОК B: КЛІЄНТИ
-- ═══════════════════════════════════════════════════

-- B1. Профіль клієнта — центральна таблиця
CREATE TABLE IF NOT EXISTS clients (
  client_id BIGINT PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  instagram TEXT,
  source_id INTEGER,
  first_order_date DATE,
  last_order_date DATE,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  avg_order_value NUMERIC(10,2) DEFAULT 0,
  rfm_recency INTEGER,
  rfm_frequency INTEGER,
  rfm_monetary INTEGER,
  rfm_segment TEXT,
  rfm_updated_at TIMESTAMPTZ,
  loyalty_tier TEXT DEFAULT 'bronze',
  loyalty_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  churn_risk TEXT DEFAULT 'low',
  preferred_channel TEXT DEFAULT 'instagram',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B2. Історія замовлень
CREATE TABLE IF NOT EXISTS client_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id BIGINT REFERENCES clients(client_id),
  order_id BIGINT UNIQUE NOT NULL,
  order_date DATE,
  status_id INTEGER,
  source_id INTEGER,
  total_amount NUMERIC(10,2) DEFAULT 0,
  products_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B3. Товари в замовленнях
CREATE TABLE IF NOT EXISTS client_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id BIGINT,
  client_id BIGINT REFERENCES clients(client_id),
  barcode TEXT,
  product_name TEXT,
  quantity INTEGER DEFAULT 1,
  price NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- БЛОК C: КОМУНІКАЦІЇ
-- ═══════════════════════════════════════════════════

-- C1. Лог усіх комунікацій
CREATE TABLE IF NOT EXISTS communication_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id BIGINT REFERENCES clients(client_id),
  communication_type TEXT NOT NULL,
  channel TEXT,
  template_id TEXT,
  message_preview TEXT,
  pipeline_card_id BIGINT,
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  ab_variant TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- C2. Шаблони повідомлень
CREATE TABLE IF NOT EXISTS communication_templates (
  id TEXT PRIMARY KEY,
  communication_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  subject TEXT,
  body_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  ab_variant TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- БЛОК D: АВТОМАТИЗАЦІЇ
-- ═══════════════════════════════════════════════════

-- D1. Покупки клієнтів (для replenishment)
CREATE TABLE IF NOT EXISTS client_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id BIGINT REFERENCES clients(client_id),
  barcode TEXT,
  product_name TEXT,
  quantity INTEGER DEFAULT 1,
  usage_days INTEGER,
  total_usage_days INTEGER,
  purchase_date DATE,
  expected_end_date DATE,
  reminder_date DATE,
  reminder_sent BOOLEAN DEFAULT FALSE,
  source_channel TEXT DEFAULT 'webhook',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, barcode)
);

-- D2. Черга автоматизацій
CREATE TABLE IF NOT EXISTS automation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id BIGINT REFERENCES clients(client_id),
  automation_type TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}',
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  skip_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- D3. Кандидати на повернення
CREATE TABLE IF NOT EXISTS win_back_candidates (
  client_id BIGINT REFERENCES clients(client_id) UNIQUE,
  last_order_date DATE,
  days_inactive INTEGER,
  tier TEXT,
  win_back_sent BOOLEAN DEFAULT FALSE,
  win_back_date TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════
-- БЛОК E: ЛОЯЛЬНІСТЬ
-- ═══════════════════════════════════════════════════

-- E1. Рівні програми лояльності
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  tier_name TEXT PRIMARY KEY,
  min_total_spent NUMERIC(10,2) DEFAULT 0,
  min_orders INTEGER DEFAULT 0,
  cashback_percent NUMERIC(5,2) DEFAULT 0,
  bonus_multiplier NUMERIC(3,1) DEFAULT 1.0,
  perks TEXT,
  sort_order INTEGER
);

-- E2. Транзакції балів
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id BIGINT REFERENCES clients(client_id),
  transaction_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT,
  order_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- БЛОК F: СЕГМЕНТАЦІЯ
-- ═══════════════════════════════════════════════════

-- F1. Конфігурація RFM-скорів
CREATE TABLE IF NOT EXISTS rfm_config (
  metric TEXT NOT NULL,
  score INTEGER NOT NULL,
  min_value NUMERIC,
  max_value NUMERIC,
  UNIQUE(metric, score)
);

-- F2. Визначення сегментів
CREATE TABLE IF NOT EXISTS rfm_segments (
  segment_name TEXT PRIMARY KEY,
  r_scores INTEGER[] NOT NULL,
  f_scores INTEGER[] NOT NULL,
  m_scores INTEGER[] NOT NULL,
  color TEXT,
  priority INTEGER,
  recommended_action TEXT,
  communication_frequency_days INTEGER DEFAULT 3
);

-- ═══════════════════════════════════════════════════
-- БЛОК G: АНАЛІТИКА
-- ═══════════════════════════════════════════════════

-- G1. Когортні знімки
CREATE TABLE IF NOT EXISTS cohort_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_month DATE NOT NULL,
  period_month DATE NOT NULL,
  months_since_first INTEGER,
  cohort_size INTEGER,
  active_clients INTEGER,
  retention_rate NUMERIC(5,2),
  total_revenue NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cohort_month, period_month)
);

-- G2. Щоденні метрики
CREATE TABLE IF NOT EXISTS metrics_daily (
  date DATE PRIMARY KEY,
  new_clients INTEGER DEFAULT 0,
  returning_clients INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  avg_order_value NUMERIC(10,2) DEFAULT 0,
  communications_sent INTEGER DEFAULT 0,
  communications_opened INTEGER DEFAULT 0,
  communications_clicked INTEGER DEFAULT 0
);

-- ═══════════════════════════════════════════════════
-- БЛОК H: КОНФІГУРАЦІЯ
-- ═══════════════════════════════════════════════════

-- H1. Дозволені джерела
CREATE TABLE IF NOT EXISTS allowed_sources (
  source_id INTEGER PRIMARY KEY,
  source_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- H2. Оброблені замовлення (дедуплікація)
CREATE TABLE IF NOT EXISTS processed_orders (
  order_id BIGINT PRIMARY KEY,
  source_channel TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- H3. Лог синхронізації
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type TEXT NOT NULL,
  status TEXT DEFAULT 'success',
  orders_fetched INTEGER DEFAULT 0,
  orders_new INTEGER DEFAULT 0,
  orders_skipped INTEGER DEFAULT 0,
  errors TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- H4. Глобальні налаштування
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- H5. Кампанії
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'manual',
  target_segment TEXT,
  target_clients_count INTEGER DEFAULT 0,
  channel TEXT,
  template_id TEXT,
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- ІНДЕКСИ
-- ═══════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_clients_rfm_segment ON clients(rfm_segment);
CREATE INDEX IF NOT EXISTS idx_clients_loyalty_tier ON clients(loyalty_tier);
CREATE INDEX IF NOT EXISTS idx_clients_last_order ON clients(last_order_date);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);

CREATE INDEX IF NOT EXISTS idx_client_orders_client ON client_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_client_orders_date ON client_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_client_order_items_order ON client_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_client_order_items_client ON client_order_items(client_id);

CREATE INDEX IF NOT EXISTS idx_comm_log_client ON communication_log(client_id);
CREATE INDEX IF NOT EXISTS idx_comm_log_sent ON communication_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_comm_log_type ON communication_log(communication_type);

CREATE INDEX IF NOT EXISTS idx_purchases_reminder ON client_purchases(reminder_date);
CREATE INDEX IF NOT EXISTS idx_purchases_client ON client_purchases(client_id);

CREATE INDEX IF NOT EXISTS idx_auto_queue_status ON automation_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_auto_queue_client ON automation_queue(client_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_client ON loyalty_transactions(client_id);

CREATE INDEX IF NOT EXISTS idx_cohort_month ON cohort_snapshots(cohort_month);

-- ═══════════════════════════════════════════════════
-- ФУНКЦІЇ
-- ═══════════════════════════════════════════════════

-- Перевірка дозволеного джерела
CREATE OR REPLACE FUNCTION check_source_allowed(p_source_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM allowed_sources
    WHERE source_id = p_source_id AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql;

-- Перевірка обробленого замовлення
CREATE OR REPLACE FUNCTION is_order_processed(p_order_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM processed_orders WHERE order_id = p_order_id
  );
END;
$$ LANGUAGE plpgsql;

-- Позначити замовлення як оброблене
CREATE OR REPLACE FUNCTION mark_order_processed(p_order_id BIGINT, p_channel TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO processed_orders (order_id, source_channel)
  VALUES (p_order_id, p_channel)
  ON CONFLICT (order_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- UPSERT покупки (replenishment) з множенням qty × usage_days
CREATE OR REPLACE FUNCTION upsert_purchase(
  p_client_id BIGINT,
  p_barcode TEXT,
  p_product_name TEXT,
  p_quantity INTEGER,
  p_usage_days INTEGER,
  p_purchase_date DATE,
  p_source_channel TEXT DEFAULT 'webhook'
)
RETURNS VOID AS $$
DECLARE
  v_total_days INTEGER;
  v_end_date DATE;
  v_reminder DATE;
BEGIN
  v_total_days := p_quantity * p_usage_days;
  v_end_date := p_purchase_date + v_total_days;
  v_reminder := v_end_date - 3; -- нагадування за 3 дні до закінчення

  INSERT INTO client_purchases (
    client_id, barcode, product_name, quantity, usage_days,
    total_usage_days, purchase_date, expected_end_date, reminder_date,
    reminder_sent, source_channel
  ) VALUES (
    p_client_id, p_barcode, p_product_name, p_quantity, p_usage_days,
    v_total_days, p_purchase_date, v_end_date, v_reminder,
    FALSE, p_source_channel
  )
  ON CONFLICT (client_id, barcode) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    total_usage_days = EXCLUDED.total_usage_days,
    purchase_date = EXCLUDED.purchase_date,
    expected_end_date = EXCLUDED.expected_end_date,
    reminder_date = EXCLUDED.reminder_date,
    reminder_sent = FALSE,
    source_channel = EXCLUDED.source_channel,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Перевірка чи можна надіслати комунікацію
CREATE OR REPLACE FUNCTION can_send_communication(p_client_id BIGINT, p_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_interval INTEGER;
  v_count INTEGER;
BEGIN
  SELECT COALESCE(value::INTEGER, 3)
  INTO v_interval
  FROM settings
  WHERE key = 'min_communication_interval_days';

  IF v_interval IS NULL THEN v_interval := 3; END IF;

  SELECT COUNT(*) INTO v_count
  FROM communication_log
  WHERE client_id = p_client_id
    AND sent_at > NOW() - (v_interval || ' days')::INTERVAL;

  RETURN v_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Отримати нагадування на сьогодні
CREATE OR REPLACE FUNCTION get_todays_reminders()
RETURNS TABLE (
  client_id BIGINT,
  barcode TEXT,
  product_name TEXT,
  reminder_date DATE,
  expected_end_date DATE,
  purchase_date DATE,
  client_name TEXT,
  client_phone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.client_id,
    cp.barcode,
    cp.product_name,
    cp.reminder_date,
    cp.expected_end_date,
    cp.purchase_date,
    c.full_name,
    c.phone
  FROM client_purchases cp
  JOIN clients c ON c.client_id = cp.client_id
  WHERE cp.reminder_date <= CURRENT_DATE
    AND cp.reminder_sent = FALSE
  ORDER BY cp.reminder_date;
END;
$$ LANGUAGE plpgsql;

-- Лічильники для badges
CREATE OR REPLACE FUNCTION get_badge_counts()
RETURNS JSON AS $$
DECLARE
  v_unknown INTEGER;
  v_at_risk INTEGER;
  v_pending_queue INTEGER;
  v_overdue INTEGER;
  v_levelup_today INTEGER;
  v_campaigns_today INTEGER;
  v_sync_errors INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_unknown FROM unknown_barcodes;
  SELECT COUNT(*) INTO v_at_risk FROM clients WHERE rfm_segment IN ('At Risk', 'Can''t Lose Them');
  SELECT COUNT(*) INTO v_pending_queue FROM automation_queue WHERE status = 'pending';
  SELECT COUNT(*) INTO v_overdue FROM client_purchases WHERE reminder_date < CURRENT_DATE AND reminder_sent = FALSE;
  SELECT COUNT(*) INTO v_levelup_today FROM loyalty_transactions WHERE transaction_type = 'bonus' AND reason = 'level_up' AND created_at::DATE = CURRENT_DATE;
  SELECT COUNT(*) INTO v_campaigns_today FROM campaigns WHERE scheduled_at::DATE = CURRENT_DATE AND status = 'scheduled';
  SELECT COUNT(*) INTO v_sync_errors FROM sync_log WHERE status = 'error' AND started_at > NOW() - INTERVAL '24 hours';

  RETURN json_build_object(
    'unknown_barcodes', v_unknown,
    'at_risk', v_at_risk,
    'pending_queue', v_pending_queue,
    'overdue_reminders', v_overdue,
    'levelup_today', v_levelup_today,
    'campaigns_today', v_campaigns_today,
    'sync_errors', v_sync_errors
  );
END;
$$ LANGUAGE plpgsql;

-- Розрахувати статистику клієнта
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
  SELECT
    COUNT(*), COALESCE(SUM(total_amount), 0), COALESCE(AVG(total_amount), 0),
    MIN(order_date), MAX(order_date)
  INTO v_total_orders, v_total_spent, v_avg_order, v_first_date, v_last_date
  FROM client_orders WHERE client_id = p_client_id;

  v_days_since := CURRENT_DATE - v_last_date;

  -- Визначити churn_risk
  IF v_days_since <= 30 THEN v_churn := 'low';
  ELSIF v_days_since <= 90 THEN v_churn := 'medium';
  ELSE v_churn := 'high';
  END IF;

  -- Визначити loyalty tier
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

-- Додати бонусні бали
CREATE OR REPLACE FUNCTION add_loyalty_points(
  p_client_id BIGINT,
  p_points INTEGER,
  p_reason TEXT,
  p_order_id BIGINT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO loyalty_transactions (client_id, transaction_type, points, reason, order_id)
  VALUES (p_client_id, 'earn', p_points, p_reason, p_order_id);

  UPDATE clients SET
    loyalty_points = loyalty_points + p_points,
    updated_at = NOW()
  WHERE client_id = p_client_id;
END;
$$ LANGUAGE plpgsql;

-- RFM розрахунок для одного клієнта
CREATE OR REPLACE FUNCTION calculate_rfm(p_client_id BIGINT)
RETURNS VOID AS $$
DECLARE
  v_days INTEGER;
  v_orders INTEGER;
  v_spent NUMERIC;
  v_r INTEGER;
  v_f INTEGER;
  v_m INTEGER;
  v_segment TEXT;
BEGIN
  SELECT
    CURRENT_DATE - last_order_date,
    total_orders,
    total_spent
  INTO v_days, v_orders, v_spent
  FROM clients WHERE client_id = p_client_id;

  -- Recency score (менше днів = кращий скор)
  SELECT score INTO v_r FROM rfm_config
  WHERE metric = 'recency' AND v_days >= min_value AND v_days <= max_value
  LIMIT 1;
  IF v_r IS NULL THEN v_r := 1; END IF;

  -- Frequency score
  SELECT score INTO v_f FROM rfm_config
  WHERE metric = 'frequency' AND v_orders >= min_value AND v_orders <= max_value
  LIMIT 1;
  IF v_f IS NULL THEN v_f := 1; END IF;

  -- Monetary score
  SELECT score INTO v_m FROM rfm_config
  WHERE metric = 'monetary' AND v_spent >= min_value AND v_spent <= max_value
  LIMIT 1;
  IF v_m IS NULL THEN v_m := 1; END IF;

  -- Визначити сегмент
  SELECT segment_name INTO v_segment
  FROM rfm_segments
  WHERE v_r = ANY(r_scores) AND v_f = ANY(f_scores) AND v_m = ANY(m_scores)
  ORDER BY priority LIMIT 1;

  IF v_segment IS NULL THEN v_segment := 'Hibernating'; END IF;

  UPDATE clients SET
    rfm_recency = v_r,
    rfm_frequency = v_f,
    rfm_monetary = v_m,
    rfm_segment = v_segment,
    rfm_updated_at = NOW(),
    updated_at = NOW()
  WHERE client_id = p_client_id;
END;
$$ LANGUAGE plpgsql;

-- Перерахувати RFM для всіх
CREATE OR REPLACE FUNCTION recalculate_all_rfm()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_client RECORD;
BEGIN
  FOR v_client IN SELECT client_id FROM clients WHERE total_orders > 0 LOOP
    PERFORM calculate_rfm(v_client.client_id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Генерація когортного знімка
CREATE OR REPLACE FUNCTION generate_cohort_snapshot(p_month DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO cohort_snapshots (cohort_month, period_month, months_since_first, cohort_size, active_clients, retention_rate, total_revenue)
  SELECT
    DATE_TRUNC('month', c.first_order_date)::DATE AS cohort_month,
    p_month AS period_month,
    EXTRACT(YEAR FROM AGE(p_month, DATE_TRUNC('month', c.first_order_date))) * 12
      + EXTRACT(MONTH FROM AGE(p_month, DATE_TRUNC('month', c.first_order_date))) AS months_since_first,
    COUNT(DISTINCT c.client_id) AS cohort_size,
    COUNT(DISTINCT co.client_id) AS active_clients,
    ROUND(COUNT(DISTINCT co.client_id)::NUMERIC / NULLIF(COUNT(DISTINCT c.client_id), 0) * 100, 2),
    COALESCE(SUM(co.total_amount), 0)
  FROM clients c
  LEFT JOIN client_orders co ON co.client_id = c.client_id
    AND DATE_TRUNC('month', co.order_date) = DATE_TRUNC('month', p_month)
  WHERE c.first_order_date IS NOT NULL
    AND DATE_TRUNC('month', c.first_order_date) <= p_month
  GROUP BY DATE_TRUNC('month', c.first_order_date)
  ON CONFLICT (cohort_month, period_month) DO UPDATE SET
    active_clients = EXCLUDED.active_clients,
    retention_rate = EXCLUDED.retention_rate,
    total_revenue = EXCLUDED.total_revenue;
END;
$$ LANGUAGE plpgsql;

-- Оновити щоденні метрики
CREATE OR REPLACE FUNCTION update_daily_metrics(p_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS VOID AS $$
BEGIN
  INSERT INTO metrics_daily (date, new_clients, returning_clients, total_orders, total_revenue, avg_order_value, communications_sent, communications_opened, communications_clicked)
  SELECT
    p_date,
    (SELECT COUNT(*) FROM clients WHERE first_order_date = p_date),
    (SELECT COUNT(DISTINCT client_id) FROM client_orders WHERE order_date = p_date AND client_id IN (SELECT client_id FROM clients WHERE first_order_date < p_date)),
    (SELECT COUNT(*) FROM client_orders WHERE order_date = p_date),
    (SELECT COALESCE(SUM(total_amount), 0) FROM client_orders WHERE order_date = p_date),
    (SELECT COALESCE(AVG(total_amount), 0) FROM client_orders WHERE order_date = p_date),
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

-- Кандидати на win-back
CREATE OR REPLACE FUNCTION get_win_back_candidates()
RETURNS TABLE (
  client_id BIGINT,
  full_name TEXT,
  last_order DATE,
  days_inactive INTEGER,
  tier TEXT,
  rfm_segment TEXT
) AS $$
DECLARE
  v_warm INTEGER;
BEGIN
  SELECT COALESCE(value::INTEGER, 30) INTO v_warm FROM settings WHERE key = 'win_back_warm_days';
  IF v_warm IS NULL THEN v_warm := 30; END IF;

  RETURN QUERY
  SELECT
    c.client_id,
    c.full_name,
    c.last_order_date,
    (CURRENT_DATE - c.last_order_date)::INTEGER,
    CASE
      WHEN (CURRENT_DATE - c.last_order_date) BETWEEN v_warm AND v_warm * 2 THEN 'warm'
      WHEN (CURRENT_DATE - c.last_order_date) BETWEEN v_warm * 2 AND v_warm * 4 THEN 'cold'
      ELSE 'lost'
    END,
    c.rfm_segment
  FROM clients c
  WHERE c.last_order_date IS NOT NULL
    AND (CURRENT_DATE - c.last_order_date) >= v_warm
    AND c.is_active = TRUE
  ORDER BY c.last_order_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Статус синхронізації
CREATE OR REPLACE FUNCTION get_sync_status()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'webhook', (SELECT json_build_object('last_at', MAX(processed_at), 'count', COUNT(*)) FROM processed_orders WHERE source_channel = 'webhook'),
    'hourly', (SELECT json_build_object('last_at', MAX(processed_at), 'count', COUNT(*)) FROM processed_orders WHERE source_channel = 'hourly'),
    'manual', (SELECT json_build_object('last_at', MAX(processed_at), 'count', COUNT(*)) FROM processed_orders WHERE source_channel = 'manual')
  );
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════
-- ПОЧАТКОВІ ДАНІ
-- ═══════════════════════════════════════════════════

-- Налаштування
INSERT INTO settings (key, value, description) VALUES
  ('min_communication_interval_days', '3', 'Мін. днів між повідомленнями клієнту'),
  ('win_back_warm_days', '30', 'Днів без покупки для warm win-back'),
  ('win_back_cold_days', '60', 'Днів без покупки для cold win-back'),
  ('win_back_lost_days', '120', 'Днів без покупки для lost'),
  ('loyalty_points_per_uah', '1', 'Балів за 1 грн покупки'),
  ('rfm_update_frequency', 'weekly', 'Як часто перераховувати RFM')
ON CONFLICT (key) DO NOTHING;

-- Рівні лояльності
INSERT INTO loyalty_tiers (tier_name, min_total_spent, min_orders, cashback_percent, bonus_multiplier, perks, sort_order) VALUES
  ('bronze', 0, 1, 3, 1.0, 'Базові привілеї', 1),
  ('silver', 2000, 3, 5, 1.5, 'Безкоштовна доставка', 2),
  ('gold', 5000, 7, 7, 2.0, 'Ранній доступ до новинок', 3),
  ('platinum', 15000, 15, 10, 3.0, 'VIP підтримка, персональний менеджер', 4)
ON CONFLICT (tier_name) DO NOTHING;

-- RFM конфігурація
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

-- RFM сегменти
INSERT INTO rfm_segments (segment_name, r_scores, f_scores, m_scores, color, priority, recommended_action, communication_frequency_days) VALUES
  ('Champions', '{5}', '{5}', '{5}', '#22c55e', 1, 'VIP-оффери, ексклюзив', 7),
  ('Loyal', '{4,5}', '{3,4,5}', '{3,4,5}', '#3b82f6', 2, 'Upsell, програма лояльності', 5),
  ('Potential Loyal', '{4,5}', '{1,2}', '{1,2}', '#8b5cf6', 3, 'Стимулювати 2-3 покупку', 5),
  ('New Customers', '{5}', '{1}', '{1}', '#06b6d4', 4, 'Welcome flow, onboarding', 3),
  ('Promising', '{3,4}', '{1,2}', '{1,2}', '#f59e0b', 5, 'Нагадування, знижка', 5),
  ('Need Attention', '{3}', '{3,4}', '{3,4}', '#f97316', 6, 'Реактивація, спеціальна акція', 3),
  ('About To Sleep', '{2,3}', '{2,3}', '{2,3}', '#ef4444', 7, 'Win-back м''який', 3),
  ('At Risk', '{1,2}', '{3,4,5}', '{3,4,5}', '#dc2626', 8, 'Win-back терміновий (цінні!)', 2),
  ('Can''t Lose Them', '{1}', '{5}', '{5}', '#991b1b', 9, 'Агресивний win-back, дзвінок', 1),
  ('Hibernating', '{1,2}', '{1,2}', '{1,2}', '#6b7280', 10, 'Останній шанс або відпустити', 7),
  ('Lost', '{1}', '{1}', '{1}', '#374151', 11, 'Не витрачати ресурси', 30)
ON CONFLICT (segment_name) DO NOTHING;

-- Дозволені джерела
INSERT INTO allowed_sources (source_id, source_name, is_active) VALUES
  (1, 'Instagram', TRUE),
  (2, 'Сайт', TRUE),
  (3, 'Телефон', TRUE),
  (4, 'Rozetka', TRUE),
  (5, 'Prom.ua', FALSE)
ON CONFLICT (source_id) DO NOTHING;

-- Шаблони комунікацій
INSERT INTO communication_templates (id, communication_type, channel, subject, body_template, ab_variant) VALUES
  ('replenishment_sms', 'replenishment', 'sms', NULL, '{{name}}, ваш {{product}} закінчується! Замовте зі знижкою -10% 💆‍♀️', NULL),
  ('replenishment_instagram', 'replenishment', 'instagram', NULL, 'Привіт, {{name}}! 👋 Ваш {{product}} скоро закінчиться. Хочете замовити ще? Для вас знижка -10%!', NULL),
  ('welcome_sms_1', 'welcome', 'sms', NULL, '{{name}}, дякуємо за першу покупку! Ваш бонус: 50 балів 🎁', 'A'),
  ('welcome_sms_1b', 'welcome', 'sms', NULL, 'Вітаємо, {{name}}! 🎉 Вам нараховано 50 бонусних балів за першу покупку!', 'B'),
  ('welcome_sms_2', 'welcome', 'sms', NULL, '{{name}}, як вам наш {{product}}? Потрібна допомога з використанням?', NULL),
  ('welcome_sms_3', 'welcome', 'sms', NULL, '{{name}}, ось що ще обирають наші клієнти: {{cross_sell}}', NULL),
  ('welcome_sms_4', 'welcome', 'sms', NULL, '{{name}}, спеціально для вас: знижка -15% на друге замовлення! Код: WELCOME15', NULL),
  ('winback_warm_sms', 'win_back', 'sms', NULL, '{{name}}, ми сумуємо! Ось персональна знижка -10% 💝', NULL),
  ('winback_cold_sms', 'win_back', 'sms', NULL, '{{name}}, давно не бачились! Подарунок при замовленні від 500 грн 🎁', NULL),
  ('winback_lost_sms', 'win_back', 'sms', NULL, '{{name}}, останній шанс! Ексклюзивна пропозиція -20% тільки для вас ⚡', NULL),
  ('post_purchase_1', 'post_purchase', 'sms', NULL, '{{name}}, ваше замовлення доставлено! Все ок? 📦', NULL),
  ('post_purchase_2', 'post_purchase', 'sms', NULL, '{{name}}, як вам {{product}}? Оцініть від 1 до 5 ⭐', NULL),
  ('post_purchase_3', 'post_purchase', 'sms', NULL, '{{name}}, вам також може сподобатись: {{cross_sell}}', NULL),
  ('post_purchase_4', 'post_purchase', 'sms', NULL, '{{name}}, залиште відгук і отримайте 100 бонусних балів! ✍️', NULL),
  ('abandoned_cart_1', 'abandoned_cart', 'sms', NULL, '{{name}}, ви забули оформити замовлення! Ваші товари чекають 🛒', NULL),
  ('abandoned_cart_2', 'abandoned_cart', 'sms', NULL, '{{name}}, ваш кошик сумує! Завершіть покупку зі знижкою -5% 🎁', NULL)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════
-- ТЕСТОВІ ДАНІ
-- ═══════════════════════════════════════════════════

-- Товари (косметика)
INSERT INTO products (barcode, name, usage_days, category, price, cross_sell_barcodes) VALUES
  ('4820001001', 'Шампунь відновлюючий 250мл', 30, 'Шампуні', 285.00, '{4820001002,4820001003}'),
  ('4820001002', 'Кондиціонер зволожуючий 250мл', 30, 'Кондиціонери', 310.00, '{4820001001,4820001004}'),
  ('4820001003', 'Маска для волосся 200мл', 45, 'Маски', 420.00, '{4820001001,4820001002}'),
  ('4820001004', 'Олія для волосся 100мл', 60, 'Олії', 380.00, '{4820001001,4820001003}'),
  ('4820001005', 'Крем для обличчя денний 50мл', 30, 'Креми', 520.00, '{4820001006,4820001007}'),
  ('4820001006', 'Крем для обличчя нічний 50мл', 30, 'Креми', 580.00, '{4820001005,4820001007}'),
  ('4820001007', 'Сироватка гіалуронова 30мл', 45, 'Сироватки', 720.00, '{4820001005,4820001006}'),
  ('4820001008', 'Тонік для обличчя 150мл', 30, 'Тоніки', 340.00, '{4820001005,4820001009}'),
  ('4820001009', 'Міцелярна вода 400мл', 45, 'Очищення', 290.00, '{4820001008,4820001005}'),
  ('4820001010', 'Крем для рук 75мл', 20, 'Креми', 165.00, '{4820001011,4820001005}'),
  ('4820001011', 'Бальзам для губ 15мл', 15, 'Бальзами', 95.00, '{4820001010}'),
  ('4820001012', 'Скраб для тіла 200мл', 60, 'Скраби', 350.00, '{4820001013}'),
  ('4820001013', 'Лосьйон для тіла 300мл', 30, 'Лосьйони', 320.00, '{4820001012}'),
  ('4820001014', 'SPF крем 50мл', 30, 'Захист від сонця', 450.00, '{4820001005,4820001007}'),
  ('4820001015', 'Набір "Догляд за обличчям"', 45, 'Набори', 1350.00, '{4820001005,4820001006,4820001007}')
ON CONFLICT (barcode) DO NOTHING;

-- Невідомі штрихкоди
INSERT INTO unknown_barcodes (barcode, seen_count, sample_name) VALUES
  ('9999000001', 3, 'Невідомий товар з замовлення #1234'),
  ('9999000002', 1, 'Пробник з акції')
ON CONFLICT (barcode) DO NOTHING;

-- Тестові клієнти (50 клієнтів)
INSERT INTO clients (client_id, full_name, phone, email, instagram, source_id, first_order_date, last_order_date, total_orders, total_spent, avg_order_value, rfm_recency, rfm_frequency, rfm_monetary, rfm_segment, loyalty_tier, loyalty_points, is_active, churn_risk, preferred_channel, tags) VALUES
  (1001, 'Олена Коваленко', '+380501234567', 'olena.k@gmail.com', 'olena_beauty', 1, '2024-03-15', '2026-03-28', 18, 16200.00, 900.00, 5, 5, 5, 'Champions', 'platinum', 4200, TRUE, 'low', 'instagram', '{VIP,постійний}'),
  (1002, 'Марія Шевченко', '+380671234568', 'maria.s@gmail.com', 'maria_shev', 1, '2024-05-20', '2026-03-25', 14, 11800.00, 842.86, 5, 5, 5, 'Champions', 'gold', 3100, TRUE, 'low', 'instagram', '{VIP}'),
  (1003, 'Анна Бондаренко', '+380931234569', 'anna.b@gmail.com', NULL, 2, '2024-07-10', '2026-03-20', 11, 8900.00, 809.09, 5, 4, 4, 'Loyal', 'gold', 2400, TRUE, 'low', 'sms', '{лояльний}'),
  (1004, 'Катерина Мельник', '+380501234570', 'kate.m@gmail.com', 'kate_mel', 1, '2024-09-01', '2026-03-15', 9, 6750.00, 750.00, 5, 4, 4, 'Loyal', 'gold', 1800, TRUE, 'low', 'instagram', '{}'),
  (1005, 'Юлія Ткаченко', '+380671234571', NULL, 'yulia_tk', 1, '2024-11-05', '2026-03-10', 7, 4200.00, 600.00, 5, 3, 3, 'Loyal', 'silver', 1100, TRUE, 'low', 'instagram', '{}'),
  (1006, 'Наталія Іванова', '+380931234572', 'natalia.i@gmail.com', NULL, 2, '2025-01-15', '2026-03-05', 5, 3100.00, 620.00, 4, 3, 3, 'Loyal', 'silver', 820, TRUE, 'low', 'email', '{}'),
  (1007, 'Оксана Петренко', '+380501234573', NULL, 'oksana_petr', 1, '2025-03-20', '2026-03-01', 4, 2600.00, 650.00, 4, 2, 3, 'Potential Loyal', 'silver', 680, TRUE, 'low', 'instagram', '{}'),
  (1008, 'Вікторія Сидоренко', '+380671234574', 'vika.s@gmail.com', NULL, 2, '2025-05-10', '2026-02-28', 3, 1850.00, 616.67, 4, 2, 2, 'Potential Loyal', 'bronze', 480, TRUE, 'low', 'sms', '{}'),
  (1009, 'Тетяна Кравченко', '+380931234575', NULL, 'tanya_kr', 1, '2025-07-01', '2026-02-20', 3, 2100.00, 700.00, 4, 2, 3, 'Potential Loyal', 'silver', 550, TRUE, 'low', 'instagram', '{}'),
  (1010, 'Ірина Мороз', '+380501234576', 'iryna.m@gmail.com', NULL, 3, '2025-08-15', '2026-02-15', 2, 1200.00, 600.00, 4, 2, 2, 'Potential Loyal', 'bronze', 310, TRUE, 'low', 'sms', '{}'),
  (1011, 'Людмила Павленко', '+380671234577', NULL, NULL, 2, '2026-03-25', '2026-03-25', 1, 520.00, 520.00, 5, 1, 1, 'New Customers', 'bronze', 50, TRUE, 'low', 'sms', '{новий}'),
  (1012, 'Дарина Лисенко', '+380931234578', 'daryna.l@gmail.com', 'daryna_l', 1, '2026-03-20', '2026-03-20', 1, 720.00, 720.00, 5, 1, 1, 'New Customers', 'bronze', 50, TRUE, 'low', 'instagram', '{новий}'),
  (1013, 'Софія Гончар', '+380501234579', NULL, 'sofia_g', 1, '2026-03-18', '2026-03-18', 1, 340.00, 340.00, 5, 1, 1, 'New Customers', 'bronze', 50, TRUE, 'low', 'instagram', '{новий}'),
  (1014, 'Алла Руденко', '+380671234580', 'alla.r@gmail.com', NULL, 2, '2026-03-15', '2026-03-15', 1, 285.00, 285.00, 5, 1, 1, 'New Customers', 'bronze', 50, TRUE, 'low', 'email', '{новий}'),
  (1015, 'Валентина Козлова', '+380931234581', NULL, NULL, 3, '2026-03-10', '2026-03-10', 1, 450.00, 450.00, 5, 1, 1, 'New Customers', 'bronze', 50, TRUE, 'low', 'sms', '{новий}'),
  (1016, 'Олександра Попова', '+380501234582', 'alex.p@gmail.com', 'alex_pop', 1, '2025-06-01', '2026-02-25', 2, 890.00, 445.00, 4, 2, 2, 'Promising', 'bronze', 230, TRUE, 'low', 'instagram', '{}'),
  (1017, 'Яна Кузьменко', '+380671234583', NULL, 'yana_k', 1, '2025-08-10', '2026-02-18', 2, 650.00, 325.00, 4, 2, 2, 'Promising', 'bronze', 170, TRUE, 'low', 'instagram', '{}'),
  (1018, 'Христина Бойко', '+380931234584', 'krystyna.b@gmail.com', NULL, 2, '2025-09-20', '2026-02-10', 2, 760.00, 380.00, 4, 2, 2, 'Promising', 'bronze', 200, TRUE, 'low', 'sms', '{}'),
  (1019, 'Діана Савченко', '+380501234585', NULL, 'diana_s', 1, '2025-10-01', '2026-01-20', 2, 580.00, 290.00, 3, 2, 2, 'Promising', 'bronze', 150, TRUE, 'low', 'instagram', '{}'),
  (1020, 'Поліна Зайцева', '+380671234586', 'polina.z@gmail.com', NULL, 2, '2025-11-15', '2026-01-10', 1, 420.00, 420.00, 3, 1, 1, 'Promising', 'bronze', 50, TRUE, 'low', 'email', '{}'),
  (1021, 'Лариса Федоренко', '+380931234587', NULL, NULL, 3, '2024-06-15', '2025-12-20', 6, 3800.00, 633.33, 3, 3, 3, 'Need Attention', 'silver', 1000, TRUE, 'medium', 'sms', '{}'),
  (1022, 'Галина Мартиненко', '+380501234588', 'galyna.m@gmail.com', 'galyna_m', 1, '2024-08-20', '2025-12-15', 5, 3200.00, 640.00, 3, 3, 3, 'Need Attention', 'silver', 840, TRUE, 'medium', 'instagram', '{}'),
  (1023, 'Зоя Григоренко', '+380671234589', NULL, NULL, 2, '2024-10-10', '2025-12-01', 4, 2800.00, 700.00, 3, 2, 3, 'Need Attention', 'silver', 730, TRUE, 'medium', 'sms', '{}'),
  (1024, 'Вероніка Тимченко', '+380931234590', 'veronika.t@gmail.com', NULL, 2, '2024-12-01', '2025-11-15', 4, 2400.00, 600.00, 3, 2, 2, 'About To Sleep', 'bronze', 630, TRUE, 'medium', 'email', '{}'),
  (1025, 'Стефанія Левченко', '+380501234591', NULL, 'stefania_l', 1, '2025-01-20', '2025-11-01', 3, 1900.00, 633.33, 3, 2, 2, 'About To Sleep', 'bronze', 500, TRUE, 'medium', 'instagram', '{}'),
  (1026, 'Адріана Харченко', '+380671234592', 'adriana.h@gmail.com', NULL, 2, '2025-02-10', '2025-10-20', 3, 2200.00, 733.33, 2, 2, 3, 'About To Sleep', 'silver', 580, TRUE, 'medium', 'sms', '{}'),
  (1027, 'Єлизавета Власенко', '+380931234593', NULL, 'liza_v', 1, '2024-04-10', '2025-10-05', 8, 6400.00, 800.00, 2, 4, 4, 'At Risk', 'gold', 1680, TRUE, 'high', 'instagram', '{цінний}'),
  (1028, 'Маргарита Романенко', '+380501234594', 'margo.r@gmail.com', NULL, 2, '2024-06-20', '2025-09-30', 7, 5600.00, 800.00, 2, 3, 4, 'At Risk', 'gold', 1470, TRUE, 'high', 'email', '{цінний}'),
  (1029, 'Аліна Кириченко', '+380671234595', NULL, 'alina_k', 1, '2024-08-15', '2025-09-15', 6, 4800.00, 800.00, 1, 3, 4, 'At Risk', 'silver', 1260, TRUE, 'high', 'instagram', '{}'),
  (1030, 'Віталіна Демченко', '+380931234596', 'vitalina.d@gmail.com', NULL, 3, '2024-10-01', '2025-08-20', 5, 3500.00, 700.00, 1, 3, 3, 'At Risk', 'silver', 920, TRUE, 'high', 'sms', '{}'),
  (1031, 'Ангеліна Панченко', '+380501234597', NULL, NULL, 2, '2024-02-10', '2025-08-01', 12, 12500.00, 1041.67, 1, 5, 5, 'Can''t Lose Them', 'platinum', 3280, TRUE, 'high', 'sms', '{VIP,втрачаємо}'),
  (1032, 'Роксолана Островська', '+380671234598', 'roxy.o@gmail.com', 'roxy_beauty', 1, '2024-03-25', '2025-07-15', 10, 9800.00, 980.00, 1, 5, 4, 'Can''t Lose Them', 'gold', 2570, TRUE, 'high', 'instagram', '{VIP,втрачаємо}'),
  (1033, 'Емілія Юрченко', '+380931234599', NULL, NULL, 3, '2025-04-10', '2025-09-10', 2, 480.00, 240.00, 1, 2, 1, 'Hibernating', 'bronze', 130, TRUE, 'high', 'sms', '{}'),
  (1034, 'Лілія Олійник', '+380501234600', 'liliya.o@gmail.com', NULL, 2, '2025-05-15', '2025-08-25', 2, 350.00, 175.00, 1, 2, 1, 'Hibernating', 'bronze', 90, TRUE, 'high', 'email', '{}'),
  (1035, 'Мілана Гаврилюк', '+380671234601', NULL, 'milana_g', 1, '2025-06-20', '2025-09-05', 1, 290.00, 290.00, 1, 1, 1, 'Hibernating', 'bronze', 50, FALSE, 'high', 'instagram', '{}'),
  (1036, 'Карина Стеценко', '+380931234602', NULL, NULL, 3, '2025-03-10', '2025-07-20', 2, 410.00, 205.00, 1, 2, 1, 'Hibernating', 'bronze', 110, FALSE, 'high', 'sms', '{}'),
  (1037, 'Злата Діденко', '+380501234603', 'zlata.d@gmail.com', NULL, 2, '2025-01-05', '2025-06-10', 1, 165.00, 165.00, 1, 1, 1, 'Lost', 'bronze', 0, FALSE, 'high', 'email', '{}'),
  (1038, 'Мирослава Андрієнко', '+380671234604', NULL, NULL, 3, '2024-11-20', '2025-05-15', 1, 285.00, 285.00, 1, 1, 1, 'Lost', 'bronze', 0, FALSE, 'high', 'sms', '{}'),
  (1039, 'Ніка Гордієнко', '+380931234605', NULL, 'nika_g', 1, '2024-09-10', '2025-04-20', 1, 520.00, 520.00, 1, 1, 1, 'Lost', 'bronze', 0, FALSE, 'high', 'instagram', '{}'),
  (1040, 'Аріна Назаренко', '+380501234606', 'arina.n@gmail.com', NULL, 2, '2024-07-15', '2025-03-10', 1, 340.00, 340.00, 1, 1, 1, 'Lost', 'bronze', 0, FALSE, 'high', 'email', '{}'),
  (1041, 'Євгенія Сергієнко', '+380671234607', NULL, NULL, 1, '2025-12-01', '2026-03-30', 4, 2800.00, 700.00, 5, 2, 3, 'Potential Loyal', 'silver', 730, TRUE, 'low', 'instagram', '{}'),
  (1042, 'Олена Яковенко', '+380931234608', 'olena.y@gmail.com', NULL, 2, '2025-10-15', '2026-03-28', 3, 1950.00, 650.00, 5, 2, 2, 'Potential Loyal', 'bronze', 510, TRUE, 'low', 'email', '{}'),
  (1043, 'Надія Прокопенко', '+380501234609', NULL, 'nadiya_p', 1, '2025-11-20', '2026-03-22', 3, 2350.00, 783.33, 5, 2, 3, 'Potential Loyal', 'silver', 620, TRUE, 'low', 'instagram', '{}'),
  (1044, 'Тамара Василенко', '+380671234610', NULL, NULL, 3, '2026-01-10', '2026-03-15', 2, 1100.00, 550.00, 5, 2, 2, 'Potential Loyal', 'bronze', 290, TRUE, 'low', 'sms', '{}'),
  (1045, 'Богдана Литвиненко', '+380931234611', 'bogdana.l@gmail.com', 'bogdana_l', 1, '2026-02-01', '2026-03-20', 2, 870.00, 435.00, 5, 2, 2, 'Potential Loyal', 'bronze', 230, TRUE, 'low', 'instagram', '{}'),
  (1046, 'Вероніка Даниленко', '+380501234612', NULL, NULL, 2, '2025-09-05', '2026-01-15', 3, 2100.00, 700.00, 3, 2, 3, 'Need Attention', 'silver', 550, TRUE, 'medium', 'sms', '{}'),
  (1047, 'Інна Клименко', '+380671234613', 'inna.k@gmail.com', 'inna_beauty', 1, '2025-07-20', '2026-01-05', 4, 3400.00, 850.00, 3, 2, 3, 'Need Attention', 'silver', 890, TRUE, 'medium', 'instagram', '{}'),
  (1048, 'Світлана Захарченко', '+380931234614', NULL, NULL, 3, '2025-06-10', '2025-12-28', 3, 1800.00, 600.00, 3, 2, 2, 'About To Sleep', 'bronze', 470, TRUE, 'medium', 'sms', '{}'),
  (1049, 'Раїса Баранова', '+380501234615', 'raisa.b@gmail.com', NULL, 2, '2025-04-15', '2025-12-10', 5, 4500.00, 900.00, 3, 3, 4, 'Need Attention', 'silver', 1180, TRUE, 'medium', 'email', '{}'),
  (1050, 'Ганна Степаненко', '+380671234616', NULL, 'ganna_st', 1, '2024-12-20', '2026-03-31', 8, 7200.00, 900.00, 5, 4, 4, 'Loyal', 'gold', 1890, TRUE, 'low', 'instagram', '{лояльний}')
ON CONFLICT (client_id) DO NOTHING;

-- Тестові замовлення (вибірка для ключових клієнтів)
INSERT INTO client_orders (client_id, order_id, order_date, status_id, source_id, total_amount, products_count) VALUES
  -- Champions: Олена Коваленко (1001) — 18 замовлень
  (1001, 10001, '2024-03-15', 4, 1, 850.00, 2),
  (1001, 10002, '2024-04-20', 4, 1, 920.00, 3),
  (1001, 10003, '2024-06-01', 4, 1, 780.00, 2),
  (1001, 10004, '2024-07-15', 4, 1, 1100.00, 3),
  (1001, 10005, '2024-09-01', 4, 1, 650.00, 1),
  (1001, 10006, '2024-10-20', 4, 1, 1250.00, 4),
  (1001, 10007, '2024-12-05', 4, 1, 900.00, 2),
  (1001, 10008, '2025-01-15', 4, 1, 1050.00, 3),
  (1001, 10009, '2025-03-01', 4, 1, 780.00, 2),
  (1001, 10010, '2025-04-10', 4, 1, 920.00, 2),
  (1001, 10011, '2025-05-20', 4, 1, 650.00, 1),
  (1001, 10012, '2025-07-01', 4, 1, 1100.00, 3),
  (1001, 10013, '2025-08-15', 4, 1, 850.00, 2),
  (1001, 10014, '2025-10-01', 4, 1, 780.00, 2),
  (1001, 10015, '2025-11-20', 4, 1, 1250.00, 3),
  (1001, 10016, '2026-01-05', 4, 1, 920.00, 2),
  (1001, 10017, '2026-02-15', 4, 1, 650.00, 1),
  (1001, 10018, '2026-03-28', 4, 1, 800.00, 2),
  -- Loyal: Ганна Степаненко (1050)
  (1050, 10050, '2024-12-20', 4, 1, 920.00, 2),
  (1050, 10051, '2025-02-10', 4, 1, 850.00, 2),
  (1050, 10052, '2025-04-15', 4, 1, 780.00, 2),
  (1050, 10053, '2025-06-20', 4, 1, 1100.00, 3),
  (1050, 10054, '2025-08-10', 4, 1, 650.00, 1),
  (1050, 10055, '2025-10-25', 4, 1, 1200.00, 3),
  (1050, 10056, '2026-01-15', 4, 1, 900.00, 2),
  (1050, 10057, '2026-03-31', 4, 1, 800.00, 2),
  -- New Customer: Людмила Павленко (1011)
  (1011, 10100, '2026-03-25', 4, 2, 520.00, 1),
  -- New Customer: Дарина Лисенко (1012)
  (1012, 10101, '2026-03-20', 4, 1, 720.00, 2),
  -- At Risk: Єлизавета Власенко (1027)
  (1027, 10200, '2024-04-10', 4, 1, 800.00, 2),
  (1027, 10201, '2024-06-15', 4, 1, 750.00, 2),
  (1027, 10202, '2024-08-20', 4, 1, 900.00, 2),
  (1027, 10203, '2024-11-01', 4, 1, 850.00, 2),
  (1027, 10204, '2025-01-15', 4, 1, 700.00, 2),
  (1027, 10205, '2025-04-10', 4, 1, 800.00, 2),
  (1027, 10206, '2025-07-01', 4, 1, 750.00, 2),
  (1027, 10207, '2025-10-05', 4, 1, 850.00, 2),
  -- Can't Lose: Ангеліна Панченко (1031)
  (1031, 10300, '2024-02-10', 4, 2, 1050.00, 3),
  (1031, 10301, '2024-03-20', 4, 2, 920.00, 2),
  (1031, 10302, '2024-05-01', 4, 2, 1100.00, 3),
  (1031, 10303, '2024-06-15', 4, 2, 850.00, 2),
  (1031, 10304, '2024-08-01', 4, 2, 1200.00, 3),
  (1031, 10305, '2024-09-20', 4, 2, 980.00, 2),
  (1031, 10306, '2024-11-05', 4, 2, 1100.00, 3),
  (1031, 10307, '2025-01-10', 4, 2, 1050.00, 2),
  (1031, 10308, '2025-03-15', 4, 2, 920.00, 2),
  (1031, 10309, '2025-05-01', 4, 2, 1080.00, 3),
  (1031, 10310, '2025-06-20', 4, 2, 1250.00, 3),
  (1031, 10311, '2025-08-01', 4, 2, 1000.00, 2)
ON CONFLICT (order_id) DO NOTHING;

-- Тестові позиції замовлень
INSERT INTO client_order_items (order_id, client_id, barcode, product_name, quantity, price) VALUES
  (10001, 1001, '4820001005', 'Крем для обличчя денний 50мл', 1, 520.00),
  (10001, 1001, '4820001008', 'Тонік для обличчя 150мл', 1, 340.00),
  (10018, 1001, '4820001007', 'Сироватка гіалуронова 30мл', 1, 720.00),
  (10018, 1001, '4820001011', 'Бальзам для губ 15мл', 1, 95.00),
  (10100, 1011, '4820001005', 'Крем для обличчя денний 50мл', 1, 520.00),
  (10101, 1012, '4820001001', 'Шампунь відновлюючий 250мл', 1, 285.00),
  (10101, 1012, '4820001002', 'Кондиціонер зволожуючий 250мл', 1, 310.00)
ON CONFLICT DO NOTHING;

-- Тестові покупки для replenishment
INSERT INTO client_purchases (client_id, barcode, product_name, quantity, usage_days, total_usage_days, purchase_date, expected_end_date, reminder_date, reminder_sent, source_channel) VALUES
  (1001, '4820001007', 'Сироватка гіалуронова 30мл', 1, 45, 45, '2026-03-28', '2026-05-12', '2026-05-09', FALSE, 'webhook'),
  (1001, '4820001011', 'Бальзам для губ 15мл', 2, 15, 30, '2026-03-28', '2026-04-27', '2026-04-24', FALSE, 'webhook'),
  (1001, '4820001005', 'Крем для обличчя денний 50мл', 1, 30, 30, '2026-02-15', '2026-03-17', '2026-03-14', FALSE, 'webhook'),
  (1011, '4820001005', 'Крем для обличчя денний 50мл', 1, 30, 30, '2026-03-25', '2026-04-24', '2026-04-21', FALSE, 'webhook'),
  (1012, '4820001001', 'Шампунь відновлюючий 250мл', 1, 30, 30, '2026-03-20', '2026-04-19', '2026-04-16', FALSE, 'webhook'),
  (1012, '4820001002', 'Кондиціонер зволожуючий 250мл', 1, 30, 30, '2026-03-20', '2026-04-19', '2026-04-16', FALSE, 'webhook'),
  -- Прострочені нагадування
  (1003, '4820001009', 'Міцелярна вода 400мл', 1, 45, 45, '2026-01-15', '2026-03-01', '2026-02-26', FALSE, 'hourly'),
  (1005, '4820001010', 'Крем для рук 75мл', 2, 20, 40, '2026-02-10', '2026-03-22', '2026-03-19', FALSE, 'hourly'),
  (1006, '4820001001', 'Шампунь відновлюючий 250мл', 1, 30, 30, '2026-02-20', '2026-03-22', '2026-03-19', FALSE, 'webhook')
ON CONFLICT (client_id, barcode) DO NOTHING;

-- Тестові комунікації
INSERT INTO communication_log (client_id, communication_type, channel, template_id, message_preview, status, ab_variant, sent_at, opened_at, clicked_at) VALUES
  (1001, 'replenishment', 'instagram', 'replenishment_instagram', 'Олена, ваш крем закінчується!', 'clicked', NULL, '2026-03-15 10:30:00+02', '2026-03-15 11:00:00+02', '2026-03-15 11:05:00+02'),
  (1002, 'replenishment', 'instagram', 'replenishment_instagram', 'Марія, ваша сироватка закінчується!', 'opened', NULL, '2026-03-16 10:30:00+02', '2026-03-16 14:20:00+02', NULL),
  (1003, 'replenishment', 'sms', 'replenishment_sms', 'Анна, ваш шампунь закінчується!', 'sent', NULL, '2026-03-17 10:30:00+02', NULL, NULL),
  (1011, 'welcome', 'sms', 'welcome_sms_1', 'Людмила, дякуємо за першу покупку!', 'delivered', 'A', '2026-03-25 12:00:00+02', NULL, NULL),
  (1012, 'welcome', 'instagram', 'welcome_sms_1b', 'Вітаємо, Дарина! Вам нараховано 50 балів!', 'opened', 'B', '2026-03-20 14:00:00+02', '2026-03-20 15:30:00+02', NULL),
  (1027, 'win_back', 'instagram', 'winback_warm_sms', 'Єлизавета, ми сумуємо!', 'clicked', NULL, '2026-03-01 10:00:00+02', '2026-03-01 12:00:00+02', '2026-03-01 12:10:00+02'),
  (1031, 'win_back', 'sms', 'winback_cold_sms', 'Ангеліна, давно не бачились!', 'sent', NULL, '2026-02-15 10:00:00+02', NULL, NULL),
  (1050, 'post_purchase', 'instagram', 'post_purchase_1', 'Ганна, ваше замовлення доставлено!', 'opened', NULL, '2026-04-01 11:00:00+02', '2026-04-01 13:00:00+02', NULL),
  (1004, 'replenishment', 'instagram', 'replenishment_instagram', 'Катерина, ваш тонік закінчується!', 'clicked', NULL, '2026-03-10 10:30:00+02', '2026-03-10 11:45:00+02', '2026-03-10 12:00:00+02'),
  (1005, 'campaign', 'instagram', NULL, '8 Березня! Знижка -20% на все!', 'opened', NULL, '2026-03-08 09:00:00+02', '2026-03-08 10:00:00+02', NULL),
  (1006, 'campaign', 'email', NULL, 'Весняний розпродаж!', 'clicked', NULL, '2026-03-01 08:00:00+02', '2026-03-01 09:30:00+02', '2026-03-01 09:45:00+02'),
  (1021, 'win_back', 'sms', 'winback_warm_sms', 'Лариса, ми сумуємо!', 'sent', NULL, '2026-03-20 10:00:00+02', NULL, NULL),
  (1022, 'win_back', 'instagram', 'winback_warm_sms', 'Галина, давно не бачились!', 'opened', NULL, '2026-03-18 10:00:00+02', '2026-03-18 16:00:00+02', NULL)
ON CONFLICT DO NOTHING;

-- Тестові автоматизації в черзі
INSERT INTO automation_queue (client_id, automation_type, trigger_data, scheduled_at, status, skip_reason) VALUES
  (1011, 'welcome', '{"step": 2, "product": "Крем для обличчя денний 50мл"}', '2026-04-04 12:00:00+02', 'pending', NULL),
  (1011, 'welcome', '{"step": 3, "cross_sell": ["Крем нічний", "Сироватка"]}', '2026-04-08 12:00:00+02', 'pending', NULL),
  (1011, 'welcome', '{"step": 4, "offer": "-15%"}', '2026-04-15 12:00:00+02', 'pending', NULL),
  (1012, 'welcome', '{"step": 2, "product": "Шампунь відновлюючий"}', '2026-04-02 14:00:00+02', 'pending', NULL),
  (1001, 'replenishment', '{"barcode": "4820001005", "product": "Крем для обличчя денний"}', '2026-04-03 10:00:00+02', 'pending', NULL),
  (1027, 'win_back', '{"tier": "cold", "offer": "-15%"}', '2026-04-03 10:00:00+02', 'pending', NULL),
  (1031, 'win_back', '{"tier": "lost", "offer": "-20%"}', '2026-04-03 10:00:00+02', 'pending', NULL),
  (1050, 'post_purchase', '{"step": 2, "product": "Крем денний"}', '2026-04-05 11:00:00+02', 'pending', NULL),
  -- Відправлені
  (1011, 'welcome', '{"step": 1}', '2026-03-25 12:00:00+02', 'sent', NULL),
  (1012, 'welcome', '{"step": 1}', '2026-03-20 14:00:00+02', 'sent', NULL),
  -- Скіпнуті
  (1033, 'win_back', '{"tier": "cold"}', '2026-03-20 10:00:00+02', 'skipped', 'frequency_limit')
ON CONFLICT DO NOTHING;

-- Тестові транзакції лояльності
INSERT INTO loyalty_transactions (client_id, transaction_type, points, reason, order_id, created_at) VALUES
  (1001, 'earn', 850, 'order_10001', 10001, '2024-03-15'),
  (1001, 'earn', 920, 'order_10002', 10002, '2024-04-20'),
  (1001, 'earn', 500, 'level_up', NULL, '2024-04-20'),
  (1001, 'earn', 800, 'order_10018', 10018, '2026-03-28'),
  (1001, 'spend', -300, 'discount_order_10015', 10015, '2025-11-20'),
  (1001, 'earn', 200, 'birthday', NULL, '2025-06-15'),
  (1011, 'earn', 50, 'welcome_bonus', NULL, '2026-03-25'),
  (1012, 'earn', 50, 'welcome_bonus', NULL, '2026-03-20'),
  (1012, 'earn', 720, 'order_10101', 10101, '2026-03-20'),
  (1050, 'earn', 920, 'order_10050', 10050, '2024-12-20'),
  (1050, 'earn', 800, 'order_10057', 10057, '2026-03-31'),
  (1050, 'earn', 500, 'level_up', NULL, '2025-06-20'),
  (1031, 'earn', 1050, 'order_10300', 10300, '2024-02-10'),
  (1031, 'earn', 500, 'level_up', NULL, '2024-05-01'),
  (1031, 'earn', 500, 'level_up', NULL, '2024-09-20'),
  (1027, 'earn', 800, 'order_10200', 10200, '2024-04-10'),
  (1027, 'earn', 500, 'level_up', NULL, '2025-01-15')
ON CONFLICT DO NOTHING;

-- Тестові когортні дані
INSERT INTO cohort_snapshots (cohort_month, period_month, months_since_first, cohort_size, active_clients, retention_rate, total_revenue) VALUES
  ('2024-03-01', '2024-03-01', 0, 8, 8, 100.00, 7200.00),
  ('2024-03-01', '2024-04-01', 1, 8, 5, 62.50, 4600.00),
  ('2024-03-01', '2024-05-01', 2, 8, 4, 50.00, 3800.00),
  ('2024-03-01', '2024-06-01', 3, 8, 6, 75.00, 5200.00),
  ('2024-03-01', '2024-07-01', 4, 8, 3, 37.50, 2800.00),
  ('2024-03-01', '2024-08-01', 5, 8, 4, 50.00, 3600.00),
  ('2024-03-01', '2024-09-01', 6, 8, 3, 37.50, 2500.00),
  ('2024-03-01', '2024-10-01', 7, 8, 3, 37.50, 3100.00),
  ('2024-03-01', '2024-11-01', 8, 8, 4, 50.00, 3900.00),
  ('2024-03-01', '2024-12-01', 9, 8, 3, 37.50, 2700.00),
  ('2024-03-01', '2025-01-01', 10, 8, 4, 50.00, 3800.00),
  ('2024-03-01', '2025-02-01', 11, 8, 2, 25.00, 1700.00),
  ('2024-03-01', '2025-03-01', 12, 8, 3, 37.50, 2500.00),
  ('2024-06-01', '2024-06-01', 0, 6, 6, 100.00, 5400.00),
  ('2024-06-01', '2024-07-01', 1, 6, 4, 66.67, 3200.00),
  ('2024-06-01', '2024-08-01', 2, 6, 3, 50.00, 2700.00),
  ('2024-06-01', '2024-09-01', 3, 6, 4, 66.67, 3500.00),
  ('2024-06-01', '2024-10-01', 4, 6, 2, 33.33, 1800.00),
  ('2024-06-01', '2024-11-01', 5, 6, 3, 50.00, 2900.00),
  ('2024-06-01', '2024-12-01', 6, 6, 3, 50.00, 2600.00),
  ('2024-09-01', '2024-09-01', 0, 5, 5, 100.00, 4200.00),
  ('2024-09-01', '2024-10-01', 1, 5, 3, 60.00, 2400.00),
  ('2024-09-01', '2024-11-01', 2, 5, 3, 60.00, 2500.00),
  ('2024-09-01', '2024-12-01', 3, 5, 2, 40.00, 1600.00),
  ('2024-12-01', '2024-12-01', 0, 7, 7, 100.00, 5800.00),
  ('2024-12-01', '2025-01-01', 1, 7, 4, 57.14, 3200.00),
  ('2024-12-01', '2025-02-01', 2, 7, 3, 42.86, 2500.00),
  ('2024-12-01', '2025-03-01', 3, 7, 4, 57.14, 3400.00),
  ('2025-03-01', '2025-03-01', 0, 5, 5, 100.00, 4100.00),
  ('2025-03-01', '2025-04-01', 1, 5, 3, 60.00, 2300.00),
  ('2025-03-01', '2025-05-01', 2, 5, 3, 60.00, 2500.00),
  ('2025-06-01', '2025-06-01', 0, 4, 4, 100.00, 3200.00),
  ('2025-06-01', '2025-07-01', 1, 4, 2, 50.00, 1500.00),
  ('2025-06-01', '2025-08-01', 2, 4, 2, 50.00, 1400.00),
  ('2025-09-01', '2025-09-01', 0, 3, 3, 100.00, 2100.00),
  ('2025-09-01', '2025-10-01', 1, 3, 2, 66.67, 1600.00),
  ('2025-12-01', '2025-12-01', 0, 4, 4, 100.00, 3600.00),
  ('2025-12-01', '2026-01-01', 1, 4, 3, 75.00, 2800.00),
  ('2025-12-01', '2026-02-01', 2, 4, 2, 50.00, 1900.00),
  ('2025-12-01', '2026-03-01', 3, 4, 3, 75.00, 2600.00),
  ('2026-03-01', '2026-03-01', 0, 6, 6, 100.00, 4800.00)
ON CONFLICT (cohort_month, period_month) DO NOTHING;

-- Тестові щоденні метрики (останні 30 днів)
INSERT INTO metrics_daily (date, new_clients, returning_clients, total_orders, total_revenue, avg_order_value, communications_sent, communications_opened, communications_clicked) VALUES
  ('2026-03-04', 1, 3, 4, 2800.00, 700.00, 5, 3, 1),
  ('2026-03-05', 0, 4, 4, 3200.00, 800.00, 3, 2, 1),
  ('2026-03-06', 1, 2, 3, 1950.00, 650.00, 4, 2, 0),
  ('2026-03-07', 0, 3, 3, 2400.00, 800.00, 6, 4, 2),
  ('2026-03-08', 2, 5, 7, 5600.00, 800.00, 12, 8, 4),
  ('2026-03-09', 0, 2, 2, 1200.00, 600.00, 2, 1, 0),
  ('2026-03-10', 1, 3, 4, 2900.00, 725.00, 5, 3, 1),
  ('2026-03-11', 0, 2, 2, 1500.00, 750.00, 3, 1, 0),
  ('2026-03-12', 1, 4, 5, 3800.00, 760.00, 4, 3, 1),
  ('2026-03-13', 0, 3, 3, 2200.00, 733.33, 5, 2, 1),
  ('2026-03-14', 1, 2, 3, 1800.00, 600.00, 3, 2, 1),
  ('2026-03-15', 1, 4, 5, 3600.00, 720.00, 6, 4, 2),
  ('2026-03-16', 0, 3, 3, 2100.00, 700.00, 4, 2, 1),
  ('2026-03-17', 0, 2, 2, 1400.00, 700.00, 3, 1, 0),
  ('2026-03-18', 1, 3, 4, 2800.00, 700.00, 5, 3, 2),
  ('2026-03-19', 0, 4, 4, 3100.00, 775.00, 4, 2, 1),
  ('2026-03-20', 2, 3, 5, 3500.00, 700.00, 7, 4, 2),
  ('2026-03-21', 0, 2, 2, 1300.00, 650.00, 2, 1, 0),
  ('2026-03-22', 0, 3, 3, 2400.00, 800.00, 3, 2, 1),
  ('2026-03-23', 1, 2, 3, 1900.00, 633.33, 4, 2, 1),
  ('2026-03-24', 0, 4, 4, 3200.00, 800.00, 5, 3, 2),
  ('2026-03-25', 2, 3, 5, 3800.00, 760.00, 6, 4, 2),
  ('2026-03-26', 0, 2, 2, 1400.00, 700.00, 3, 1, 0),
  ('2026-03-27', 1, 3, 4, 2600.00, 650.00, 4, 2, 1),
  ('2026-03-28', 0, 5, 5, 4200.00, 840.00, 5, 3, 2),
  ('2026-03-29', 1, 2, 3, 1800.00, 600.00, 3, 2, 1),
  ('2026-03-30', 0, 3, 3, 2300.00, 766.67, 4, 2, 1),
  ('2026-03-31', 1, 4, 5, 3900.00, 780.00, 6, 4, 2),
  ('2026-04-01', 0, 3, 3, 2100.00, 700.00, 4, 2, 1),
  ('2026-04-02', 1, 2, 3, 1700.00, 566.67, 3, 2, 1)
ON CONFLICT (date) DO NOTHING;

-- Тестові кампанії
INSERT INTO campaigns (name, type, target_segment, target_clients_count, channel, template_id, scheduled_at, status, sent_count, opened_count, clicked_count, conversion_count) VALUES
  ('8 Березня — знижка 20%', 'seasonal', 'all', 45, 'multi', NULL, '2026-03-08 09:00:00+02', 'sent', 45, 28, 12, 5),
  ('Весняний розпродаж', 'manual', 'Loyal', 18, 'email', NULL, '2026-03-01 08:00:00+02', 'sent', 18, 11, 6, 3),
  ('Нова колекція кремів', 'manual', 'Champions', 8, 'instagram', NULL, '2026-04-05 10:00:00+02', 'scheduled', 0, 0, 0, 0),
  ('Win-Back квітень', 'manual', 'At Risk', 12, 'sms', 'winback_warm_sms', '2026-04-10 10:00:00+02', 'draft', 0, 0, 0, 0),
  ('Великдень — подарунок', 'seasonal', 'all', 50, 'multi', NULL, '2026-04-20 09:00:00+02', 'draft', 0, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- Тестові win-back кандидати
INSERT INTO win_back_candidates (client_id, last_order_date, days_inactive, tier, win_back_sent, win_back_date) VALUES
  (1027, '2025-10-05', 180, 'cold', TRUE, '2026-03-01'),
  (1028, '2025-09-30', 185, 'cold', TRUE, '2026-02-15'),
  (1029, '2025-09-15', 200, 'lost', FALSE, NULL),
  (1030, '2025-08-20', 226, 'lost', FALSE, NULL),
  (1031, '2025-08-01', 245, 'lost', TRUE, '2026-02-15'),
  (1032, '2025-07-15', 262, 'lost', TRUE, '2026-01-20'),
  (1033, '2025-09-10', 205, 'lost', FALSE, NULL),
  (1034, '2025-08-25', 221, 'lost', FALSE, NULL),
  (1024, '2025-11-15', 139, 'cold', FALSE, NULL),
  (1025, '2025-11-01', 153, 'cold', FALSE, NULL),
  (1026, '2025-10-20', 165, 'cold', FALSE, NULL)
ON CONFLICT (client_id) DO NOTHING;

-- Sync log
INSERT INTO sync_log (sync_type, status, orders_fetched, orders_new, orders_skipped, started_at, finished_at) VALUES
  ('webhook', 'success', 1, 1, 0, '2026-04-02 15:30:00+02', '2026-04-02 15:30:01+02'),
  ('hourly', 'success', 12, 3, 9, '2026-04-02 14:00:00+02', '2026-04-02 14:00:15+02'),
  ('webhook', 'success', 1, 1, 0, '2026-04-02 13:15:00+02', '2026-04-02 13:15:01+02'),
  ('hourly', 'success', 8, 2, 6, '2026-04-02 13:00:00+02', '2026-04-02 13:00:12+02'),
  ('manual', 'success', 45, 5, 40, '2026-04-01 10:00:00+02', '2026-04-01 10:02:30+02'),
  ('hourly', 'error', 0, 0, 0, '2026-03-31 12:00:00+02', '2026-03-31 12:00:05+02'),
  ('initial_import', 'success', 1250, 1250, 0, '2026-03-01 02:00:00+02', '2026-03-01 02:45:00+02')
ON CONFLICT DO NOTHING;

-- Processed orders
INSERT INTO processed_orders (order_id, source_channel, processed_at) VALUES
  (10001, 'webhook', '2024-03-15'),
  (10018, 'webhook', '2026-03-28'),
  (10100, 'webhook', '2026-03-25'),
  (10101, 'webhook', '2026-03-20'),
  (10050, 'hourly', '2024-12-20'),
  (10057, 'webhook', '2026-03-31')
ON CONFLICT (order_id) DO NOTHING;

-- ═══════════════════════════════════════════════════
-- ГОТОВО! Схема CRM Retention Platform v4
-- ═══════════════════════════════════════════════════
