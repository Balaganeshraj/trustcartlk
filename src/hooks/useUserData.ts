import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, ProductRow, BundleRow, PricingConfigRow } from '../lib/supabase';
import { Product, BundleOffer, PricingConfig } from '../types';

const DEFAULT_CONFIG: PricingConfig = {
  profitMargin: 30,
  adCost: 20,
  deliveryCost: 400,
  taxRate: 0,
  gatewayFee: 3.5,
  currency: 'LKR',
};

const DEMO_PRODUCTS: Product[] = [
  { id: 'demo-1', name: 'Premium Smartphone', category: 'Electronics', costPrice: 0, sellingPrice: 0, quantity: 1, isActive: true },
  { id: 'demo-2', name: 'Designer Dress', category: 'Fashion', costPrice: 0, sellingPrice: 0, quantity: 1, isActive: true },
  { id: 'demo-3', name: 'Luxury Furniture Set', category: 'Home & Garden', costPrice: 0, sellingPrice: 0, quantity: 1, isActive: true },
  { id: 'demo-4', name: 'Professional Fitness Equipment', category: 'Sports', costPrice: 0, sellingPrice: 0, quantity: 1, isActive: true },
  { id: 'demo-5', name: 'Premium Skincare Kit', category: 'Beauty', costPrice: 0, sellingPrice: 0, quantity: 1, isActive: true },
  { id: 'demo-6', name: 'Educational Book Series', category: 'Books', costPrice: 0, sellingPrice: 0, quantity: 1, isActive: true },
  { id: 'demo-7', name: 'Smart Toy Collection', category: 'Toys', costPrice: 0, sellingPrice: 0, quantity: 1, isActive: true },
  { id: 'demo-8', name: 'Kitchen Appliance Set', category: 'Kitchen', costPrice: 0, sellingPrice: 0, quantity: 1, isActive: true },
];

const rowToProduct = (r: ProductRow): Product => ({
  id: r.id,
  name: r.name,
  category: r.category,
  costPrice: Number(r.cost_price) || 0,
  sellingPrice: r.selling_price != null ? Number(r.selling_price) : undefined,
  marketPrice: r.market_price != null ? Number(r.market_price) : undefined,
  quantity: Number(r.quantity) || 1,
  isActive: r.is_active ?? true,
  description: r.description ?? undefined,
  sku: r.sku ?? undefined,
  supplier: r.supplier ?? undefined,
  lastUpdated: r.last_updated ? new Date(r.last_updated) : undefined,
});

const rowToBundle = (r: BundleRow): BundleOffer => ({
  id: r.id,
  name: r.name,
  category: r.category,
  products: (r.product_snapshot || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    costPrice: Number(p.costPrice) || 0,
    sellingPrice: p.sellingPrice != null ? Number(p.sellingPrice) : undefined,
    quantity: p.quantity || 1,
    isActive: true,
  })),
  bundlePrice: Number(r.bundle_price) || 0,
  originalPrice: Number(r.original_price) || 0,
  discount: Number(r.discount) || 0,
  color: r.color || '#F97316',
  isActive: r.is_active ?? true,
});

const rowToConfig = (r: PricingConfigRow): PricingConfig => ({
  profitMargin: Number(r.profit_margin) || 0,
  adCost: Number(r.ad_cost) || 0,
  deliveryCost: Number(r.delivery_cost) || 0,
  taxRate: Number(r.tax_rate) || 0,
  gatewayFee: Number(r.gateway_fee) || 0,
  currency: r.currency || 'LKR',
});

export function useUserData(userId: string | undefined) {
  const [products, setProductsState] = useState<Product[]>(DEMO_PRODUCTS);
  const [bundles, setBundlesState] = useState<BundleOffer[]>([]);
  const [config, setConfigState] = useState<PricingConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const skipSave = useRef(true);

  // Load all user data on mount / user change
  useEffect(() => {
    if (!userId) {
      setProductsState(DEMO_PRODUCTS);
      setBundlesState([]);
      setConfigState(DEFAULT_CONFIG);
      setLoading(false);
      skipSave.current = true;
      return;
    }

    let cancelled = false;
    skipSave.current = true;
    setLoading(true);

    (async () => {
      const [prodRes, bundleRes, cfgRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: true }),
        supabase.from('bundles').select('*').order('created_at', { ascending: true }),
        supabase.from('pricing_config').select('*').maybeSingle(),
      ]);

      if (cancelled) return;

      const loadedProducts = (prodRes.data as ProductRow[] | null)?.map(rowToProduct) ?? [];
      setProductsState(loadedProducts.length > 0 ? loadedProducts : DEMO_PRODUCTS);

      const loadedBundles = (bundleRes.data as BundleRow[] | null)?.map(rowToBundle) ?? [];
      setBundlesState(loadedBundles);

      if (cfgRes.data) setConfigState(rowToConfig(cfgRes.data as PricingConfigRow));
      else setConfigState(DEFAULT_CONFIG);

      setLoading(false);
      // allow saves after initial load completes
      setTimeout(() => { skipSave.current = false; }, 100);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const setProducts = useCallback((next: Product[] | ((prev: Product[]) => Product[])) => {
    setProductsState((prev) => {
      const resolved = typeof next === 'function' ? (next as (p: Product[]) => Product[])(prev) : next;
      return resolved;
    });
  }, []);

  const setBundles = useCallback((next: BundleOffer[] | ((prev: BundleOffer[]) => BundleOffer[])) => {
    setBundlesState((prev) => {
      const resolved = typeof next === 'function' ? (next as (b: BundleOffer[]) => BundleOffer[])(prev) : next;
      return resolved;
    });
  }, []);

  const setConfig = useCallback((next: PricingConfig | ((prev: PricingConfig) => PricingConfig)) => {
    setConfigState((prev) => {
      const resolved = typeof next === 'function' ? (next as (c: PricingConfig) => PricingConfig)(prev) : next;
      return resolved;
    });
  }, []);

  return { products, bundles, config, setProducts, setBundles, setConfig, loading, skipSave };
}
