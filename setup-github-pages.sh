#!/bin/bash
#
# Trustcart.lk - GitHub Pages Setup Script
#
# This script:
#   1. Removes the old Jekyll workflow and auth files
#   2. Writes all updated files (no-login, localStorage-based app)
#   3. Adds the correct Vite build + GitHub Pages deploy workflow
#   4. Commits and pushes everything to GitHub
#
# HOW TO USE:
#   1. Download this script into your local trustcartlk project folder
#   2. Open a terminal in that folder
#   3. Run:  bash setup-github-pages.sh
#
set -e

echo "=========================================="
echo "  Trustcart.lk GitHub Pages Setup Script"
echo "=========================================="
echo ""

# --- Step 1: Remove files that should no longer exist ---
echo "[1/4] Removing old/unused files..."

rm -f .github/workflows/jekyll-gh-pages.yml
rm -f src/components/AuthPage.tsx
rm -f src/context/AuthContext.tsx
rm -f src/lib/supabase.ts
rm -rf src/context
rm -rf src/lib

echo "  Done."
echo ""

# --- Step 2: Write the GitHub Actions deploy workflow ---
echo "[2/4] Writing GitHub Actions deploy workflow..."
mkdir -p .github/workflows

cat > .github/workflows/deploy.yml << 'WORKFLOW_EOF'
name: Deploy to GitHub Pages

on:
  push:
    branches: [main, master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
WORKFLOW_EOF

echo "  Done."
echo ""

# --- Step 3: Write updated source files ---
echo "[3/4] Writing updated source files..."

# --- vite.config.ts ---
cat > vite.config.ts << 'VITE_EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/trustcartlk/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
VITE_EOF

# --- package.json ---
cat > package.json << 'PKG_EOF'
{
  "name": "vite-react-typescript-starter",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@types/papaparse": "^5.3.16",
    "lucide-react": "^0.344.0",
    "papaparse": "^5.5.3",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.1",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.18",
    "eslint": "^9.9.1",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.11",
    "globals": "^15.9.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.3.0",
    "vite": "^5.4.2"
  }
}
PKG_EOF

# --- src/main.tsx ---
cat > src/main.tsx << 'MAIN_EOF'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
MAIN_EOF

# --- src/hooks/useUserData.ts ---
mkdir -p src/hooks
cat > src/hooks/useUserData.ts << 'USEUSERDATA_EOF'
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

  useEffect(() => {
    if (skipSave.current) return;
    const t = setTimeout(() => saveToStorage(STORAGE_KEYS.products, products), 400);
    return () => clearTimeout(t);
  }, [products]);

  useEffect(() => {
    if (skipSave.current) return;
    const t = setTimeout(() => saveToStorage(STORAGE_KEYS.bundles, bundles), 400);
    return () => clearTimeout(t);
  }, [bundles]);

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
USEUSERDATA_EOF

# --- src/App.tsx ---
cat > src/App.tsx << 'APP_EOF'
import { useEffect, useState } from 'react';
import { TrendingUp, Package, Settings, BarChart3, Gift, Loader2 } from 'lucide-react';
import { ProductManager } from './components/ProductManager';
import { Dashboard } from './components/Dashboard';
import { PricingSettings } from './components/PricingSettings';
import { AdvancedImportExport } from './components/AdvancedImportExport';
import { AIStrategies } from './components/AIStrategies';
import { BundleManager } from './components/BundleManager';
import { useUserData } from './hooks/useUserData';
import { Product, PricingConfig, DashboardMetrics, BundleOffer } from './types';

