import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Product, PricingConfig, BundleOffer } from '../types';
import { detectProductCategory } from './categoryDetection';

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface ProcessingResult {
  success: boolean;
  data: Product[];
  errors: ValidationError[];
  warnings: ValidationError[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicates: number;
  };
}

export interface AnalysisReport {
  categoryDistribution: { [key: string]: number };
  priceRanges: {
    low: number;
    medium: number;
    high: number;
    premium: number;
  };
  profitAnalysis: {
    avgMargin: number;
    totalInvestment: number;
    projectedRevenue: number;
    projectedProfit: number;
  };
  qualityScore: number;
  recommendations: string[];
}

// Required CSV headers mapping
const HEADER_MAPPING = {
  name: ['name', 'product name', 'product', 'title', 'item name'],
  category: ['category', 'dept', 'department', 'type', 'group'],
  costPrice: ['cost price', 'cost', 'buy price', 'purchase price', 'wholesale price'],
  marketPrice: ['market price', 'mrp', 'retail price', 'list price', 'msrp'],
  sellingPrice: ['selling price', 'sell price', 'price', 'sale price'],
  quantity: ['quantity', 'qty', 'stock', 'amount', 'units'],
  description: ['description', 'desc', 'details', 'info'],
  sku: ['sku', 'code', 'item code', 'product code', 'barcode'],
  supplier: ['supplier', 'vendor', 'brand', 'manufacturer']
};

export class CSVProcessor {
  private config: PricingConfig;

  constructor(config: PricingConfig) {
    this.config = config;
  }

