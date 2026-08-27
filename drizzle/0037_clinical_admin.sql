-- Grant sensitive AI operations only to the named responsible human operator.
UPDATE "admin_settings"
SET "role" = 'clinical_admin', "updated_at" = now()
WHERE lower("email") = 'luneva.shura@yandex.ru'
  AND "is_active" = true
  AND "role" = 'admin';
