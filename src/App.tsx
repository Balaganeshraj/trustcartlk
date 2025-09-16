import React, { useState, useEffect, useRef } from 'react';
import { Plus, Upload, Download, Calculator, TrendingUp, DollarSign, Package, Settings, Search, Filter, Edit3, Trash2, Save, X, Check, BarChart3, Gift } from 'lucide-react';
import { ProductManager } from './components/ProductManager';
import { Dashboard } from './components/Dashboard';
import { PricingSettings } from './components/PricingSettings';
import { AdvancedImportExport } from './components/AdvancedImportExport';
import { AIStrategies } from './components/AIStrategies';
import { BundleManager } from './components/BundleManager';
import { Product, PricingConfig, DashboardMetrics, BundleOffer } from './types';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<BundleOffer[]>([]);
  const [config, setConfig] = useState<PricingConfig>({
    profitMargin: 30,
    adCost: 20,
    deliveryCost: 400,
    taxRate: 0,
    gatewayFee: 3.5,
    currency: 'LKR'
  });
  const [activeTab, setActiveTab] = useState<'products' | 'dashboard' | 'ai-strategies' | 'bundles' | 'settings'>('products');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalInvestment: 0,
    totalRevenue: 0,
    totalProfit: 0,
    roi: 0,
    avgProfit: 0,
    profitMargin: 0,
    productCount: 0
  });

  // Initialize default products
  useEffect(() => {
    const defaultProducts: Product[] = [
      { id: '1', name: 'Premium Smartphone', category: 'Electronics', costPrice: 0, sellingPrice: 0, quantity: 1, isActive: true },
      { id: '2', name: 'Designer Dress', category: 'Fashion', costPrice: 0, sellingPrice: 0, quantity: 1, isActive: true },
      { id: '3', name: 'Luxury Furniture Set', category: 'Home & Garden', costPrice: 0, sellingPrice: 0, quantity: 1, isActive: true },
      { id: '4', name: 'Professional Fitness Equipment', category: 'Sports', costPrice: 0, sellingPrice: 0, quantity: 1, isActive: true },
      { id: '5', name: 'Premium Skincare Kit', category: 'Beauty', costPrice: 0, sellingPrice: 0, quantity: 1, isActive: true },
      { id: '6', name: 'Educational Book Series', category: 'Books', costPrice: 0, sellingPrice: 0, quantity: 1, isActive: true },
      { id: '7', name: 'Smart Toy Collection', category: 'Toys', costPrice: 0, sellingPrice: 0, quantity: 1, isActive: true },
      { id: '8', name: 'Kitchen Appliance Set', category: 'Kitchen', costPrice: 0, sellingPrice: 0, quantity: 1, isActive: true }
    ];
    
    const savedProducts = localStorage.getItem('trustcart-products');
    const savedConfig = localStorage.getItem('trustcart-config');
    const savedBundles = localStorage.getItem('trustcart-bundles');
    
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      setProducts(defaultProducts);
    }
    
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
    
    if (savedBundles) {
      setBundles(JSON.parse(savedBundles));
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('trustcart-products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('trustcart-config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('trustcart-bundles', JSON.stringify(bundles));
  }, [bundles]);

  // Calculate metrics whenever products or config changes
  useEffect(() => {
    calculateMetrics();
  }, [products, config]);

  const calculatePrice = (costPrice: number): { sellingPrice: number; netProfit: number; profitMargin: number } => {
    if (costPrice === 0) {
      return { sellingPrice: 0, netProfit: 0, profitMargin: 0 };
    }
    
    const basePrice = costPrice + (costPrice * config.profitMargin / 100) + config.adCost + config.deliveryCost;
    const priceWithTax = basePrice + (basePrice * config.taxRate / 100);
    const sellingPrice = Math.round(priceWithTax / (1 - config.gatewayFee / 100));
    
    const netProfit = sellingPrice - costPrice - config.adCost - config.deliveryCost - 
                      (sellingPrice * config.taxRate / 100) - (sellingPrice * config.gatewayFee / 100);
    
    const profitMargin = (netProfit / sellingPrice) * 100;
    
    return { sellingPrice, netProfit, profitMargin };
  };

  const calculateMetrics = () => {
    const activeProducts = products.filter(p => p.isActive);
    let totalInvestment = 0;
    let totalRevenue = 0;
    let totalProfit = 0;

    activeProducts.forEach(product => {
      // Use manual selling price if set, otherwise calculate
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
      productCount: activeProducts.length
    });
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const applyPricingToAllProducts = () => {
    const updatedProducts = products.map(product => {
      if (product.costPrice > 0) {
        const pricing = calculatePrice(product.costPrice);
        return {
          ...product,
          sellingPrice: pricing.sellingPrice
        };
      }
      return product;
    });
    setProducts(updatedProducts);
  };

  const createBundle = (bundle: BundleOffer) => {
    setBundles([...bundles, bundle]);
  };

  const tabs = [
    { id: 'products' as const, label: 'Products', icon: Package },
    { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
    { id: 'ai-strategies' as const, label: 'AI Strategies', icon: TrendingUp },
    { id: 'bundles' as const, label: 'Bundles', icon: Gift },
    { id: 'settings' as const, label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Trustcart.lk</h1>
                <p className="text-sm text-gray-500">Advanced Pricing Calculator</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{config.currency} {metrics.totalProfit.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Total Profit</div>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'products' && (
          <ProductManager
            products={products}
            setProducts={setProducts}
            config={config}
            calculatePrice={calculatePrice}
          />
        )}
        
        {activeTab === 'dashboard' && (
          <Dashboard
            metrics={metrics}
            products={products}
            config={config}
            calculatePrice={calculatePrice}
          />
        )}
        
        {activeTab === 'ai-strategies' && (
          <AIStrategies
            products={products}
            config={config}
            onUpdateProduct={updateProduct}
            onCreateBundle={createBundle}
          />
        )}
        
        {activeTab === 'bundles' && (
          <BundleManager
            bundles={bundles}
            setBundles={setBundles}
            products={products}
            config={config}
          />
        )}
        
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <PricingSettings 
              config={config} 
              setConfig={setConfig}
              onApplyToAllProducts={applyPricingToAllProducts}
              productCount={products.filter(p => p.isActive && p.costPrice > 0).length}
            />
            <AdvancedImportExport
              products={products}
              setProducts={setProducts}
              bundles={bundles}
              config={config}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;