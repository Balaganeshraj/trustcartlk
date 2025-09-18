import React, { useMemo } from 'react';
import { TrendingUp, DollarSign, Package, Target, BarChart3, PieChart } from 'lucide-react';
import { DashboardMetrics, Product, PricingConfig, CategoryStats, PriceCalculation } from '../types';

interface DashboardProps {
  metrics: DashboardMetrics;
  products: Product[];
  config: PricingConfig;
  calculatePrice: (costPrice: number) => PriceCalculation;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  metrics, 
  products, 
  config, 
  calculatePrice 
}) => {
  const categoryStats = useMemo(() => {
    const stats = new Map<string, CategoryStats>();
    
    products.filter(p => p.isActive).forEach(product => {
      const pricing = calculatePrice(product.costPrice);
      const investment = product.costPrice * product.quantity;
      const profit = pricing.netProfit * product.quantity;
      
      if (!stats.has(product.category)) {
        stats.set(product.category, {
          category: product.category,
          count: 0,
          totalInvestment: 0,
          totalProfit: 0,
          avgProfitMargin: 0
        });
      }
      
      const current = stats.get(product.category)!;
      current.count += 1;
      current.totalInvestment += investment;
      current.totalProfit += profit;
    });
    
    // Calculate average profit margins
    stats.forEach((stat) => {
      const categoryProducts = products.filter(p => p.category === stat.category && p.isActive);
      const totalMargin = categoryProducts.reduce((sum, p) => {
        const sellingPrice = p.sellingPrice || calculatePrice(p.costPrice).sellingPrice;
        const netProfit = sellingPrice - p.costPrice - config.adCost - config.deliveryCost - 
                          (sellingPrice * config.taxRate / 100) - (sellingPrice * config.gatewayFee / 100);
        const profitMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
        return sum + profitMargin;
      }, 0);
      stat.avgProfitMargin = totalMargin / categoryProducts.length;
    });
    
    return Array.from(stats.values()).sort((a, b) => b.totalProfit - a.totalProfit);
  }, [products, calculatePrice]);

  const profitDistribution = useMemo(() => {
    const distribution = { high: 0, good: 0, fair: 0, low: 0 };
    
    products.filter(p => p.isActive).forEach(product => {
      const sellingPrice = product.sellingPrice || calculatePrice(product.costPrice).sellingPrice;
      const netProfit = sellingPrice - product.costPrice - config.adCost - config.deliveryCost - 
                        (sellingPrice * config.taxRate / 100) - (sellingPrice * config.gatewayFee / 100);
      const margin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
      
      if (margin >= 25) distribution.high++;
      else if (margin >= 15) distribution.good++;
      else if (margin >= 5) distribution.fair++;
      else distribution.low++;
    });
    
    return distribution;
  }, [products, calculatePrice]);

  const formatCurrency = (amount: number) => `${config.currency} ${Math.round(amount).toLocaleString()}`;

  const metricCards = [
    {
      title: 'Total Investment',
      value: formatCurrency(metrics.totalInvestment),
      icon: DollarSign,
      color: 'from-orange-500 to-yellow-500',
      bgColor: 'from-orange-50 to-yellow-50',
      change: '+12.5%'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      icon: TrendingUp,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-50 to-orange-50',
      change: '+18.2%'
    },
    {
      title: 'Net Profit',
      value: formatCurrency(metrics.totalProfit),
      icon: Target,
      color: 'from-orange-600 to-red-500',
      bgColor: 'from-orange-50 to-red-50',
      change: '+24.7%'
    },
    {
      title: 'ROI',
      value: `${metrics.roi.toFixed(1)}%`,
      icon: BarChart3,
      color: 'from-yellow-600 to-orange-600',
      bgColor: 'from-yellow-50 to-orange-50',
      change: '+8.3%'
    }
  ];

  return (
    <div className="space-y-8 bg-white">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-orange-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-black">Business Dashboard</h2>
            <p className="text-gray-700 mt-1">Real-time insights into your pricing strategy and profitability</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-orange-600">{metrics.profitMargin.toFixed(1)}%</div>
            <div className="text-sm text-orange-500">Overall Profit Margin</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <div key={index} className={`bg-gradient-to-br ${metric.bgColor} rounded-xl p-6 border-2 border-orange-200 hover:shadow-lg transition-all duration-200`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 bg-gradient-to-r ${metric.color} rounded-lg`}>
                <metric.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-orange-600 text-sm font-medium">{metric.change}</span>
            </div>
            <div className="text-2xl font-bold text-black mb-1">{metric.value}</div>
            <div className="text-gray-700 text-sm">{metric.title}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-orange-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-black">Category Performance</h3>
            <PieChart className="w-6 h-6 text-orange-600" />
          </div>
          
          <div className="space-y-4">
            {categoryStats.slice(0, 5).map((category, index) => {
              const profitPercentage = metrics.totalProfit > 0 ? (category.totalProfit / metrics.totalProfit) * 100 : 0;
              
              return (
                <div key={category.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-black">{category.category}</span>
                    <span className="text-sm text-gray-700">{formatCurrency(category.totalProfit)}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-gradient-to-r ${
                          index === 0 ? 'from-orange-500 to-yellow-500' :
                          index === 1 ? 'from-yellow-500 to-orange-500' :
                          index === 2 ? 'from-orange-600 to-red-500' :
                          index === 3 ? 'from-yellow-600 to-orange-600' :
                          'from-orange-400 to-yellow-400'
                        }`}
                        style={{ width: `${Math.max(profitPercentage, 2)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12">{profitPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{category.count} products</span>
                    <span>{category.avgProfitMargin.toFixed(1)}% avg margin</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Profit Distribution */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-orange-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-black">Profit Distribution</h3>
            <BarChart3 className="w-6 h-6 text-orange-600" />
          </div>
          
          <div className="space-y-4">
            {[
              { label: 'High Profit (≥25%)', count: profitDistribution.high, color: 'from-orange-500 to-yellow-500', bgColor: 'bg-orange-100' },
              { label: 'Good Profit (15-24%)', count: profitDistribution.good, color: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-100' },
              { label: 'Fair Profit (5-14%)', count: profitDistribution.fair, color: 'from-yellow-500 to-yellow-600', bgColor: 'bg-yellow-100' },
              { label: 'Low Profit (<5%)', count: profitDistribution.low, color: 'from-red-500 to-red-600', bgColor: 'bg-red-100' }
            ].map((item, index) => {
              const percentage = metrics.productCount > 0 ? (item.count / metrics.productCount) * 100 : 0;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-black">{item.label}</span>
                    <span className="text-sm text-gray-700">{item.count} products</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-gradient-to-r ${item.color}`}
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-orange-200 p-6">
        <h3 className="text-xl font-semibold text-black mb-6">Detailed Product Analytics</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b-2 border-orange-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">Products</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">Investment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">Profit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">Avg Margin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">Performance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoryStats.map((category, index) => (
                <tr key={category.category} className="hover:bg-orange-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-black">{category.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-black">{category.count}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-black">{formatCurrency(category.totalInvestment)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-orange-600">{formatCurrency(category.totalProfit)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-black">{category.avgProfitMargin.toFixed(1)}%</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            category.avgProfitMargin >= 25 ? 'bg-orange-500' :
                            category.avgProfitMargin >= 15 ? 'bg-yellow-500' :
                            category.avgProfitMargin >= 5 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(category.avgProfitMargin * 2, 100)}%` }}
                        />
                      </div>
                      <span className={`ml-2 text-xs font-medium ${
                        category.avgProfitMargin >= 25 ? 'text-orange-600' :
                        category.avgProfitMargin >= 15 ? 'text-yellow-600' :
                        category.avgProfitMargin >= 5 ? 'text-yellow-500' :
                        'text-red-600'
                      }`}>
                        {category.avgProfitMargin >= 25 ? 'Excellent' :
                         category.avgProfitMargin >= 15 ? 'Good' :
                         category.avgProfitMargin >= 5 ? 'Fair' : 'Poor'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};