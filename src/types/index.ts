export interface Product {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice?: number;
  marketPrice?: number;
  quantity: number;
  isActive: boolean;
  description?: string;
  sku?: string;
  supplier?: string;
  lastUpdated?: Date;
}

export interface PricingConfig {
  profitMargin: number;
  adCost: number;
  deliveryCost: number;
  taxRate: number;
  gatewayFee: number;
  currency: string;
}

export interface DashboardMetrics {
  totalInvestment: number;
  totalRevenue: number;
  totalProfit: number;
  roi: number;
  avgProfit: number;
  profitMargin: number;
  productCount: number;
}

export interface PriceCalculation {
  sellingPrice: number;
  netProfit: number;
  profitMargin: number;
}

export interface CategoryStats {
  category: string;
  count: number;
  totalInvestment: number;
  totalProfit: number;
  avgProfitMargin: number;
}

export interface PricingStrategy {
  id: string;
  name: string;
  description: string;
  type: 'psychological' | 'volume' | 'bundle' | 'seasonal' | 'dynamic' | 'loyalty';
  isActive: boolean;
  parameters: {
    [key: string]: any;
  };
}

export interface BundleOffer {
  id: string;
  name: string;
  category: string;
  products: Product[];
  bundlePrice: number;
  originalPrice: number;
  discount: number;
  color: string;
  isActive: boolean;
}

export interface AIRecommendation {
  type: 'pricing' | 'bundle' | 'strategy';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
  data?: any;
}