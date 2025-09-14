import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Package, Target, Zap, Gift, Users, Calendar, CheckCircle } from 'lucide-react';
import { Product, PricingConfig, AIRecommendation, BundleOffer } from '../types';
import { generateAIRecommendations, generateAutoBundles, generatePsychologicalPrice, categoryBundleConfig } from '../utils/aiStrategies';

interface AIStrategiesProps {
  products: Product[];
  config: PricingConfig;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
  onCreateBundle: (bundle: BundleOffer) => void;
}

export const AIStrategies: React.FC<AIStrategiesProps> = ({
  products,
  config,
  onUpdateProduct,
  onCreateBundle
}) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [bundles, setBundles] = useState<BundleOffer[]>([]);
  const [appliedRecommendations, setAppliedRecommendations] = useState<Set<number>>(new Set());
  const [activeStrategies, setActiveStrategies] = useState({
    psychological: true,
    bundles: true,
    dynamic: false,
    volume: true,
    loyalty: false,
    seasonal: false
  });

  useEffect(() => {
    const newRecommendations = generateAIRecommendations(products, config);
    setRecommendations(newRecommendations);
    
    const newBundles = generateAutoBundles(products);
    setBundles(newBundles);
  }, [products, config]);

  const applyPsychologicalPricing = (productId: string, currentPrice: number) => {
    const newPrice = generatePsychologicalPrice(currentPrice);
    onUpdateProduct(productId, { sellingPrice: newPrice });
  };

  const applyRecommendation = (index: number, rec: AIRecommendation) => {
    if (rec.type === 'pricing') {
      // Find products that need psychological pricing
      const productsToUpdate = products.filter(p => {
        if (p.sellingPrice && p.sellingPrice > 0) {
          const psychPrice = generatePsychologicalPrice(p.sellingPrice);
          return Math.abs(p.sellingPrice - psychPrice) > 10;
        }
        return false;
      });

      // Apply psychological pricing to all relevant products
      productsToUpdate.forEach(product => {
        if (product.sellingPrice) {
          const newPrice = generatePsychologicalPrice(product.sellingPrice);
          onUpdateProduct(product.id, { sellingPrice: newPrice });
        }
      });
    }

    // Mark as applied
    setAppliedRecommendations(prev => new Set([...prev, index]));
  };

  const createBundle = (bundle: BundleOffer) => {
    onCreateBundle(bundle);
  };

  const strategyCards = [
    {
      id: 'psychological',
      title: 'Psychological Pricing',
      description: 'Use prices ending in .99 or .95',
      icon: Brain,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100'
    },
    {
      id: 'bundles',
      title: 'Smart Bundles',
      description: 'AI-generated product combinations',
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100'
    },
    {
      id: 'dynamic',
      title: 'Dynamic Pricing',
      description: 'Adjust based on demand & competition',
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100'
    },
    {
      id: 'volume',
      title: 'Volume Discounts',
      description: 'Bulk purchase incentives',
      icon: Target,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100'
    },
    {
      id: 'loyalty',
      title: 'Loyalty Programs',
      description: 'Reward repeat customers',
      icon: Users,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'from-pink-50 to-pink-100'
    },
    {
      id: 'seasonal',
      title: 'Seasonal Promotions',
      description: 'Holiday & event-based pricing',
      icon: Calendar,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'from-indigo-50 to-indigo-100'
    }
  ];

  return (
    <div className="space-y-8">
      {/* AI Strategies Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <Brain className="w-8 h-8 text-purple-600" />
              <span>AI Pricing Strategies</span>
            </h2>
            <p className="text-gray-600 mt-1">Intelligent recommendations to optimize your pricing and increase profits</p>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">AI Powered</span>
          </div>
        </div>

        {/* Strategy Toggle Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategyCards.map((strategy) => (
            <div
              key={strategy.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                activeStrategies[strategy.id]
                  ? `bg-gradient-to-br ${strategy.bgColor} border-current`
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setActiveStrategies(prev => ({
                ...prev,
                [strategy.id]: !prev[strategy.id]
              }))}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${strategy.color}`}>
                  <strategy.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{strategy.title}</h3>
                  <p className="text-sm text-gray-600">{strategy.description}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  activeStrategies[strategy.id]
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300'
                }`}>
                  {activeStrategies[strategy.id] && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Target className="w-6 h-6 text-blue-600" />
            <span>AI Recommendations</span>
          </h3>
          
          <div className="space-y-4">
            {recommendations.slice(0, 5).map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.impact === 'high' ? 'border-red-500 bg-red-50' :
                  rec.impact === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      rec.impact === 'high' ? 'bg-red-100 text-red-800' :
                      rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {rec.impact.toUpperCase()} IMPACT
                    </span>
                  </div>
                  <div className="ml-4">
                    {appliedRecommendations.has(index) ? (
                      <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Applied</span>
                      </div>
                    ) : (
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        onClick={() => applyRecommendation(index, rec)}
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto-Generated Bundles */}
      {bundles.length > 0 && activeStrategies.bundles && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Gift className="w-6 h-6 text-green-600" />
            <span>AI-Generated Bundle Offers</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle) => (
              <div
                key={bundle.id}
                className="border-2 rounded-xl p-4 hover:shadow-lg transition-all duration-200"
                style={{ borderColor: bundle.color, backgroundColor: `${bundle.color}10` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900">{bundle.name}</h4>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                    -{bundle.discount}%
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  {bundle.products.slice(0, 4).map((product, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 truncate">{product.name}</span>
                      <span className="text-gray-500 ml-2">{config.currency} {product.sellingPrice?.toLocaleString()}</span>
                    </div>
                  ))}
                  {bundle.products.length > 4 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{bundle.products.length - 4} more products
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 line-through">
                      {config.currency} {bundle.originalPrice.toLocaleString()}
                    </span>
                    <span className="text-lg font-bold" style={{ color: bundle.color }}>
                      {config.currency} {bundle.bundlePrice.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => createBundle(bundle)}
                    className="w-full py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: bundle.color }}
                  >
                    Create Bundle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Strategy Insights */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Strategy Insights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Active Strategies Impact</h4>
            {Object.entries(activeStrategies).map(([key, isActive]) => {
              const strategy = strategyCards.find(s => s.id === key);
              if (!strategy) return null;
              
              return (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <strategy.icon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">{strategy.title}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Potential Revenue Impact</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-700">Psychological Pricing</span>
                <span className="text-sm font-bold text-green-600">+5-15%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-700">Bundle Offers</span>
                <span className="text-sm font-bold text-blue-600">+20-35%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-gray-700">Volume Discounts</span>
                <span className="text-sm font-bold text-purple-600">+10-25%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-sm text-gray-700">Dynamic Pricing</span>
                <span className="text-sm font-bold text-orange-600">+8-20%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};