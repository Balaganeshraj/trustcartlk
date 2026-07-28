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
          <p className="text-sm text-gray-500">Loading your workspace…</p>
        </div>
      </div>
    );
  }

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

            <div className="hidden sm:block text-right">
              <div className="text-sm font-bold text-gray-900">
                {config.currency} {Math.round(metrics.totalProfit).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Total Profit</div>
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

export default App;
