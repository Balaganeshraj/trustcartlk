import React from 'react';
import { Settings, Calculator, DollarSign, Truck, CreditCard, TrendingUp, Zap, RefreshCw } from 'lucide-react';
import { PricingConfig } from '../types';

interface PricingSettingsProps {
  config: PricingConfig;
  setConfig: (config: PricingConfig) => void;
  onApplyToAllProducts?: () => void;
  productCount?: number;
}

export const PricingSettings: React.FC<PricingSettingsProps> = ({ 
  config, 
  setConfig, 
  onApplyToAllProducts,
  productCount = 0 
}) => {
  const updateConfig = (field: keyof PricingConfig, value: number | string) => {
    setConfig({ ...config, [field]: value });
  };

  const presetConfigs = [
    {
      name: 'Conservative',
      description: 'Lower risk, steady profits',
      config: { ...config, profitMargin: 15, adCost: 15, deliveryCost: 300 }
    },
    {
      name: 'Balanced',
      description: 'Optimal risk-reward ratio',
      config: { ...config, profitMargin: 25, adCost: 20, deliveryCost: 400 }
    },
    {
      name: 'Aggressive',
      description: 'Higher margins, premium positioning',
      config: { ...config, profitMargin: 40, adCost: 30, deliveryCost: 500 }
    }
  ];

  const currencies = ['LKR', 'USD', 'EUR', 'GBP', 'INR'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Pricing Configuration</h3>
          <p className="text-gray-600 mt-1">Configure your global pricing parameters and strategies</p>
        </div>
        <Settings className="w-6 h-6 text-gray-400" />
      </div>

      {/* Apply to All Products Button */}
      {productCount > 0 && onApplyToAllProducts && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Recalculate All Prices</h4>
                <p className="text-gray-600">Apply current pricing configuration to all {productCount} products</p>
              </div>
            </div>
            <button
              onClick={onApplyToAllProducts}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="font-medium">Apply to All Products</span>
            </button>
          </div>
          <div className="mt-4 text-sm text-blue-700 bg-blue-100 p-3 rounded-lg">
            <strong>Note:</strong> This will recalculate selling prices for all products based on their cost prices and current settings. 
            Products with manually set selling prices will be overwritten.
          </div>
        </div>
      )}

      {/* Quick Presets */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Quick Presets</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presetConfigs.map((preset, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
              onClick={() => setConfig(preset.config)}
            >
              <h5 className="font-medium text-gray-900 mb-1">{preset.name}</h5>
              <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Profit: {preset.config.profitMargin}%</div>
                <div>Ad Cost: {preset.config.currency} {preset.config.adCost}</div>
                <div>Delivery: {preset.config.currency} {preset.config.deliveryCost}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <label className="text-sm font-medium text-blue-900">Profit Margin (%)</label>
            </div>
            <input
              type="number"
              value={config.profitMargin}
              onChange={(e) => updateConfig('profitMargin', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="100"
              step="1"
            />
            <p className="text-xs text-blue-700 mt-2">Target profit percentage on cost price</p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <DollarSign className="w-5 h-5 text-green-600" />
              <label className="text-sm font-medium text-green-900">Currency</label>
            </div>
            <select
              value={config.currency}
              onChange={(e) => updateConfig('currency', e.target.value)}
              className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {currencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
            <p className="text-xs text-green-700 mt-2">Display currency for all prices</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Calculator className="w-5 h-5 text-purple-600" />
              <label className="text-sm font-medium text-purple-900">Ad Cost per Product ({config.currency})</label>
            </div>
            <input
              type="number"
              value={config.adCost}
              onChange={(e) => updateConfig('adCost', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              min="0"
              step="1"
            />
            <p className="text-xs text-purple-700 mt-2">Average advertising cost per product</p>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Truck className="w-5 h-5 text-orange-600" />
              <label className="text-sm font-medium text-orange-900">Delivery Cost ({config.currency})</label>
            </div>
            <input
              type="number"
              value={config.deliveryCost}
              onChange={(e) => updateConfig('deliveryCost', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              min="0"
              step="10"
            />
            <p className="text-xs text-orange-700 mt-2">Standard delivery charge per order</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Calculator className="w-5 h-5 text-red-600" />
              <label className="text-sm font-medium text-red-900">Tax Rate (%)</label>
            </div>
            <input
              type="number"
              value={config.taxRate}
              onChange={(e) => updateConfig('taxRate', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              min="0"
              max="30"
              step="0.1"
            />
            <p className="text-xs text-red-700 mt-2">Applicable tax rate on sales</p>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <label className="text-sm font-medium text-indigo-900">Payment Gateway Fee (%)</label>
            </div>
            <input
              type="number"
              value={config.gatewayFee}
              onChange={(e) => updateConfig('gatewayFee', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              min="0"
              max="10"
              step="0.1"
            />
            <p className="text-xs text-indigo-700 mt-2">Payment processing fee percentage</p>
          </div>
        </div>
      </div>

      {/* Pricing Formula Display */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-3">Pricing Formula</h4>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <code className="text-sm text-gray-800">
            <div className="space-y-1">
              <div><strong>Base Price</strong> = Cost + (Cost × {config.profitMargin}%) + {config.currency} {config.adCost} + {config.currency} {config.deliveryCost}</div>
              <div><strong>Price + Tax</strong> = Base Price × (1 + {config.taxRate}%)</div>
              <div><strong>Final Price</strong> = (Price + Tax) ÷ (1 - {config.gatewayFee}%)</div>
            </div>
          </code>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          This formula ensures all costs are covered and your target profit margin is achieved after all fees and taxes.
        </p>
      </div>
    </div>
  );
};