import { ecommerceCategories } from './categoryDetection';

export const categoryBundleConfig = {
  'Electronics': {
    name: 'Tech Bundle',
    color: '#3B82F6',
    minProducts: 2,
    maxProducts: 4,
    discount: 15,
    keywords: ['smartphone', 'laptop', 'tablet', 'headphone', 'charger', 'cable']
  },
  'Fashion': {
    name: 'Style Pack',
    color: '#EC4899',
    minProducts: 3,
    maxProducts: 4,
    discount: 20,
    keywords: ['dress', 'shirt', 'pants', 'shoes', 'bag', 'accessory']
  },
  'Beauty': {
    name: 'Beauty Kit',
    color: '#F59E0B',
    minProducts: 3,
    maxProducts: 5,
    discount: 25,
    keywords: ['skincare', 'makeup', 'cream', 'serum', 'lipstick', 'foundation']
  },
  'Health': {
    name: 'Wellness Pack',
    color: '#10B981',
    minProducts: 2,
    maxProducts: 4,
    discount: 18,
    keywords: ['supplement', 'vitamin', 'protein', 'medicine', 'fitness', 'health']
  },
  'Home & Garden': {
    name: 'Home Essentials',
    color: '#8B5CF6',
    minProducts: 3,
    maxProducts: 4,
    discount: 22,
    keywords: ['furniture', 'decor', 'kitchen', 'garden', 'cleaning', 'storage']
  },
  'Kitchen': {
    name: 'Kitchen Set',
    color: '#EF4444',
    minProducts: 2,
    maxProducts: 4,
    discount: 20,
    keywords: ['appliance', 'cookware', 'utensil', 'knife', 'pan', 'pot']
  },
  'Sports': {
    name: 'Fitness Bundle',
    color: '#06B6D4',
    minProducts: 2,
    maxProducts: 3,
    discount: 15,
    keywords: ['equipment', 'fitness', 'gym', 'exercise', 'sports', 'training']
  },
  'Books': {
    name: 'Learning Pack',
    color: '#84CC16',
    minProducts: 3,
    maxProducts: 5,
    discount: 30,
    keywords: ['book', 'educational', 'novel', 'guide', 'manual', 'series']
  },
  'Toys': {
    name: 'Play Set',
    color: '#F97316',
    minProducts: 2,
    maxProducts: 4,
    discount: 25,
    keywords: ['toy', 'game', 'puzzle', 'educational', 'electronic', 'kids']
  },
  'Computers & Laptops': {
    name: 'Tech Pro Bundle',
    color: '#6366F1',
    minProducts: 2,
    maxProducts: 3,
    discount: 12,
    keywords: ['laptop', 'computer', 'pc', 'desktop', 'notebook']
  },
  'Mobile Phones & Accessories': {
    name: 'Mobile Complete Pack',
    color: '#8B5CF6',
    minProducts: 3,
    maxProducts: 5,
    discount: 18,
    keywords: ['phone', 'smartphone', 'case', 'charger', 'cable']
  },
  'Audio & Headphones': {
    name: 'Audio Experience Set',
    color: '#EC4899',
    minProducts: 2,
    maxProducts: 4,
    discount: 20,
    keywords: ['headphone', 'speaker', 'audio', 'sound', 'music']
  },
  'Cameras & Photography': {
    name: 'Photography Kit',
    color: '#14B8A6',
    minProducts: 2,
    maxProducts: 4,
    discount: 15,
    keywords: ['camera', 'lens', 'photography', 'tripod']
  },
  'Gaming & Consoles': {
    name: 'Gaming Ultimate Pack',
    color: '#F59E0B',
    minProducts: 2,
    maxProducts: 4,
    discount: 22,
    keywords: ['gaming', 'console', 'controller', 'game']
  },
  'Men\'s Clothing': {
    name: 'Men\'s Style Pack',
    color: '#3B82F6',
    minProducts: 3,
    maxProducts: 4,
    discount: 25,
    keywords: ['men', 'shirt', 'pants', 'suit', 'jacket']
  },
  'Women\'s Clothing': {
    name: 'Women\'s Fashion Set',
    color: '#EC4899',
    minProducts: 3,
    maxProducts: 4,
    discount: 25,
    keywords: ['women', 'dress', 'blouse', 'skirt', 'female']
  },
  'Shoes & Footwear': {
    name: 'Footwear Collection',
    color: '#8B5CF6',
    minProducts: 2,
    maxProducts: 3,
    discount: 20,
    keywords: ['shoes', 'sneakers', 'boots', 'sandals']
  },
  'Skincare': {
    name: 'Skincare Routine Kit',
    color: '#10B981',
    minProducts: 3,
    maxProducts: 5,
    discount: 30,
    keywords: ['skincare', 'cream', 'serum', 'moisturizer']
  },
  'Makeup & Cosmetics': {
    name: 'Makeup Essentials',
    color: '#F59E0B',
    minProducts: 4,
    maxProducts: 6,
    discount: 25,
    keywords: ['makeup', 'lipstick', 'foundation', 'mascara']
  },
  'Hair Care': {
    name: 'Hair Care Set',
    color: '#8B5CF6',
    minProducts: 2,
    maxProducts: 4,
    discount: 20,
    keywords: ['shampoo', 'conditioner', 'hair', 'styling']
  },
  'Furniture': {
    name: 'Home Furniture Pack',
    color: '#6B7280',
    minProducts: 2,
    maxProducts: 3,
    discount: 15,
    keywords: ['furniture', 'chair', 'table', 'sofa', 'bed']
  },
  'Kitchen & Dining': {
    name: 'Kitchen Essentials',
    color: '#EF4444',
    minProducts: 3,
    maxProducts: 5,
    discount: 22,
    keywords: ['kitchen', 'cooking', 'cookware', 'utensil']
  },
  'Fitness Equipment': {
    name: 'Home Gym Set',
    color: '#059669',
    minProducts: 2,
    maxProducts: 4,
    discount: 18,
    keywords: ['fitness', 'gym', 'exercise', 'workout']
  },
  'Baby & Kids': {
    name: 'Baby Care Bundle',
    color: '#F472B6',
    minProducts: 3,
    maxProducts: 5,
    discount: 25,
    keywords: ['baby', 'kids', 'children', 'infant']
  },
  'Pet Supplies': {
    name: 'Pet Care Pack',
    color: '#A855F7',
    minProducts: 2,
    maxProducts: 4,
    discount: 20,
    keywords: ['pet', 'dog', 'cat', 'animal']
  },
  'Office Supplies': {
    name: 'Office Productivity Set',
    color: '#6B7280',
    minProducts: 2,
    maxProducts: 4,
    discount: 15,
    keywords: ['office', 'stationery', 'business', 'work']
  }
};

