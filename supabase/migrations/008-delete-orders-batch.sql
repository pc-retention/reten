CREATE OR REPLACE FUNCTION delete_orders_batch(p_order_ids BIGINT[])
RETURNS TABLE (
  deleted_orders BIGINT,
  deleted_order_items BIGINT,
  deleted_loyalty_transactions BIGINT,
  deleted_processed_orders BIGINT,
  rebuilt_purchases BIGINT,
  updated_clients BIGINT,
  recalculated_rfm INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_orders BIGINT := 0;
  v_deleted_order_items BIGINT := 0;
  v_deleted_loyalty_transactions BIGINT := 0;
  v_deleted_processed_orders BIGINT := 0;
  v_rebuilt_purchases BIGINT := 0;
  v_updated_clients BIGINT := 0;
  v_recalculated_rfm INTEGER := 0;
  v_order_ids BIGINT[];
BEGIN
  v_order_ids := ARRAY(
    SELECT DISTINCT order_id
    FROM unnest(COALESCE(p_order_ids, ARRAY[]::BIGINT[])) AS order_id
    WHERE order_id IS NOT NULL
  );

  IF COALESCE(array_length(v_order_ids, 1), 0) = 0 THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::INTEGER;
    RETURN;
  END IF;

  CREATE TEMP TABLE tmp_delete_order_pairs (
    client_id BIGINT,
    barcode TEXT
  ) ON COMMIT DROP;

  INSERT INTO tmp_delete_order_pairs (client_id, barcode)
  SELECT DISTINCT
    coi.client_id,
    coi.barcode
  FROM client_order_items coi
  WHERE coi.order_id = ANY(v_order_ids)
    AND coi.client_id IS NOT NULL
    AND coi.barcode IS NOT NULL;

  DELETE FROM loyalty_transactions
  WHERE order_id = ANY(v_order_ids);
  GET DIAGNOSTICS v_deleted_loyalty_transactions = ROW_COUNT;

  DELETE FROM processed_orders
  WHERE order_id = ANY(v_order_ids);
  GET DIAGNOSTICS v_deleted_processed_orders = ROW_COUNT;

  DELETE FROM client_order_items
  WHERE order_id = ANY(v_order_ids);
  GET DIAGNOSTICS v_deleted_order_items = ROW_COUNT;

  DELETE FROM client_orders
  WHERE order_id = ANY(v_order_ids);
  GET DIAGNOSTICS v_deleted_orders = ROW_COUNT;

  DELETE FROM client_purchases cp
  USING tmp_delete_order_pairs pairs
  WHERE cp.client_id = pairs.client_id
    AND cp.barcode = pairs.barcode;

  INSERT INTO client_purchases (
    client_id,
    barcode,
    product_name,
    quantity,
    usage_days,
    total_usage_days,
    purchase_date,
    expected_end_date,
    reminder_date,
    reminder_sent,
    source_channel
  )
  SELECT
    latest_remaining.client_id,
    latest_remaining.barcode,
    latest_remaining.product_name,
    latest_remaining.quantity,
    latest_remaining.usage_days,
    latest_remaining.quantity * latest_remaining.usage_days AS total_usage_days,
    latest_remaining.purchase_date,
    latest_remaining.purchase_date + (latest_remaining.quantity * latest_remaining.usage_days) AS expected_end_date,
    latest_remaining.purchase_date + (latest_remaining.quantity * latest_remaining.usage_days) - 3 AS reminder_date,
    FALSE,
    'delete_orders_batch'
  FROM (
    SELECT DISTINCT ON (coi.client_id, coi.barcode)
      coi.client_id,
      coi.barcode,
      coi.product_name,
      COALESCE(coi.quantity, 1) AS quantity,
      COALESCE(p.usage_days, 30) AS usage_days,
      COALESCE(co.status_changed_at::DATE, co.order_date, CURRENT_DATE) AS purchase_date
    FROM client_order_items coi
    JOIN client_orders co
      ON co.order_id = coi.order_id
    JOIN tmp_delete_order_pairs pairs
      ON pairs.client_id = coi.client_id
     AND pairs.barcode = coi.barcode
    LEFT JOIN products p
      ON p.barcode = coi.barcode
    WHERE COALESCE(p.is_active, TRUE) = TRUE
    ORDER BY
      coi.client_id,
      coi.barcode,
      COALESCE(co.status_changed_at::DATE, co.order_date, CURRENT_DATE) DESC,
      co.order_id DESC,
      coi.created_at DESC,
      coi.id DESC
  ) AS latest_remaining
  ON CONFLICT (client_id, barcode) DO UPDATE SET
    product_name = EXCLUDED.product_name,
    quantity = EXCLUDED.quantity,
    usage_days = EXCLUDED.usage_days,
    total_usage_days = EXCLUDED.total_usage_days,
    purchase_date = EXCLUDED.purchase_date,
    expected_end_date = EXCLUDED.expected_end_date,
    reminder_date = EXCLUDED.reminder_date,
    reminder_sent = FALSE,
    source_channel = EXCLUDED.source_channel,
    updated_at = NOW();
  GET DIAGNOSTICS v_rebuilt_purchases = ROW_COUNT;

  BEGIN
    EXECUTE 'SELECT updated_clients, recalculated_rfm FROM refresh_clients_denormalized()'
      INTO v_updated_clients, v_recalculated_rfm;
  EXCEPTION
    WHEN undefined_function THEN
      v_updated_clients := 0;
      v_recalculated_rfm := 0;
  END;

  RETURN QUERY
  SELECT
    v_deleted_orders,
    v_deleted_order_items,
    v_deleted_loyalty_transactions,
    v_deleted_processed_orders,
    v_rebuilt_purchases,
    v_updated_clients,
    v_recalculated_rfm;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_orders_batch(BIGINT[]) TO anon, authenticated;
