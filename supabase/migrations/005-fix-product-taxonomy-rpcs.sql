-- Migration 005: keep product taxonomy RPCs aligned with dictionary tables.
-- New categories/brands can exist before any product is assigned to them, so
-- summary/list RPCs must read from product_categories/product_brands instead of
-- inferring everything from products.

CREATE OR REPLACE FUNCTION get_product_summary()
RETURNS TABLE (
  active_count BIGINT,
  inactive_count BIGINT,
  unknown_count BIGINT,
  categories_count BIGINT,
  brands_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM products WHERE is_active = TRUE) AS active_count,
    (SELECT COUNT(*) FROM products WHERE is_active = FALSE) AS inactive_count,
    (SELECT COUNT(*) FROM unknown_barcodes) AS unknown_count,
    (SELECT COUNT(*) FROM product_categories) AS categories_count,
    (SELECT COUNT(*) FROM product_brands) AS brands_count;
$$;

CREATE OR REPLACE FUNCTION get_product_categories_summary()
RETURNS TABLE (
  category TEXT,
  product_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pc.category_name AS category,
    COUNT(p.barcode) AS product_count
  FROM product_categories pc
  LEFT JOIN products p
    ON p.category = pc.category_name
  GROUP BY pc.category_name
  ORDER BY product_count DESC, pc.category_name ASC;
$$;

CREATE OR REPLACE FUNCTION get_product_categories_list()
RETURNS TABLE (
  category TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pc.category_name AS category
  FROM product_categories pc
  ORDER BY pc.category_name ASC;
$$;

CREATE OR REPLACE FUNCTION get_product_brands_summary()
RETURNS TABLE (
  brand TEXT,
  product_count BIGINT,
  brand_color TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pb.brand_name AS brand,
    COUNT(p.barcode) AS product_count,
    pb.brand_color
  FROM product_brands pb
  LEFT JOIN products p
    ON p.brand = pb.brand_name
  GROUP BY pb.brand_name, pb.brand_color
  ORDER BY product_count DESC, pb.brand_name ASC;
$$;

CREATE OR REPLACE FUNCTION get_product_brands_list()
RETURNS TABLE (
  brand TEXT,
  brand_color TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pb.brand_name AS brand,
    pb.brand_color
  FROM product_brands pb
  ORDER BY pb.brand_name ASC;
$$;

GRANT EXECUTE ON FUNCTION get_product_summary() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_product_categories_summary() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_product_categories_list() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_product_brands_summary() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_product_brands_list() TO anon, authenticated;
