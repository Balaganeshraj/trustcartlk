/*
# Authentication and per-user data tables for Trustcart.lk

## Overview
Adds multi-user support so each signed-in user has their own products, bundles, and pricing configuration. Data is isolated per user via Row Level Security (RLS). A `profiles` table extends Supabase's built-in `auth.users` with the extra signup details (full name, country, phone, address) requested for the signup form.

## New Tables

### 1. `profiles`
- `id` (uuid, primary key, references auth.users on delete cascade) — one row per auth user
- `full_name` (text) — display name shown in the app
- `email` (text) — denormalized copy of the auth email for quick display
- `country` (text) — country selected at signup (used for phone dial code and address)
- `phone` (text) — full phone number including country code
- `address_line1` (text) — first line of the street address
- `address_line2` (text, nullable) — optional second address line
- `city` (text) — city
- `state` (text, nullable) — state/province
- `postal_code` (text, nullable) — postal/zip code
- `avatar_url` (text, nullable) — profile picture URL (Google OAuth avatar or uploaded)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### 2. `products`
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid(), references auth.users on delete cascade)
- `name` (text, not null)
- `category` (text, not null, default 'Uncategorized')
- `cost_price` (numeric, default 0)
- `selling_price` (numeric, nullable) — manually set or calculated
- `market_price` (numeric, nullable)
- `quantity` (integer, default 1)
- `is_active` (boolean, default true)
- `description` (text, nullable)
- `sku` (text, nullable)
- `supplier` (text, nullable)
- `last_updated` (timestamptz, default now())
- `created_at` (timestamptz, default now())

### 3. `bundles`
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid(), references auth.users on delete cascade)
- `name` (text, not null)
- `category` (text, not null, default 'Uncategorized')
- `bundle_price` (numeric, not null, default 0)
- `original_price` (numeric, not null, default 0)
- `discount` (numeric, not null, default 0)
- `color` (text, default '#F97316')
- `is_active` (boolean, default true)
- `product_ids` (uuid[], not null, default '{}') — references to product ids in the bundle
- `product_snapshot` (jsonb, not null, default '[]') — frozen copy of product data at bundle creation time so the bundle survives product edits/deletes
- `created_at` (timestamptz, default now())

### 4. `pricing_config`
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid(), references auth.users on delete cascade)
- `profit_margin` (numeric, default 30)
- `ad_cost` (numeric, default 20)
- `delivery_cost` (numeric, default 400)
- `tax_rate` (numeric, default 0)
- `gateway_fee` (numeric, default 3.5)
- `currency` (text, default 'LKR')
- `updated_at` (timestamptz, default now())
- Unique constraint on `user_id` so each user has exactly one config row.

## Security (RLS)

All four tables have RLS enabled. Policies are scoped `TO authenticated` with `auth.uid() = user_id` ownership checks (profiles uses `auth.uid() = id`). Four separate policies per table (SELECT/INSERT/UPDATE/DELETE). The `user_id` columns default to `auth.uid()` so client inserts that omit the owner still satisfy the WITH CHECK.

profiles is the exception — its primary key IS the auth user id, so it is inserted by the app right after signup with an explicit id. The INSERT policy allows `WITH CHECK (auth.uid() = id)`.

## Notes

1. Email confirmation stays OFF (Supabase default) so signup logs the user in immediately.
2. The `product_snapshot` jsonb column stores a frozen copy of each product's name/price at bundle creation, so bundles remain valid even if a product is later edited or deleted.
3. `pricing_config` has a unique constraint on user_id; the app upserts the single row per user.
*/

-- profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  country text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Uncategorized',
  cost_price numeric DEFAULT 0,
  selling_price numeric,
  market_price numeric,
  quantity integer DEFAULT 1,
  is_active boolean DEFAULT true,
  description text,
  sku text,
  supplier text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_products" ON products;
CREATE POLICY "select_own_products" ON products FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_products" ON products;
CREATE POLICY "insert_own_products" ON products FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_products" ON products;
CREATE POLICY "update_own_products" ON products FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_products" ON products;
CREATE POLICY "delete_own_products" ON products FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- bundles table
CREATE TABLE IF NOT EXISTS bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Uncategorized',
  bundle_price numeric NOT NULL DEFAULT 0,
  original_price numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  color text DEFAULT '#F97316',
  is_active boolean DEFAULT true,
  product_ids uuid[] NOT NULL DEFAULT '{}',
  product_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bundles" ON bundles;
CREATE POLICY "select_own_bundles" ON bundles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bundles" ON bundles;
CREATE POLICY "insert_own_bundles" ON bundles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bundles" ON bundles;
CREATE POLICY "update_own_bundles" ON bundles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bundles" ON bundles;
CREATE POLICY "delete_own_bundles" ON bundles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bundles_user_id ON bundles(user_id);

-- pricing_config table
CREATE TABLE IF NOT EXISTS pricing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  profit_margin numeric DEFAULT 30,
  ad_cost numeric DEFAULT 20,
  delivery_cost numeric DEFAULT 400,
  tax_rate numeric DEFAULT 0,
  gateway_fee numeric DEFAULT 3.5,
  currency text DEFAULT 'LKR',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_pricing_config" ON pricing_config;
CREATE POLICY "select_own_pricing_config" ON pricing_config FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_pricing_config" ON pricing_config;
CREATE POLICY "insert_own_pricing_config" ON pricing_config FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_pricing_config" ON pricing_config;
CREATE POLICY "update_own_pricing_config" ON pricing_config FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_pricing_config" ON pricing_config;
CREATE POLICY "delete_own_pricing_config" ON pricing_config FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pricing_config_user_id ON pricing_config(user_id);
