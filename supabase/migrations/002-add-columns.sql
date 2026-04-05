-- =====================================================
-- Migration 002 — Колонки для KeyCRM синку (ідемпотентна)
-- Виконати в Supabase SQL Editor
-- =====================================================

-- 1. Товари: image_url, is_ignored, keycrm_id
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url   TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_ignored  BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS keycrm_id   INTEGER;

-- 2. Клієнти: birthday, keycrm_source_name
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birthday           DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS keycrm_source_name TEXT;

-- 3. Унікальний constraint на client_order_items (order_id + barcode)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_order_item'
  ) THEN
    ALTER TABLE client_order_items
      ADD CONSTRAINT uq_order_item UNIQUE (order_id, barcode);
  END IF;
END $$;

-- 4. Перевірка результату
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('products', 'clients', 'client_order_items')
  AND column_name IN ('image_url', 'is_ignored', 'keycrm_id', 'birthday', 'keycrm_source_name')
ORDER BY table_name, column_name;
