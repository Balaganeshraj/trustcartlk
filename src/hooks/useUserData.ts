import { useCallback, useEffect, useRef, useState } from 'react';
import { Product, BundleOffer, PricingConfig } from '../types';

const STORAGE_KEYS = {
  products: 'trustcart_products',
  bundles: 'trustcart_bundles',
  config: 'trustcart_config',
};

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

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage save error:', e);
  }
}

export function useUserData() {
  const [products, setProductsState] = useState<Product[]>(() => {
    const stored = loadFromStorage<Product[]>(STORAGE_KEYS.products, []);
    return stored.length > 0 ? stored : DEMO_PRODUCTS;
  });
  const [bundles, setBundlesState] = useState<BundleOffer[]>(() =>
    loadFromStorage<BundleOffer[]>(STORAGE_KEYS.bundles, [])
  );
  const [config, setConfigState] = useState<PricingConfig>(() =>
    loadFromStorage<PricingConfig>(STORAGE_KEYS.config, DEFAULT_CONFIG)
  );
  const [loading, setLoading] = useState(false);
  const skipSave = useRef(false);

  // Persist products to localStorage (debounced)
  useEffect(() => {
    if (skipSave.current) return;
    const t = setTimeout(() => saveToStorage(STORAGE_KEYS.products, products), 400);
    return () => clearTimeout(t);
  }, [products]);

  // Persist bundles to localStorage (debounced)
  useEffect(() => {
    if (skipSave.current) return;
    const t = setTimeout(() => saveToStorage(STORAGE_KEYS.bundles, bundles), 400);
    return () => clearTimeout(t);
  }, [bundles]);

  // Persist config to localStorage (debounced)
  useEffect(() => {
    if (skipSave.current) return;
    const t = setTimeout(() => saveToStorage(STORAGE_KEYS.config, config), 400);
    return () => clearTimeout(t);
  }, [config]);

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

  const clearAllData = useCallback(() => {
    skipSave.current = true;
    setProductsState(DEMO_PRODUCTS);
    setBundlesState([]);
    setConfigState(DEFAULT_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.products);
    localStorage.removeItem(STORAGE_KEYS.bundles);
    localStorage.removeItem(STORAGE_KEYS.config);
    setTimeout(() => { skipSave.current = false; }, 100);
  }, []);

  return { products, bundles, config, setProducts, setBundles, setConfig, loading, skipSave, clearAllData };
}
