-- Daily logs table for persistent user activity logs
-- Run manually in your database.

BEGIN;

CREATE TABLE IF NOT EXISTS public.daily_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  log_type text NOT NULL CHECK (log_type = ANY (ARRAY['received'::text, 'paid'::text, 'commodity'::text])),
  amount integer NOT NULL CHECK (amount > 0),
  log_date timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT daily_logs_pkey PRIMARY KEY (id),
  CONSTRAINT daily_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id
  ON public.daily_logs USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_daily_logs_date
  ON public.daily_logs USING btree (log_date DESC) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_daily_logs_type
  ON public.daily_logs USING btree (log_type) TABLESPACE pg_default;

COMMIT;
