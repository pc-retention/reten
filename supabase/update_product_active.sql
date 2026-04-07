-- RPC: toggle product is_active flag
-- Runs as SECURITY DEFINER to bypass RLS (compatible with migration 003)

CREATE OR REPLACE FUNCTION update_product_active(
  p_barcode TEXT,
  p_is_active BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET is_active = p_is_active,
      updated_at = NOW()
  WHERE barcode = p_barcode;
END;
$$;
