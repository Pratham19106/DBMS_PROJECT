-- Performance indexes for period-based daily log analytics
-- Run manually after ensuring daily_logs and payments tables exist.

BEGIN;

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date
  ON public.daily_logs (user_id, log_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_type_date
  ON public.daily_logs (user_id, log_type, log_date DESC);

CREATE INDEX IF NOT EXISTS idx_payments_user_date
  ON public.payments (user_id, payment_date DESC);

COMMIT;
