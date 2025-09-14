import React, { useState } from 'react';
import { Gift, Package, TrendingUp, Edit3, Trash2, Eye, EyeOff } from 'lucide-react';
import { BundleOffer, Product, PricingConfig } from '../types';

interface BundleManagerProps {
  bundles: BundleOffer[];
  setBundles: (bundles: BundleOffer[]) => void;
  products: Product[];
  config: PricingConfig;
}

export const BundleManager: React.FC<BundleManagerProps> = ({
  bundles,
  setBundles,
  products,
  config
}) => {
  const [editingBundle, setEditingBundle] = useState<string | null>(null);

  const updateBundle = (id: string, updates: Partial<BundleOffer>) => {
    setBundles(bundles.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBundle = (id: string) => {
    if (confirm('Are you sure you want to delete this bundle?')) {
      setBundles(bundles.filter(b => b.id !== id));
    }
  };

  const duplicateBundle = (bundle: BundleOffer) => {
    const newBundle = {
      ...bundle,
      id: `bundle_${Date.now()}`,
      name: `${bundle.name} (Copy)`
    };
    setBundles([...bundles, newBundle]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <Gift className="w-8 h-8 text-green-600" />
              <span>Bundle Management</span>
            </h2>
            <p className="text-gray-600 mt-1">Manage your product bundles and combo offers</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">{bundles.filter(b => b.isActive).length}</div>
            <div className="text-sm text-gray-500">Active Bundles</div>
          </div>
        </div>
      </div>

      {/* Bundle Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="text-green-600 text-sm font-medium">Total Bundles</div>
          <div className="text-2xl font-bold text-green-900">{bundles.length}</div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="text-blue-600 text-sm font-medium">Active Bundles</div>
          <div className="text-2xl font-bold text-blue-900">{bundles.filter(b => b.isActive).length}</div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="text-purple-600 text-sm font-medium">Avg Discount</div>
          <div className="text-2xl font-bold text-purple-900">
            {bundles.length > 0 ? (bundles.reduce((sum, b) => sum + b.discount, 0) / bundles.length).toFixed(1) : 0}%
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
          <div className="text-orange-600 text-sm font-medium">Total Savings</div>
          <div className="text-2xl font-bold text-orange-900">
            {config.currency} {bundles.reduce((sum, b) => sum + (b.originalPrice - b.bundlePrice), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Bundles Grid */}
      {bundles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className={`border-2 rounded-xl p-6 hover:shadow-lg transition-all duration-200 ${
                !bundle.isActive ? 'opacity-50' : ''
              }`}
              style={{ 
                borderColor: bundle.color, 
                backgroundColor: `${bundle.color}10` 
              }}
            >
              {/* Bundle Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: bundle.color }}
                  >
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    {editingBundle === bundle.id ? (
                      <input
                        type="text"
                        value={bundle.name}
                        onChange={(e) => updateBundle(bundle.id, { name: e.target.value })}
                        className="font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-gray-500 outline-none"
                        onBlur={() => setEditingBundle(null)}
                        onKeyPress={(e) => e.key === 'Enter' && setEditingBundle(null)}
                      />
                    ) : (
                      <h3 className="font-bold text-gray-900">{bundle.name}</h3>
                    )}
                    <p className="text-sm text-gray-600">{bundle.category}</p>
                  </div>
                </div>
                <span 
                  className="px-3 py-1 text-white text-sm font-bold rounded-full"
                  style={{ backgroundColor: bundle.color }}
                >
                  -{bundle.discount}%
                </span>
              </div>

              {/* Products List */}
              <div className="space-y-2 mb-4">
                {bundle.products.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm bg-white bg-opacity-50 p-2 rounded">
                    <span className="text-gray-700 truncate flex-1">{product.name}</span>
                    <span className="text-gray-600 ml-2 font-medium">
                      {config.currency} {(product.sellingPrice || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Original Price:</span>
                  <span className="text-sm text-gray-500 line-through">
                    {config.currency} {bundle.originalPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">Bundle Price:</span>
                  <span className="text-lg font-bold" style={{ color: bundle.color }}>
                    {config.currency} {bundle.bundlePrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">You Save:</span>
                  <span className="text-sm font-bold text-green-600">
                    {config.currency} {(bundle.originalPrice - bundle.bundlePrice).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateBundle(bundle.id, { isActive: !bundle.isActive })}
                    className={`p-2 rounded-lg transition-colors ${
                      bundle.isActive 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={bundle.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {bundle.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setEditingBundle(bundle.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => duplicateBundle(bundle)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    📋
                  </button>
                </div>
                <button
                  onClick={() => deleteBundle(bundle.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bundles created yet</h3>
          <p className="text-gray-500 mb-4">
            Use the AI Strategies tab to automatically generate bundle offers based on your products
          </p>
        </div>
      )}
    </div>
  );
};