export const generatePsychologicalPrice = (basePrice: number): number => {
  if (basePrice < 100) return Math.floor(basePrice) - 0.01;
  if (basePrice < 1000) return Math.floor(basePrice / 10) * 10 - 1;
  if (basePrice < 10000) return Math.floor(basePrice / 100) * 100 - 5;
  return Math.floor(basePrice / 1000) * 1000 - 99;
};

export const generateAIRecommendations = (products: any[], config: any) => {
  const recommendations = [];
  
  // Pricing Strategy Recommendations
  products.forEach(product => {
    if (product.costPrice > 0 && product.sellingPrice > 0) {
      const currentMargin = ((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100;
      
      if (currentMargin < 15) {
        recommendations.push({
          type: 'pricing',
          title: `Low Margin Alert: ${product.name}`,
          description: `Current margin is ${currentMargin.toFixed(1)}%. Consider increasing price or reducing costs.`,
          impact: 'high',
          action: 'Increase selling price or optimize costs'
        });
      }
      
      // Psychological pricing suggestion
      const psychPrice = generatePsychologicalPrice(product.sellingPrice);
      if (Math.abs(product.sellingPrice - psychPrice) > 10) {
        recommendations.push({
          type: 'pricing',
          title: `Psychological Pricing: ${product.name}`,
          description: `Consider pricing at ${config.currency} ${psychPrice.toLocaleString()} instead of ${config.currency} ${product.sellingPrice.toLocaleString()}`,
          impact: 'medium',
          action: 'Apply psychological pricing'
        });
      }
    }
  });
  
  // Bundle Recommendations
  const categoryGroups = products.reduce((groups, product) => {
    if (!groups[product.category]) groups[product.category] = [];
    groups[product.category].push(product);
    return groups;
  }, {});
  
  Object.entries(categoryGroups).forEach(([category, categoryProducts]: [string, any[]]) => {
    if (categoryProducts.length >= 2 && categoryBundleConfig[category]) {
      recommendations.push({
        type: 'bundle',
        title: `${categoryBundleConfig[category].name} Opportunity`,
        description: `Create a bundle with ${categoryProducts.length} ${category} products for increased sales`,
        impact: 'high',
        action: 'Create bundle offer',
        data: { category, products: categoryProducts }
      });
    }
  });
  
  return recommendations;
};

export const generateAutoBundles = (products: any[]) => {
  const bundles = [];
  
  // Group products by category
  const categoryGroups = products.reduce((groups, product) => {
    if (product.isActive && product.costPrice > 0 && product.sellingPrice > 0) {
      if (!groups[product.category]) groups[product.category] = [];
      groups[product.category].push(product);
    }
    return groups;
  }, {});
  
  // Generate bundles for each category
  Object.entries(categoryGroups).forEach(([category, categoryProducts]: [string, any[]]) => {
    const config = categoryBundleConfig[category];
    if (!config || categoryProducts.length < 2) return;
    
    // Sort by price and create bundle
    const sortedProducts = categoryProducts.sort((a, b) => a.sellingPrice - b.sellingPrice);
    const bundleProducts = sortedProducts.slice(0, Math.min(4, Math.max(3, sortedProducts.length)));
    
    const originalPrice = bundleProducts.reduce((sum, p) => sum + p.sellingPrice, 0);
    const discount = config.discount;
    const bundlePrice = Math.round(originalPrice * (1 - discount / 100));
    
    bundles.push({
      id: `bundle_${category.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
      name: config.name,
      category,
      products: bundleProducts,
      bundlePrice,
      originalPrice,
      discount,
      color: config.color,
      isActive: true
    });
  });
  
  return bundles;
};

export const applyDynamicPricing = (product: any, factors: any) => {
  let adjustedPrice = product.sellingPrice;
  
  // Seasonal adjustment
  if (factors.season === 'holiday') {
    adjustedPrice *= 1.1; // 10% increase during holidays
  }
  
  // Demand adjustment
  if (factors.demand === 'high') {
    adjustedPrice *= 1.05; // 5% increase for high demand
  } else if (factors.demand === 'low') {
    adjustedPrice *= 0.95; // 5% decrease for low demand
  }
  
  // Competition adjustment
  if (factors.competition === 'high') {
    adjustedPrice *= 0.98; // 2% decrease for high competition
  }
  
  return Math.round(adjustedPrice);
};

export const calculateVolumeDiscount = (quantity: number, basePrice: number) => {
  if (quantity >= 10) return basePrice * 0.85; // 15% discount
  if (quantity >= 5) return basePrice * 0.9;   // 10% discount
  if (quantity >= 3) return basePrice * 0.95;  // 5% discount
  return basePrice;
};

export const generateLoyaltyDiscount = (customerTier: string, basePrice: number) => {
  const discounts = {
    'bronze': 0.05,  // 5%
    'silver': 0.1,   // 10%
    'gold': 0.15,    // 15%
    'platinum': 0.2  // 20%
  };
  
  const discount = discounts[customerTier] || 0;
  return basePrice * (1 - discount);
};