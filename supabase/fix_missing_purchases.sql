-- Оновлюємо upsert_purchase щоб він самостійно шукав usage_days у таблиці products
DROP FUNCTION IF EXISTS upsert_purchase(BIGINT, TEXT, TEXT, INTEGER, INTEGER, DATE, TEXT);

CREATE OR REPLACE FUNCTION upsert_purchase(
  p_client_id BIGINT,
  p_barcode TEXT,
  p_product_name TEXT,
  p_quantity INTEGER,
  p_purchase_date DATE,
  p_source_channel TEXT DEFAULT 'keycrm'
)
RETURNS VOID AS $$
DECLARE
  v_usage_days INTEGER;
  v_is_active BOOLEAN;
  v_total_days INTEGER;
  v_end_date DATE;
  v_reminder DATE;
BEGIN
  -- Знаходимо товар та його налаштування
  SELECT usage_days, is_active INTO v_usage_days, v_is_active 
  FROM products WHERE barcode = p_barcode LIMIT 1;
  
  -- Якщо товару немає в БД (це новий товар), ставимо стандартно 30 днів
  IF v_usage_days IS NULL THEN
    v_usage_days := 30;
  END IF;

  -- Перевірка чи товар активний
  IF v_is_active IS FALSE THEN
    RETURN; -- Товар вимкнено, пропускаємо додавання до "Нагадувань"
  END IF;

  v_total_days := p_quantity * v_usage_days;
  v_end_date := p_purchase_date + v_total_days;
  v_reminder := v_end_date - 3; -- нагадування за 3 дні

  INSERT INTO client_purchases (
    client_id, barcode, product_name, quantity, usage_days,
    total_usage_days, purchase_date, expected_end_date, reminder_date,
    reminder_sent, source_channel
  ) VALUES (
    p_client_id, p_barcode, p_product_name, p_quantity, v_usage_days,
    v_total_days, p_purchase_date, v_end_date, v_reminder,
    FALSE, p_source_channel
  )
  ON CONFLICT (client_id, barcode) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    total_usage_days = EXCLUDED.total_usage_days,
    purchase_date = EXCLUDED.purchase_date,
    expected_end_date = EXCLUDED.expected_end_date,
    reminder_date = EXCLUDED.reminder_date,
    reminder_sent = FALSE, -- скидаємо статус надісланого нагадування
    source_channel = EXCLUDED.source_channel,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Тригер на всі нові замовлення з n8n
CREATE OR REPLACE FUNCTION trg_after_order_item_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_order_date DATE;
BEGIN
  SELECT COALESCE(status_changed_at::DATE, order_date)
    INTO v_order_date
  FROM client_orders
  WHERE order_id = NEW.order_id
  LIMIT 1;

  IF v_order_date IS NULL THEN
    v_order_date := CURRENT_DATE;
  END IF;
  
  PERFORM upsert_purchase(
    NEW.client_id, 
    NEW.barcode, 
    NEW.product_name, 
    NEW.quantity, 
    v_order_date, 
    'sync'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_item_upsert_purchase ON client_order_items;
CREATE TRIGGER trg_order_item_upsert_purchase
AFTER INSERT OR UPDATE ON client_order_items
FOR EACH ROW
EXECUTE FUNCTION trg_after_order_item_insert();

CREATE OR REPLACE FUNCTION rebuild_purchases_for_barcode(p_barcode TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item RECORD;
  v_date DATE;
  v_processed INTEGER := 0;
BEGIN
  FOR item IN
    SELECT *
    FROM client_order_items
    WHERE barcode = p_barcode
  LOOP
    SELECT COALESCE(status_changed_at::DATE, order_date)
      INTO v_date
    FROM client_orders
    WHERE order_id = item.order_id
    LIMIT 1;

    IF v_date IS NULL THEN
      v_date := CURRENT_DATE;
    END IF;

    PERFORM upsert_purchase(
      item.client_id,
      item.barcode,
      item.product_name,
      item.quantity,
      v_date,
      'barcode_backfill'
    );

    v_processed := v_processed + 1;
  END LOOP;

  RETURN v_processed;
END;
$$;

GRANT EXECUTE ON FUNCTION rebuild_purchases_for_barcode(TEXT) TO anon, authenticated;

-- Відновлення нагадувань на основі існуючих позицій замовлень у базі
DO $$
DECLARE
  item RECORD;
  v_date DATE;
BEGIN
  FOR item IN SELECT * FROM client_order_items LOOP
    SELECT COALESCE(status_changed_at::DATE, order_date)
      INTO v_date
    FROM client_orders
    WHERE order_id = item.order_id
    LIMIT 1;

    IF v_date IS NULL THEN
      v_date := CURRENT_DATE;
    END IF;
    
    PERFORM upsert_purchase(
      item.client_id,
      item.barcode,
      item.product_name,
      item.quantity,
      v_date,
      'backfill'
    );
  END LOOP;
END;
$$;
