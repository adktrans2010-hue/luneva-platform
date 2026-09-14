CREATE OR REPLACE FUNCTION expire_stale_payment_holds(p_now timestamp without time zone DEFAULT now())
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  affected integer;
BEGIN
  WITH expired AS (
    UPDATE appointment_requests
       SET status = 'expired',
           payment_status = CASE WHEN payment_status = 'paid' THEN payment_status ELSE 'failed' END,
           updated_at = p_now
     WHERE status = 'awaiting_payment'
       AND payment_status <> 'paid'
       AND hold_expires_at IS NOT NULL
       AND hold_expires_at <= p_now
     RETURNING id
  ), history AS (
    INSERT INTO appointment_history (appointment_id, action, details)
    SELECT id, 'Резерв оплаты истёк', 'Срок оплаты истёк; слот освобождён автоматически.'
      FROM expired
  )
  SELECT count(*) INTO affected FROM expired;
  RETURN affected;
END;
$$;
