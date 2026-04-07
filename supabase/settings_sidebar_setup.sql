ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

GRANT SELECT ON settings TO anon, authenticated;

CREATE OR REPLACE FUNCTION upsert_public_setting(
  p_key TEXT,
  p_value TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NULLIF(BTRIM(p_key), '') IS NULL THEN
    RAISE EXCEPTION 'Setting key cannot be empty';
  END IF;

  INSERT INTO settings (key, value, description)
  VALUES (p_key, COALESCE(p_value, ''), p_description)
  ON CONFLICT (key) DO UPDATE
  SET
    value = EXCLUDED.value,
    description = COALESCE(EXCLUDED.description, settings.description),
    updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_public_setting(TEXT, TEXT, TEXT) TO anon, authenticated;

INSERT INTO settings (key, value, description) VALUES
  ('auth_admin_email', 'admin@reten.app', 'Email адміністратора для входу в дашборд'),
  ('auth_admin_username', 'admin', 'Ім’я адміністратора для входу в дашборд'),
  ('sidebar_show_orders', 'true', 'Показувати вкладку "Замовлення" у sidebar'),
  ('sidebar_show_products', 'true', 'Показувати вкладку "Товари" у sidebar'),
  ('sidebar_show_clients', 'true', 'Показувати вкладку "Клієнти" у sidebar'),
  ('sidebar_show_sources', 'true', 'Показувати вкладку "Джерела" у sidebar'),
  ('sidebar_show_statuses', 'true', 'Показувати вкладку "Статуси" у sidebar'),
  ('sidebar_show_reminders', 'true', 'Показувати вкладку "Нагадування" у sidebar'),
  ('sidebar_show_automations', 'true', 'Показувати вкладку "Автоматизації" у sidebar'),
  ('sidebar_show_campaigns', 'true', 'Показувати вкладку "Кампанії" у sidebar'),
  ('sidebar_show_analytics', 'true', 'Показувати вкладку "Аналітика" у sidebar'),
  ('sidebar_show_segments', 'true', 'Показувати вкладку "Сегменти" у sidebar'),
  ('sidebar_show_loyalty', 'true', 'Показувати вкладку "Лояльність" у sidebar'),
  ('sidebar_show_sync', 'true', 'Показувати вкладку "Синхронізація" у sidebar')
ON CONFLICT (key) DO NOTHING;
