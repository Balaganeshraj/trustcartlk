import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  country: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  avatar_url: string | null;
};

export type ProductRow = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  cost_price: number | null;
  selling_price: number | null;
  market_price: number | null;
  quantity: number | null;
  is_active: boolean | null;
  description: string | null;
  sku: string | null;
  supplier: string | null;
  last_updated: string | null;
  created_at: string | null;
};

export type BundleRow = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  bundle_price: number | null;
  original_price: number | null;
  discount: number | null;
  color: string | null;
  is_active: boolean | null;
  product_ids: string[];
  product_snapshot: any[];
  created_at: string | null;
};

export type PricingConfigRow = {
  id: string;
  user_id: string;
  profit_margin: number | null;
  ad_cost: number | null;
  delivery_cost: number | null;
  tax_rate: number | null;
  gateway_fee: number | null;
  currency: string | null;
  updated_at: string | null;
};
