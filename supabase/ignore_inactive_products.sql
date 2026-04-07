-- 1. Видалення існуючих нагадувань для вимкнених товарів (щоб очистити історію)
DELETE FROM client_purchases 
WHERE barcode IN (SELECT barcode FROM products WHERE is_active = FALSE);

-- 2. Оновлення функції додавання нових нагадувань (щоб надалі ігнорувати вимкнені)
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
  v_is_active BOOLEAN;
BEGIN
  -- Перевірка чи товар активний
  SELECT is_active INTO v_is_active FROM products WHERE barcode = p_barcode LIMIT 1;
  
  -- Якщо товар вимкнено (is_active = false), просто виходимо і нічого не записуємо
  IF v_is_active IS FALSE THEN
    RETURN; 
  END IF;

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
    source_channel = EXCLUDED.source_channel;
END;
$$ LANGUAGE plpgsql;
