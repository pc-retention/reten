-- =====================================================
-- Очистка тестових даних перед реальним синком
-- ⚠️  НЕЗВОРОТНЯ ОПЕРАЦІЯ — виконати один раз
-- Порядок важливий: спочатку дочірні таблиці, потім батьківські
-- =====================================================

-- Дочірні (залежать від clients)
TRUNCATE TABLE automation_queue       RESTART IDENTITY CASCADE;
TRUNCATE TABLE win_back_candidates    RESTART IDENTITY CASCADE;
TRUNCATE TABLE communication_log      RESTART IDENTITY CASCADE;
TRUNCATE TABLE loyalty_transactions   RESTART IDENTITY CASCADE;
TRUNCATE TABLE client_purchases       RESTART IDENTITY CASCADE;
TRUNCATE TABLE client_order_items     RESTART IDENTITY CASCADE;
TRUNCATE TABLE client_orders          RESTART IDENTITY CASCADE;

-- Аналітика
TRUNCATE TABLE cohort_snapshots       RESTART IDENTITY CASCADE;
TRUNCATE TABLE metrics_daily          RESTART IDENTITY CASCADE;
TRUNCATE TABLE campaigns              RESTART IDENTITY CASCADE;

-- Технічні
TRUNCATE TABLE processed_orders       RESTART IDENTITY CASCADE;
TRUNCATE TABLE sync_log               RESTART IDENTITY CASCADE;
TRUNCATE TABLE unknown_barcodes       RESTART IDENTITY CASCADE;

-- Клієнти та товари (батьківські — в самому кінці)
TRUNCATE TABLE clients                RESTART IDENTITY CASCADE;
TRUNCATE TABLE products               RESTART IDENTITY CASCADE;

-- ⚠️  НЕ чистимо (налаштування — залишаємо):
-- allowed_sources        — реальні дані або перезапишуться синком 04
-- settings               — конфігурація системи
-- loyalty_tiers          — рівні лояльності
-- rfm_config             — пороги RFM
-- rfm_segments           — визначення сегментів
-- communication_templates — шаблони повідомлень

-- Перевірка після очистки
SELECT
  'clients'            AS tbl, COUNT(*) FROM clients           UNION ALL
  SELECT 'products',            COUNT(*) FROM products          UNION ALL
  SELECT 'client_orders',       COUNT(*) FROM client_orders     UNION ALL
  SELECT 'client_order_items',  COUNT(*) FROM client_order_items UNION ALL
  SELECT 'client_purchases',    COUNT(*) FROM client_purchases  UNION ALL
  SELECT 'communication_log',   COUNT(*) FROM communication_log UNION ALL
  SELECT 'sync_log',            COUNT(*) FROM sync_log
ORDER BY tbl;
