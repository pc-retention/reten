-- Тригер, який оновлює дати нагадувань, якщо ви змінили "Днів використання" в товарах!

CREATE OR REPLACE FUNCTION trg_after_product_usage_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Якщо дні використання змінилися
  IF OLD.usage_days IS DISTINCT FROM NEW.usage_days THEN
    UPDATE client_purchases
    SET 
      usage_days = NEW.usage_days,
      total_usage_days = quantity * NEW.usage_days,
      expected_end_date = purchase_date + (quantity * NEW.usage_days),
      reminder_date = (purchase_date + (quantity * NEW.usage_days)) - 3
    WHERE barcode = NEW.barcode 
      AND reminder_sent = FALSE; -- Оновлюємо тільки ті, що ще в майбутньому або не відправлені
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_usage_update_reminders ON products;
CREATE TRIGGER trg_product_usage_update_reminders
AFTER UPDATE OF usage_days ON products
FOR EACH ROW
EXECUTE FUNCTION trg_after_product_usage_update();

-- ОДНОРАЗОВА СИНХРОНІЗАЦІЯ (backfill) щоб виправити всі існуючі нагадування прямо зараз
DO $$
BEGIN
  UPDATE client_purchases cp
  SET 
    usage_days = p.usage_days,
    total_usage_days = cp.quantity * p.usage_days,
    expected_end_date = cp.purchase_date + (cp.quantity * p.usage_days),
    reminder_date = (cp.purchase_date + (cp.quantity * p.usage_days)) - 3
  FROM products p
  WHERE cp.barcode = p.barcode 
    AND cp.reminder_sent = FALSE
    AND cp.usage_days IS DISTINCT FROM p.usage_days;
END;
$$;
