import { useEffect, useRef, useState } from 'react';
import { TrendingUp, Package, Settings, BarChart3, Gift, LogOut, Loader2, ChevronDown } from 'lucide-react';
import { ProductManager } from './components/ProductManager';
import { Dashboard } from './components/Dashboard';
import { PricingSettings } from './components/PricingSettings';
import { AdvancedImportExport } from './components/AdvancedImportExport';
import { AIStrategies } from './components/AIStrategies';
import { BundleManager } from './components/BundleManager';
import { AuthPage } from './components/AuthPage';
import { useAuth } from './context/AuthContext';
import { useUserData } from './hooks/useUserData';
import { supabase } from './lib/supabase';
import { Product, PricingConfig, DashboardMetrics, BundleOffer } from './types';

function App() {
  const { user, profile, loading, signOut } = useAuth();
  const { products, bundles, config, setProducts, setBundles, setConfig, loading: dataLoading, skipSave } = useUserData(user?.id);
  const [activeTab, setActiveTab] = useState<'products' | 'dashboard' | 'ai-strategies' | 'bundles' | 'settings'>('products');
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Persist products to Supabase (debounced)
  useEffect(() => {
    if (!user || skipSave.current) return;
    const realProducts = products.filter((p) => !p.id.startsWith('demo-'));
    if (realProducts.length === 0) return;
    const t = setTimeout(async () => {
      const { error } = await supabase.from('products').upsert(
        realProducts.map((p) => ({ id: p.id, ...productToRow(p) })),
        { onConflict: 'id' }
      );
      if (error) console.error('products save error:', error.message);
    }, 600);
    return () => clearTimeout(t);
  }, [products, user, skipSave]);

  // Persist config to Supabase (debounced)
  useEffect(() => {
    if (!user || skipSave.current) return;
    const t = setTimeout(async () => {
      const { error } = await supabase.from('pricing_config').upsert(
        { user_id: user.id, ...configToRow(config) },
        { onConflict: 'user_id' }
      );
      if (error) console.error('config save error:', error.message);
    }, 600);
    return () => clearTimeout(t);
  }, [config, user, skipSave]);

  // Persist bundles to Supabase (debounced)
  useEffect(() => {
    if (!user || skipSave.current) return;
    if (bundles.length === 0) return;
    const t = setTimeout(async () => {
      const { error } = await supabase.from('bundles').upsert(
        bundles.map((b) => ({ id: b.id, ...bundleToRow(b) })),
        { onConflict: 'id' }
      );
      if (error) console.error('bundles save error:', error.message);
    }, 600);
    return () => clearTimeout(t);
  }, [bundles, user, skipSave]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    setMenuOpen(false);
  };

  const tabs = [
    { id: 'products' as const, label: 'Products', icon: Package },
    { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
    { id: 'ai-strategies' as const, label: 'AI Strategies', icon: TrendingUp },
    { id: 'bundles' as const, label: 'Bundles', icon: Gift },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          <p className="text-sm text-gray-500">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const displayName = profile?.full_name || (user.email ? user.email.split('@')[0] : 'User');
  const initials = displayName
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-bold text-gray-900">
                  {config.currency} {Math.round(metrics.totalProfit).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Total Profit</div>
              </div>

              {/* User menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center space-x-2 p-1 pr-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {initials}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">{displayName}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {profile?.country && (
                        <p className="text-xs text-gray-400 mt-1">{profile.country}{profile.phone ? ` · ${profile.phone}` : ''}</p>
                      )}
                    </div>
                    <button
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
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

      {/* Main Content */}
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

const productToRow = (p: Product) => ({
  name: p.name,
  category: p.category || 'Uncategorized',
  cost_price: p.costPrice,
  selling_price: p.sellingPrice ?? null,
  market_price: p.marketPrice ?? null,
  quantity: p.quantity,
  is_active: p.isActive,
  description: p.description ?? null,
  sku: p.sku ?? null,
  supplier: p.supplier ?? null,
  last_updated: new Date().toISOString(),
});

const bundleToRow = (b: BundleOffer) => ({
  name: b.name,
  category: b.category || 'Uncategorized',
  bundle_price: b.bundlePrice,
  original_price: b.originalPrice,
  discount: b.discount,
  color: b.color,
  is_active: b.isActive,
  product_ids: b.products.map((p) => p.id),
  product_snapshot: b.products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    costPrice: p.costPrice,
    sellingPrice: p.sellingPrice,
    quantity: p.quantity,
  })),
});

const configToRow = (c: PricingConfig) => ({
  profit_margin: c.profitMargin,
  ad_cost: c.adCost,
  delivery_cost: c.deliveryCost,
  tax_rate: c.taxRate,
  gateway_fee: c.gatewayFee,
  currency: c.currency,
  updated_at: new Date().toISOString(),
});

export default App;
