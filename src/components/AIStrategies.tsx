import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Package, Target, Zap, Gift, Users, Calendar, CheckCircle, Lightbulb, DollarSign, BarChart3, Sparkles } from 'lucide-react';
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
  const [priceOptimizations, setPriceOptimizations] = useState<any[]>([]);
  const [businessIdeas, setBusinessIdeas] = useState<string[]>([]);
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

    // Generate AI price optimizations
    generatePriceOptimizations();
    
    // Generate business ideas
    generateBusinessIdeas();
  }, [products, config]);

  const generatePriceOptimizations = () => {
    const optimizations = products.map(product => {
      if (product.costPrice === 0) return null;

      const currentPrice = product.sellingPrice || calculatePrice(product.costPrice).sellingPrice;
      const marketPrice = product.marketPrice || 0;
      
      // AI suggestions based on market analysis
      const suggestions = [];
      
      // Competitive pricing
      if (marketPrice > 0) {
        const competitivePrice = marketPrice * 0.95; // 5% below market
        if (competitivePrice > currentPrice * 1.1) {
          suggestions.push({
            type: 'competitive',
            suggestedPrice: Math.round(competitivePrice),
            reason: 'Price 5% below market rate for competitive advantage',
            impact: 'High',
            potentialIncrease: ((competitivePrice - currentPrice) / currentPrice * 100).toFixed(1)
          });
        }
      }

      // Premium positioning
      const premiumPrice = currentPrice * 1.25;
      suggestions.push({
        type: 'premium',
        suggestedPrice: Math.round(premiumPrice),
        reason: 'Premium positioning for higher margins',
        impact: 'Medium',
        potentialIncrease: '25.0'
      });

      // Psychological pricing
      const psychPrice = generatePsychologicalPrice(currentPrice);
      if (Math.abs(currentPrice - psychPrice) > 10) {
        suggestions.push({
          type: 'psychological',
          suggestedPrice: psychPrice,
          reason: 'Psychological pricing for better conversion',
          impact: 'Medium',
          potentialIncrease: ((psychPrice - currentPrice) / currentPrice * 100).toFixed(1)
        });
      }

      return {
        product,
        currentPrice,
        suggestions: suggestions.filter(s => s.suggestedPrice > product.costPrice * 1.1)
      };
    }).filter(Boolean);

    setPriceOptimizations(optimizations);
  };

  const generateBusinessIdeas = () => {
    const ideas = [
      "🎯 Launch seasonal promotions during festivals and holidays for 20-30% revenue boost",
      "📦 Create subscription boxes for regular customers with 15% discount incentive",
      "🤝 Partner with complementary businesses for cross-selling opportunities",
      "📱 Develop mobile app with exclusive deals and push notifications",
      "🎁 Implement referral program: Give 10% discount for each successful referral",
      "📊 Use dynamic pricing based on demand patterns and competitor analysis",
      "🏪 Expand to multiple sales channels: Online marketplaces, social media, physical stores",
      "💳 Offer flexible payment options: Buy now pay later, installments",
      "🎨 Create limited edition products with premium pricing strategy",
      "📈 Implement loyalty tiers: Bronze, Silver, Gold with increasing benefits",
      "🚚 Optimize delivery zones for faster shipping and reduced costs",
      "📧 Set up automated email marketing for abandoned carts and repeat purchases",
      "🔍 Use AI chatbots for 24/7 customer support and sales assistance",
      "📱 Leverage social media influencers for product promotion",
      "🎪 Host virtual events and product launches to engage customers"
    ];
    
    setBusinessIdeas(ideas);
  };

  const calculatePrice = (costPrice: number) => {
    if (costPrice === 0) return { sellingPrice: 0, netProfit: 0, profitMargin: 0 };
    
    const basePrice = costPrice + (costPrice * config.profitMargin / 100) + config.adCost + config.deliveryCost;
    const priceWithTax = basePrice + (basePrice * config.taxRate / 100);
    const sellingPrice = Math.round(priceWithTax / (1 - config.gatewayFee / 100));
    
    const netProfit = sellingPrice - costPrice - config.adCost - config.deliveryCost - 
                      (sellingPrice * config.taxRate / 100) - (sellingPrice * config.gatewayFee / 100);
    
    const profitMargin = (netProfit / sellingPrice) * 100;
    
    return { sellingPrice, netProfit, profitMargin };
  };

  const applyPriceOptimization = (productId: string, suggestedPrice: number) => {
    onUpdateProduct(productId, { sellingPrice: suggestedPrice });
  };

  const applyRecommendation = (index: number, rec: AIRecommendation) => {
    if (rec.type === 'pricing') {
      const productsToUpdate = products.filter(p => {
        if (p.sellingPrice && p.sellingPrice > 0) {
          const psychPrice = generatePsychologicalPrice(p.sellingPrice);
          return Math.abs(p.sellingPrice - psychPrice) > 10;
        }
        return false;
      });

      productsToUpdate.forEach(product => {
        if (product.sellingPrice) {
          const newPrice = generatePsychologicalPrice(product.sellingPrice);
          onUpdateProduct(product.id, { sellingPrice: newPrice });
        }
      });
    }

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
      color: 'from-orange-500 to-yellow-500',
      bgColor: 'from-orange-50 to-yellow-50'
    },
    {
      id: 'bundles',
      title: 'Smart Bundles',
      description: 'AI-generated product combinations',
      icon: Package,
      color: 'from-orange-600 to-red-500',
      bgColor: 'from-orange-50 to-red-50'
    },
    {
      id: 'dynamic',
      title: 'Dynamic Pricing',
      description: 'Adjust based on demand & competition',
      icon: TrendingUp,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-50 to-orange-50'
    },
    {
      id: 'volume',
      title: 'Volume Discounts',
      description: 'Bulk purchase incentives',
      icon: Target,
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50'
    },
    {
      id: 'loyalty',
      title: 'Loyalty Programs',
      description: 'Reward repeat customers',
      icon: Users,
      color: 'from-yellow-600 to-orange-600',
      bgColor: 'from-yellow-50 to-orange-50'
    },
    {
      id: 'seasonal',
      title: 'Seasonal Promotions',
      description: 'Holiday & event-based pricing',
      icon: Calendar,
      color: 'from-orange-400 to-yellow-600',
      bgColor: 'from-orange-50 to-yellow-50'
    }
  ];

  return (
    <div className="space-y-8 bg-white">
      {/* AI Strategies Header */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-orange-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-black flex items-center space-x-3">
              <Brain className="w-8 h-8 text-orange-600" />
              <span>AI Pricing Strategies</span>
            </h2>
            <p className="text-gray-700 mt-1">Intelligent recommendations to optimize your pricing and increase profits</p>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <span className="text-sm font-medium text-orange-700">AI Powered</span>
          </div>
        </div>

        {/* Strategy Toggle Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategyCards.map((strategy) => (
            <div
              key={strategy.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                activeStrategies[strategy.id]
                  ? `bg-gradient-to-br ${strategy.bgColor} border-orange-400`
                  : 'bg-gray-50 border-gray-200 hover:border-orange-300'
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
                  <h3 className="font-semibold text-black">{strategy.title}</h3>
                  <p className="text-sm text-gray-600">{strategy.description}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  activeStrategies[strategy.id]
                    ? 'bg-orange-500 border-orange-500'
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

      {/* AI Price Optimization */}
      {priceOptimizations.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-orange-200 p-6">
          <h3 className="text-xl font-semibold text-black mb-4 flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-orange-600" />
            <span>AI Price Optimization</span>
          </h3>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {priceOptimizations.slice(0, 10).map((opt, index) => (
              <div key={index} className="border border-orange-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-black">{opt.product.name}</h4>
                    <p className="text-sm text-gray-600">Current: {config.currency} {opt.currentPrice.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {opt.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              suggestion.type === 'competitive' ? 'bg-blue-100 text-blue-800' :
                              suggestion.type === 'premium' ? 'bg-purple-100 text-purple-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {suggestion.type.toUpperCase()}
                            </span>
                            <span className="text-lg font-bold text-orange-600">
                              {config.currency} {suggestion.suggestedPrice.toLocaleString()}
                            </span>
                            <span className="text-sm text-green-600 font-medium">
                              +{suggestion.potentialIncrease}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{suggestion.reason}</p>
                        </div>
                        <button
                          onClick={() => applyPriceOptimization(opt.product.id, suggestion.suggestedPrice)}
                          className="ml-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all text-sm font-medium"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Business Ideas */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-orange-200 p-6">
        <h3 className="text-xl font-semibold text-black mb-4 flex items-center space-x-2">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          <span>AI Business Growth Ideas</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {businessIdeas.map((idea, index) => (
            <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-800">{idea}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-orange-200 p-6">
          <h3 className="text-xl font-semibold text-black mb-4 flex items-center space-x-2">
            <Target className="w-6 h-6 text-orange-600" />
            <span>AI Recommendations</span>
          </h3>
          
          <div className="space-y-4">
            {recommendations.slice(0, 5).map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.impact === 'high' ? 'border-red-500 bg-red-50' :
                  rec.impact === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-orange-500 bg-orange-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-black mb-1">{rec.title}</h4>
                    <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      rec.impact === 'high' ? 'bg-red-100 text-red-800' :
                      rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-orange-100 text-orange-800'
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
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all text-sm font-medium"
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
        <div className="bg-white rounded-xl shadow-lg border-2 border-orange-200 p-6">
          <h3 className="text-xl font-semibold text-black mb-4 flex items-center space-x-2">
            <Gift className="w-6 h-6 text-orange-600" />
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
                  <h4 className="font-bold text-black">{bundle.name}</h4>
                  <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
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
                    <span className="text-lg font-bold text-orange-600">
                      {config.currency} {bundle.bundlePrice.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => createBundle(bundle)}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-medium hover:from-orange-600 hover:to-yellow-600 transition-all"
                  >
                    Create Bundle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategy Insights */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-orange-200 p-6">
        <h3 className="text-xl font-semibold text-black mb-4">Strategy Insights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-black">Active Strategies Impact</h4>
            {Object.entries(activeStrategies).map(([key, isActive]) => {
              const strategy = strategyCards.find(s => s.id === key);
              if (!strategy) return null;
              
              return (
                <div key={key} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-3">
                    <strategy.icon className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-black">{strategy.title}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    isActive ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-black">Potential Revenue Impact</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-sm text-gray-700">Psychological Pricing</span>
                <span className="text-sm font-bold text-orange-600">+5-15%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-sm text-gray-700">Bundle Offers</span>
                <span className="text-sm font-bold text-yellow-600">+20-35%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-sm text-gray-700">Volume Discounts</span>
                <span className="text-sm font-bold text-orange-600">+10-25%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-sm text-gray-700">Dynamic Pricing</span>
                <span className="text-sm font-bold text-yellow-600">+8-20%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};