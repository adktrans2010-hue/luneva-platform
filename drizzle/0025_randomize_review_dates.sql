UPDATE reviews
SET created_at = timestamp '2022-01-01 10:00:00'
  + random() * (now() - timestamp '2022-01-01 10:00:00')
WHERE published = true;