  // Parse CSV file with validation
  async parseCSV(file: File): Promise<ProcessingResult> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase(),
        complete: (results) => {
          const processed = this.processData(results.data as any[]);
          resolve(processed);
        },
        error: (error) => {
          resolve({
            success: false,
            data: [],
            errors: [{ row: 0, field: 'file', value: file.name, message: error.message, severity: 'error' }],
            warnings: [],
            stats: { totalRows: 0, validRows: 0, invalidRows: 0, duplicates: 0 }
          });
        }
      });
    });
  }

  // Process and validate data
  private processData(rawData: any[]): ProcessingResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const validProducts: Product[] = [];
    const seenNames = new Set<string>();
    let duplicates = 0;

    // Validate headers
    const headers = Object.keys(rawData[0] || {});
    const headerValidation = this.validateHeaders(headers);
    errors.push(...headerValidation.errors);
    warnings.push(...headerValidation.warnings);

    // Process each row
    rawData.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because index starts at 0 and we have headers
      const validation = this.validateRow(row, rowNumber);
      
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);

      if (validation.isValid) {
        const product = this.createProduct(row, rowNumber);
        
        // Check for duplicates
        if (seenNames.has(product.name.toLowerCase())) {
          duplicates++;
          warnings.push({
            row: rowNumber,
            field: 'name',
            value: product.name,
            message: 'Duplicate product name detected',
            severity: 'warning'
          });
        } else {
          seenNames.add(product.name.toLowerCase());
        }

        validProducts.push(product);
      }
    });

    return {
      success: errors.length === 0,
      data: validProducts,
      errors,
      warnings,
      stats: {
        totalRows: rawData.length,
        validRows: validProducts.length,
        invalidRows: rawData.length - validProducts.length,
        duplicates
      }
    };
  }

  // Validate CSV headers
  private validateHeaders(headers: string[]): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check for required headers
    const hasName = this.findHeader(headers, HEADER_MAPPING.name);
    const hasCostPrice = this.findHeader(headers, HEADER_MAPPING.costPrice);

    if (!hasName) {
      errors.push({
        row: 1,
        field: 'headers',
        value: headers.join(', '),
        message: 'Missing required "Product Name" column',
        severity: 'error'
      });
    }

    if (!hasCostPrice) {
      errors.push({
        row: 1,
        field: 'headers',
        value: headers.join(', '),
        message: 'Missing required "Cost Price" column',
        severity: 'error'
      });
    }

    // Check for recommended headers
    const hasCategory = this.findHeader(headers, HEADER_MAPPING.category);
    const hasQuantity = this.findHeader(headers, HEADER_MAPPING.quantity);

    if (!hasCategory) {
      warnings.push({
        row: 1,
        field: 'headers',
        value: headers.join(', '),
        message: 'Missing "Category" column - will auto-detect categories',
        severity: 'warning'
      });
    }

    if (!hasQuantity) {
      warnings.push({
        row: 1,
        field: 'headers',
        value: headers.join(', '),
        message: 'Missing "Quantity" column - will default to 1',
        severity: 'warning'
      });
    }

    return { errors, warnings };
  }

  // Find header by possible names
  private findHeader(headers: string[], possibleNames: string[]): string | null {
    for (const header of headers) {
      if (possibleNames.some(name => header.includes(name))) {
        return header;
      }
    }
    return null;
  }

  // Validate individual row
  private validateRow(row: any, rowNumber: number): { isValid: boolean; errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Get field values
    const name = this.getFieldValue(row, HEADER_MAPPING.name);
    const costPrice = this.getFieldValue(row, HEADER_MAPPING.costPrice);
    const marketPrice = this.getFieldValue(row, HEADER_MAPPING.marketPrice);
    const sellingPrice = this.getFieldValue(row, HEADER_MAPPING.sellingPrice);
    const quantity = this.getFieldValue(row, HEADER_MAPPING.quantity);

    // Validate required fields
    if (!name || name.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'name',
        value: name,
        message: 'Product name is required',
        severity: 'error'
      });
    }

    if (!costPrice || isNaN(parseFloat(costPrice)) || parseFloat(costPrice) <= 0) {
      errors.push({
        row: rowNumber,
        field: 'costPrice',
        value: costPrice,
        message: 'Valid cost price is required (must be > 0)',
        severity: 'error'
      });
    }

    // Validate optional numeric fields
    if (marketPrice && (isNaN(parseFloat(marketPrice)) || parseFloat(marketPrice) < 0)) {
      warnings.push({
        row: rowNumber,
        field: 'marketPrice',
        value: marketPrice,
        message: 'Invalid market price - will be ignored',
        severity: 'warning'
      });
    }

    if (sellingPrice && (isNaN(parseFloat(sellingPrice)) || parseFloat(sellingPrice) <= 0)) {
      warnings.push({
        row: rowNumber,
        field: 'sellingPrice',
        value: sellingPrice,
        message: 'Invalid selling price - will be calculated automatically',
        severity: 'warning'
      });
    }

    if (quantity && (isNaN(parseInt(quantity)) || parseInt(quantity) <= 0)) {
      warnings.push({
        row: rowNumber,
        field: 'quantity',
        value: quantity,
        message: 'Invalid quantity - will default to 1',
        severity: 'warning'
      });
    }

    // Business logic validations
    const cost = parseFloat(costPrice) || 0;
    const market = parseFloat(marketPrice) || 0;
    const selling = parseFloat(sellingPrice) || 0;

    if (market > 0 && cost > market) {
      warnings.push({
        row: rowNumber,
        field: 'costPrice',
        value: costPrice,
        message: 'Cost price is higher than market price - check for errors',
        severity: 'warning'
      });
    }

    if (selling > 0 && selling < cost) {
      warnings.push({
        row: rowNumber,
        field: 'sellingPrice',
        value: sellingPrice,
        message: 'Selling price is lower than cost price - will result in loss',
        severity: 'warning'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Get field value from row using header mapping
  private getFieldValue(row: any, possibleHeaders: string[]): string {
    for (const key of Object.keys(row)) {
      if (possibleHeaders.some(header => key.includes(header))) {
        return row[key];
      }
    }
    return '';
  }

  // Create product from validated row
  private createProduct(row: any, rowNumber: number): Product {
    const name = this.getFieldValue(row, HEADER_MAPPING.name).trim();
    let category = this.getFieldValue(row, HEADER_MAPPING.category).trim();
    
    // Auto-detect category if not provided
    if (!category) {
      try {
        category = detectProductCategory(name) || 'Uncategorized';
      } catch {
        category = 'Uncategorized';
      }
    }

    const costPrice = parseFloat(this.getFieldValue(row, HEADER_MAPPING.costPrice)) || 0;
    const marketPrice = parseFloat(this.getFieldValue(row, HEADER_MAPPING.marketPrice)) || 0;
    const sellingPrice = parseFloat(this.getFieldValue(row, HEADER_MAPPING.sellingPrice)) || 0;
    const quantity = parseInt(this.getFieldValue(row, HEADER_MAPPING.quantity)) || 1;
    const description = this.getFieldValue(row, HEADER_MAPPING.description).trim();
    const sku = this.getFieldValue(row, HEADER_MAPPING.sku).trim();
    const supplier = this.getFieldValue(row, HEADER_MAPPING.supplier).trim();

    return {
      id: `imported_${Date.now()}_${rowNumber}`,
      name,
      category,
      costPrice,
      marketPrice: marketPrice > 0 ? marketPrice : undefined,
      sellingPrice: sellingPrice > 0 ? sellingPrice : undefined,
      quantity,
      isActive: true,
      description: description || undefined,
      sku: sku || undefined,
      supplier: supplier || undefined,
      lastUpdated: new Date()
    };
  }

  // Recalculate all formulas for products
  recalculateFormulas(products: Product[]): Product[] {
    return products.map(product => {
      if (product.costPrice > 0 && !product.sellingPrice) {
        const calculated = this.calculatePrice(product.costPrice);
        return {
          ...product,
          sellingPrice: calculated.sellingPrice,
          lastUpdated: new Date()
        };
      }
      return product;
    });
  }

  // Calculate price using current config
  private calculatePrice(costPrice: number): { sellingPrice: number; netProfit: number; profitMargin: number } {
    if (costPrice === 0) {
      return { sellingPrice: 0, netProfit: 0, profitMargin: 0 };
    }
    
    const basePrice = costPrice + (costPrice * this.config.profitMargin / 100) + this.config.adCost + this.config.deliveryCost;
    const priceWithTax = basePrice + (basePrice * this.config.taxRate / 100);
    const sellingPrice = Math.round(priceWithTax / (1 - this.config.gatewayFee / 100));
    
    const netProfit = sellingPrice - costPrice - this.config.adCost - this.config.deliveryCost - 
                      (sellingPrice * this.config.taxRate / 100) - (sellingPrice * this.config.gatewayFee / 100);
    
    const profitMargin = (netProfit / sellingPrice) * 100;
    
    return { sellingPrice, netProfit, profitMargin };
  }

  // Generate analysis report
  generateAnalysis(products: Product[]): AnalysisReport {
    const categoryDistribution: { [key: string]: number } = {};
    const priceRanges = { low: 0, medium: 0, high: 0, premium: 0 };
    let totalInvestment = 0;
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalMargin = 0;

    products.forEach(product => {
      // Category distribution
      categoryDistribution[product.category] = (categoryDistribution[product.category] || 0) + 1;

      // Price ranges (based on selling price)
      const sellingPrice = product.sellingPrice || this.calculatePrice(product.costPrice).sellingPrice;
      if (sellingPrice < 1000) priceRanges.low++;
      else if (sellingPrice < 10000) priceRanges.medium++;
      else if (sellingPrice < 50000) priceRanges.high++;
      else priceRanges.premium++;

      // Financial calculations
      const investment = product.costPrice * product.quantity;
      const revenue = sellingPrice * product.quantity;
      const netProfit = sellingPrice - product.costPrice - this.config.adCost - this.config.deliveryCost - 
                        (sellingPrice * this.config.taxRate / 100) - (sellingPrice * this.config.gatewayFee / 100);
      const profit = netProfit * product.quantity;
      const margin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

      totalInvestment += investment;
      totalRevenue += revenue;
      totalProfit += profit;
      totalMargin += margin;
    });

    const avgMargin = products.length > 0 ? totalMargin / products.length : 0;
    const qualityScore = this.calculateQualityScore(products, avgMargin);
    const recommendations = this.generateRecommendations(products, avgMargin, categoryDistribution);

    return {
      categoryDistribution,
      priceRanges,
      profitAnalysis: {
        avgMargin,
        totalInvestment,
        projectedRevenue: totalRevenue,
        projectedProfit: totalProfit
      },
      qualityScore,
      recommendations
    };
  }

  // Calculate data quality score
  private calculateQualityScore(products: Product[], avgMargin: number): number {
    let score = 100;

    // Deduct points for missing data
    const missingCategories = products.filter(p => !p.category || p.category === 'Uncategorized').length;
    const missingDescriptions = products.filter(p => !p.description).length;
    const missingSKUs = products.filter(p => !p.sku).length;

    score -= (missingCategories / products.length) * 20;
    score -= (missingDescriptions / products.length) * 15;
    score -= (missingSKUs / products.length) * 10;

    // Deduct points for poor profit margins
    if (avgMargin < 10) score -= 20;
    else if (avgMargin < 20) score -= 10;

    // Deduct points for price inconsistencies
    const priceIssues = products.filter(p => {
      const selling = p.sellingPrice || this.calculatePrice(p.costPrice).sellingPrice;
      return selling < p.costPrice || (p.marketPrice && selling > p.marketPrice * 1.2);
    }).length;

    score -= (priceIssues / products.length) * 15;

    return Math.max(0, Math.round(score));
  }

  // Generate recommendations
  private generateRecommendations(products: Product[], avgMargin: number, categoryDist: { [key: string]: number }): string[] {
    const recommendations: string[] = [];

    if (avgMargin < 15) {
      recommendations.push('Consider increasing profit margins - current average is below recommended 15%');
    }

    const uncategorized = categoryDist['Uncategorized'] || 0;
    if (uncategorized > products.length * 0.2) {
      recommendations.push('Many products lack proper categorization - consider manual review');
    }

    const missingDescriptions = products.filter(p => !p.description).length;
    if (missingDescriptions > products.length * 0.5) {
      recommendations.push('Add product descriptions to improve customer experience');
    }

    const highCostProducts = products.filter(p => p.costPrice > 50000).length;
    if (highCostProducts > 0) {
      recommendations.push('Review high-cost products for inventory optimization');
    }

    const topCategory = Object.entries(categoryDist).sort(([,a], [,b]) => b - a)[0];
    if (topCategory && topCategory[1] > products.length * 0.4) {
      recommendations.push(`Consider diversifying beyond ${topCategory[0]} category (${topCategory[1]} products)`);
    }

    return recommendations;
  }

  // Export to CSV (values only, no formulas)
  exportToCSV(products: Product[], bundles: BundleOffer[]): { productsCSV: string; bundlesCSV: string } {
    // Recalculate all values before export
    const calculatedProducts = this.recalculateFormulas(products);

    // Products CSV
    const productHeaders = [
      'Product Name', 'Category', 'SKU', 'Supplier', 'Description',
      'Cost Price', 'Market Price', 'Selling Price', 'Quantity',
      'Net Profit', 'Profit Margin %', 'Total Investment', 'Total Revenue',
      'Status', 'Last Updated'
    ];

    const productRows = calculatedProducts.map(product => {
      const sellingPrice = product.sellingPrice || this.calculatePrice(product.costPrice).sellingPrice;
      const netProfit = sellingPrice - product.costPrice - this.config.adCost - this.config.deliveryCost - 
                        (sellingPrice * this.config.taxRate / 100) - (sellingPrice * this.config.gatewayFee / 100);
      const profitMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
      const totalInvestment = product.costPrice * product.quantity;
      const totalRevenue = sellingPrice * product.quantity;

      return [
        product.name,
        product.category,
        product.sku || '',
        product.supplier || '',
        product.description || '',
        product.costPrice,
        product.marketPrice || '',
        sellingPrice,
        product.quantity,
        Math.round(netProfit),
        profitMargin.toFixed(2),
        totalInvestment,
        totalRevenue,
        product.isActive ? 'Active' : 'Inactive',
        product.lastUpdated?.toISOString().split('T')[0] || ''
      ];
    });

    const productsCSV = [productHeaders, ...productRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Bundles CSV
    const bundleHeaders = [
      'Bundle Name', 'Category', 'Products', 'Original Price', 'Bundle Price',
      'Discount %', 'Savings', 'Status'
    ];

    const bundleRows = bundles.map(bundle => [
      bundle.name,
      bundle.category,
      bundle.products.map(p => p.name).join('; '),
      bundle.originalPrice,
      bundle.bundlePrice,
      bundle.discount,
      bundle.originalPrice - bundle.bundlePrice,
      bundle.isActive ? 'Active' : 'Inactive'
    ]);

    const bundlesCSV = [bundleHeaders, ...bundleRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return { productsCSV, bundlesCSV };
  }

  // Export to XLSX (multi-sheet with formulas)
  exportToXLSX(products: Product[], bundles: BundleOffer[], analysis: AnalysisReport): ArrayBuffer {
    const workbook = XLSX.utils.book_new();

    // Products Sheet
    const productData = products.map(product => {
      const sellingPrice = product.sellingPrice || this.calculatePrice(product.costPrice).sellingPrice;
      const netProfit = sellingPrice - product.costPrice - this.config.adCost - this.config.deliveryCost - 
                        (sellingPrice * this.config.taxRate / 100) - (sellingPrice * this.config.gatewayFee / 100);
      const profitMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

      return {
        'Product Name': product.name,
        'Category': product.category,
        'SKU': product.sku || '',
        'Supplier': product.supplier || '',
        'Description': product.description || '',
        'Cost Price': product.costPrice,
        'Market Price': product.marketPrice || '',
        'Selling Price': sellingPrice,
        'Quantity': product.quantity,
        'Net Profit': Math.round(netProfit),
        'Profit Margin %': parseFloat(profitMargin.toFixed(2)),
        'Total Investment': product.costPrice * product.quantity,
        'Total Revenue': sellingPrice * product.quantity,
        'Status': product.isActive ? 'Active' : 'Inactive',
        'Last Updated': product.lastUpdated?.toISOString().split('T')[0] || ''
      };
    });

    const productsSheet = XLSX.utils.json_to_sheet(productData);
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');

    // Bundles Sheet
    const bundleData = bundles.map(bundle => ({
      'Bundle Name': bundle.name,
      'Category': bundle.category,
      'Products': bundle.products.map(p => p.name).join('; '),
      'Product Count': bundle.products.length,
      'Original Price': bundle.originalPrice,
      'Bundle Price': bundle.bundlePrice,
      'Discount %': bundle.discount,
      'Savings': bundle.originalPrice - bundle.bundlePrice,
      'Status': bundle.isActive ? 'Active' : 'Inactive'
    }));

    const bundlesSheet = XLSX.utils.json_to_sheet(bundleData);
    XLSX.utils.book_append_sheet(workbook, bundlesSheet, 'Bundle Offers');

    // Analysis Sheet
    const analysisData = [
      ['Metric', 'Value'],
      ['Total Products', products.length],
      ['Active Products', products.filter(p => p.isActive).length],
      ['Total Investment', analysis.profitAnalysis.totalInvestment],
      ['Projected Revenue', analysis.profitAnalysis.projectedRevenue],
      ['Projected Profit', analysis.profitAnalysis.projectedProfit],
      ['Average Margin %', analysis.profitAnalysis.avgMargin.toFixed(2)],
      ['Data Quality Score', analysis.qualityScore],
      [''],
      ['Category Distribution', ''],
      ...Object.entries(analysis.categoryDistribution).map(([cat, count]) => [cat, count]),
      [''],
      ['Price Ranges', ''],
      ['Low (< 1K)', analysis.priceRanges.low],
      ['Medium (1K-10K)', analysis.priceRanges.medium],
      ['High (10K-50K)', analysis.priceRanges.high],
      ['Premium (50K+)', analysis.priceRanges.premium],
      [''],
      ['Recommendations', ''],
      ...analysis.recommendations.map(rec => ['', rec])
    ];

    const analysisSheet = XLSX.utils.aoa_to_sheet(analysisData);
    XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Analysis');

    // Configuration Sheet
    const configData = [
      ['Setting', 'Value'],
      ['Profit Margin %', this.config.profitMargin],
      ['Ad Cost per Product', this.config.adCost],
      ['Delivery Cost', this.config.deliveryCost],
      ['Tax Rate %', this.config.taxRate],
      ['Gateway Fee %', this.config.gatewayFee],
      ['Currency', this.config.currency]
    ];

    const configSheet = XLSX.utils.aoa_to_sheet(configData);
    XLSX.utils.book_append_sheet(workbook, configSheet, 'Configuration');

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  }
}