function App() {
  const { products, bundles, config, setProducts, setBundles, setConfig, loading: dataLoading } = useUserData();
  const [activeTab, setActiveTab] = useState<'products' | 'dashboard' | 'ai-strategies' | 'bundles' | 'settings'>('products');

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalInvestment: 0,
    totalRevenue: 0,
    totalProfit: 0,
    roi: 0,
    avgProfit: 0,
    profitMargin: 0,
    productCount: 0,
  });

  const calculatePrice = (costPrice: number): { sellingPrice: number; netProfit: number; profitMargin: number } => {
    if (costPrice === 0) return { sellingPrice: 0, netProfit: 0, profitMargin: 0 };
    const basePrice = costPrice + (costPrice * config.profitMargin / 100) + config.adCost + config.deliveryCost;
    const priceWithTax = basePrice + (basePrice * config.taxRate / 100);
    const sellingPrice = Math.round(priceWithTax / (1 - config.gatewayFee / 100));
    const netProfit = sellingPrice - costPrice - config.adCost - config.deliveryCost -
      (sellingPrice * config.taxRate / 100) - (sellingPrice * config.gatewayFee / 100);
    const profitMargin = (netProfit / sellingPrice) * 100;
    return { sellingPrice, netProfit, profitMargin };
  };

  useEffect(() => {
    const activeProducts = products.filter((p) => p.isActive);
    let totalInvestment = 0;
    let totalRevenue = 0;
    let totalProfit = 0;

    activeProducts.forEach((product) => {
      const sellingPrice = product.sellingPrice || calculatePrice(product.costPrice).sellingPrice;
      const netProfit = sellingPrice - product.costPrice - config.adCost - config.deliveryCost -
        (sellingPrice * config.taxRate / 100) - (sellingPrice * config.gatewayFee / 100);
      totalInvestment += product.costPrice * product.quantity;
      totalRevenue += sellingPrice * product.quantity;
      totalProfit += netProfit * product.quantity;
    });

    const roi = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
    const avgProfit = activeProducts.length > 0 ? totalProfit / activeProducts.length : 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    setMetrics({
      totalInvestment,
      totalRevenue,
      totalProfit,
      roi,
      avgProfit,
      profitMargin,
      productCount: activeProducts.length,
    });
  }, [products, config]);

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates, lastUpdated: new Date() } : p)));
  };

  const applyPricingToAllProducts = () => {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.costPrice > 0) {
          const pricing = calculatePrice(product.costPrice);
          return { ...product, sellingPrice: pricing.sellingPrice, lastUpdated: new Date() };
        }
        return product;
      })
    );
  };

  const createBundle = (bundle: BundleOffer) => {
    setBundles((prev) => [...prev, bundle]);
  };

  const tabs = [
    { id: 'products' as const, label: 'Products', icon: Package },
    { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
    { id: 'ai-strategies' as const, label: 'AI Strategies', icon: TrendingUp },
    { id: 'bundles' as const, label: 'Bundles', icon: Gift },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          <p className="text-sm text-gray-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Trustcart.lk</h1>
                <p className="text-xs text-orange-600 -mt-0.5">Advanced Pricing Calculator</p>
              </div>
            </div>

            <div className="hidden sm:block text-right">
              <div className="text-sm font-bold text-gray-900">
                {config.currency} {Math.round(metrics.totalProfit).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Total Profit</div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-3.5 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'products' && (
          <ProductManager products={products} setProducts={setProducts} config={config} calculatePrice={calculatePrice} />
        )}
        {activeTab === 'dashboard' && (
          <Dashboard metrics={metrics} products={products} config={config} calculatePrice={calculatePrice} />
        )}
        {activeTab === 'ai-strategies' && (
          <AIStrategies products={products} config={config} onUpdateProduct={updateProduct} onCreateBundle={createBundle} />
        )}
        {activeTab === 'bundles' && (
          <BundleManager bundles={bundles} setBundles={setBundles} products={products} config={config} />
        )}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <PricingSettings
              config={config}
              setConfig={setConfig}
              onApplyToAllProducts={applyPricingToAllProducts}
              productCount={products.filter((p) => p.isActive && p.costPrice > 0).length}
            />
            <AdvancedImportExport products={products} setProducts={setProducts} bundles={bundles} config={config} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
APP_EOF

echo "  Done."
echo ""

# --- Step 4: Commit and push ---
echo "[4/4] Committing and pushing to GitHub..."

git add -A
git commit -m "Remove login screen, fix GitHub Pages build with Vite workflow"
git push origin main

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Go to your repo Settings -> Pages"
echo "  2. Under 'Source', select 'GitHub Actions'"
echo "  3. Wait 1-2 minutes for the build to finish"
echo "  4. Visit: https://balaganeshraj.github.io/trustcartlk/"
echo ""
echo "Check build status in the Actions tab of your repo."
