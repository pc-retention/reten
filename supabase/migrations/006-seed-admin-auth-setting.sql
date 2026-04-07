INSERT INTO settings (key, value, description)
VALUES (
  'auth_admin_email',
  'admin@reten.app',
  'Email адміністратора для входу в дашборд'
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, description)
VALUES (
  'auth_admin_username',
  'admin',
  'Ім’я адміністратора для входу в дашборд'
)
ON CONFLICT (key) DO NOTHING;
