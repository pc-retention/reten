-- =====================================================
-- Migration 001 — Додаткові колонки для KeyCRM синку
-- Виконати в Supabase SQL Editor
-- =====================================================

-- 1. Товари: додати image_url, is_ignored, keycrm_id
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_url    TEXT,
  ADD COLUMN IF NOT EXISTS is_ignored   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS keycrm_id    INTEGER;

COMMENT ON COLUMN products.is_ignored IS 'Вимкнений товар — не генерує нагадування, не показується у фільтрах';
COMMENT ON COLUMN products.image_url   IS 'URL мініатюри з KeyCRM';
COMMENT ON COLUMN products.keycrm_id   IS 'ID товару в KeyCRM (для посилань)';

-- 2. Клієнти: додати birthday та keycrm_source_name
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS birthday          DATE,
  ADD COLUMN IF NOT EXISTS keycrm_source_name TEXT;

-- 3. Унікальний constraint на client_order_items щоб уникнути дублів
--    (один штрихкод в одному замовленні = один запис)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_order_item'
  ) THEN
    ALTER TABLE client_order_items
      ADD CONSTRAINT uq_order_item UNIQUE (order_id, barcode);
  END IF;
END $$;

-- 4. Перевір після виконання:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products';
