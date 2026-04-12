-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.bill_commodity (
  bill_id uuid NOT NULL DEFAULT gen_random_uuid(),
  commodity_id uuid NOT NULL,
  supplied_ammount integer NOT NULL,
  unit USER-DEFINED DEFAULT 'kg'::unit_type,
  cost integer NOT NULL,
  name text NOT NULL,
  CONSTRAINT bill_commodity_pkey PRIMARY KEY (bill_id, commodity_id),
  CONSTRAINT bill_commodity_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(id),
  CONSTRAINT bill_commodity_commodity_id_fkey FOREIGN KEY (commodity_id) REFERENCES public.commodities(id)
);
CREATE TABLE public.bills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid,
  user_id uuid,
  date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone,
  status USER-DEFINED DEFAULT 'unpaid'::bill_status,
  total_amount integer NOT NULL,
  paid_amount integer NOT NULL,
  bill_url text,
  CONSTRAINT bills_pkey PRIMARY KEY (id),
  CONSTRAINT bill_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id),
  CONSTRAINT bill_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.commodities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity integer NOT NULL,
  unit USER-DEFINED DEFAULT 'kg'::unit_type,
  user_id uuid,
  min_quantity integer DEFAULT 0,
  CONSTRAINT commodities_pkey PRIMARY KEY (id),
  CONSTRAINT commodities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.payment_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  vendor_id uuid,
  bill_id uuid,
  payment_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  amount_paid integer NOT NULL,
  payment_mode USER-DEFINED NOT NULL,
  CONSTRAINT payment_logs_pkey PRIMARY KEY (id),
  CONSTRAINT payment_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT payment_logs_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id),
  CONSTRAINT payment_logs_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(id)
);
CREATE TABLE public.profiles (
  user_id uuid NOT NULL,
  business_name text NOT NULL,
  phone_number text,
  address text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vendor_commodity (
  vendor_id uuid,
  commodity_id uuid,
  CONSTRAINT vendor_commodity_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id),
  CONSTRAINT vendor_commodity_commodity_id_fkey FOREIGN KEY (commodity_id) REFERENCES public.commodities(id)
);
CREATE TABLE public.vendors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  phone_number text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  tolerance_amount integer DEFAULT 0,
  tolerance_level text DEFAULT 'low'::text CHECK (tolerance_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  CONSTRAINT vendors_pkey PRIMARY KEY (id),
  CONSTRAINT vendors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);