-- Add order status change timestamp support and align purchases/reminders to it.

ALTER TABLE client_orders
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_client_orders_status_changed_at
  ON client_orders (status_changed_at DESC);

UPDATE client_orders
SET status_changed_at = order_date::timestamptz
WHERE status_changed_at IS NULL
  AND order_date IS NOT NULL;

CREATE OR REPLACE FUNCTION trg_after_order_item_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_purchase_date DATE;
BEGIN
  SELECT COALESCE(status_changed_at::DATE, order_date)
    INTO v_purchase_date
  FROM client_orders
  WHERE order_id = NEW.order_id
  LIMIT 1;

  IF v_purchase_date IS NULL THEN
    v_purchase_date := CURRENT_DATE;
  END IF;

  PERFORM upsert_purchase(
    NEW.client_id,
    NEW.barcode,
    NEW.product_name,
    NEW.quantity,
    v_purchase_date,
    'sync'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

WITH latest_purchase_dates AS (
  SELECT
    coi.client_id,
    coi.barcode,
    MAX(COALESCE(co.status_changed_at::DATE, co.order_date)) AS purchase_date
  FROM client_order_items coi
  JOIN client_orders co
    ON co.order_id = coi.order_id
  GROUP BY coi.client_id, coi.barcode
)
UPDATE client_purchases cp
SET purchase_date = lpd.purchase_date,
    expected_end_date = lpd.purchase_date + cp.total_usage_days,
    reminder_date = lpd.purchase_date + cp.total_usage_days - 3,
    updated_at = NOW()
FROM latest_purchase_dates lpd
WHERE cp.client_id = lpd.client_id
  AND cp.barcode = lpd.barcode
  AND lpd.purchase_date IS NOT NULL;
