-- =====================================================
-- PRODUCT CATEGORIES SETUP
-- =====================================================

ALTER TABLE products
ADD COLUMN IF NOT EXISTS brand TEXT;

DROP FUNCTION IF EXISTS get_product_summary();
DROP FUNCTION IF EXISTS get_product_brands_summary();
DROP FUNCTION IF EXISTS get_product_brands_list();
DROP FUNCTION IF EXISTS create_product_brand(TEXT);
DROP FUNCTION IF EXISTS create_product_brand(TEXT, TEXT);
DROP FUNCTION IF EXISTS rename_product_brand(TEXT, TEXT);
DROP FUNCTION IF EXISTS rename_product_brand(TEXT, TEXT, TEXT);

CREATE TABLE IF NOT EXISTS product_categories (
  category_name TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_brands (
  brand_name TEXT PRIMARY KEY,
  brand_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_brands
ADD COLUMN IF NOT EXISTS brand_color TEXT;

INSERT INTO product_categories (category_name)
SELECT DISTINCT p.category
FROM products p
WHERE p.category IS NOT NULL
  AND BTRIM(p.category) <> ''
ON CONFLICT (category_name) DO NOTHING;

INSERT INTO product_brands (brand_name)
SELECT DISTINCT p.brand
FROM products p
WHERE p.brand IS NOT NULL
  AND BTRIM(p.brand) <> ''
ON CONFLICT (brand_name) DO NOTHING;

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

CREATE OR REPLACE FUNCTION create_product_category(p_category TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category TEXT := NULLIF(BTRIM(p_category), '');
BEGIN
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Category name cannot be empty';
  END IF;

  INSERT INTO product_categories (category_name)
  VALUES (v_category)
  ON CONFLICT (category_name) DO NOTHING;
END;
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

CREATE OR REPLACE FUNCTION create_product_brand(p_brand TEXT, p_brand_color TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand TEXT := NULLIF(BTRIM(p_brand), '');
  v_brand_color TEXT := NULLIF(BTRIM(p_brand_color), '');
BEGIN
  IF v_brand IS NULL THEN
    RAISE EXCEPTION 'Brand name cannot be empty';
  END IF;

  INSERT INTO product_brands (brand_name, brand_color)
  VALUES (v_brand, v_brand_color)
  ON CONFLICT (brand_name) DO UPDATE
  SET brand_color = COALESCE(EXCLUDED.brand_color, product_brands.brand_color);
END;
$$;

CREATE OR REPLACE FUNCTION rename_product_category(p_old_category TEXT, p_new_category TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_category TEXT := NULLIF(BTRIM(p_old_category), '');
  v_new_category TEXT := NULLIF(BTRIM(p_new_category), '');
BEGIN
  IF v_old_category IS NULL OR v_new_category IS NULL THEN
    RAISE EXCEPTION 'Category names cannot be empty';
  END IF;

  INSERT INTO product_categories (category_name)
  VALUES (v_new_category)
  ON CONFLICT (category_name) DO NOTHING;

  UPDATE products
  SET category = v_new_category
  WHERE category = v_old_category;

  DELETE FROM product_categories
  WHERE category_name = v_old_category;
END;
$$;

CREATE OR REPLACE FUNCTION rename_product_brand(p_old_brand TEXT, p_new_brand TEXT, p_brand_color TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_brand TEXT := NULLIF(BTRIM(p_old_brand), '');
  v_new_brand TEXT := NULLIF(BTRIM(p_new_brand), '');
  v_brand_color TEXT := NULLIF(BTRIM(p_brand_color), '');
BEGIN
  IF v_old_brand IS NULL OR v_new_brand IS NULL THEN
    RAISE EXCEPTION 'Brand names cannot be empty';
  END IF;

  INSERT INTO product_brands (brand_name, brand_color)
  VALUES (
    v_new_brand,
    COALESCE(
      v_brand_color,
      (SELECT brand_color FROM product_brands WHERE brand_name = v_old_brand LIMIT 1)
    )
  )
  ON CONFLICT (brand_name) DO UPDATE
  SET brand_color = COALESCE(EXCLUDED.brand_color, product_brands.brand_color);

  UPDATE products
  SET brand = v_new_brand
  WHERE brand = v_old_brand;

  DELETE FROM product_brands
  WHERE brand_name = v_old_brand;
END;
$$;

CREATE OR REPLACE FUNCTION delete_product_category(p_category TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category TEXT := NULLIF(BTRIM(p_category), '');
BEGIN
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Category name cannot be empty';
  END IF;

  UPDATE products
  SET category = NULL
  WHERE category = v_category;

  DELETE FROM product_categories
  WHERE category_name = v_category;
END;
$$;

CREATE OR REPLACE FUNCTION delete_product_brand(p_brand TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand TEXT := NULLIF(BTRIM(p_brand), '');
BEGIN
  IF v_brand IS NULL THEN
    RAISE EXCEPTION 'Brand name cannot be empty';
  END IF;

  UPDATE products
  SET brand = NULL
  WHERE brand = v_brand;

  DELETE FROM product_brands
  WHERE brand_name = v_brand;
END;
$$;

GRANT EXECUTE ON FUNCTION get_product_summary() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_product_categories_summary() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_product_categories_list() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_product_category(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rename_product_category(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_product_category(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_product_brands_summary() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_product_brands_list() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_product_brand(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rename_product_brand(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_product_brand(TEXT) TO anon, authenticated;
