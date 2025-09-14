import React, { useState, useRef, useEffect } from 'react';
import { Plus, Upload, Download, X, Package, DollarSign, Hash, Tag, RefreshCw, Trash2, Edit3, Save, Search, Filter } from 'lucide-react';
import { Product, PricingConfig, PriceCalculation } from '../types';
import { detectProductCategory, getCategorySuggestions } from '../utils/categoryDetection';

interface ProductManagerProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  config: PricingConfig;
  calculatePrice: (costPrice: number) => PriceCalculation;
}

export const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  setProducts,
  config,
  calculatePrice
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    costPrice: '',
    marketPrice: '',
    sellingPrice: '',
    quantity: '1',
    description: '',
    sku: '',
    supplier: ''
  });
  const [categoryStatus, setCategoryStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [importStatus, setImportStatus] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setProducts([]);
    setShowResetConfirm(false);
    localStorage.removeItem('trustcart-products');
  };

  // Auto-detect category when product name changes
  useEffect(() => {
    const detectCategory = async () => {
      const name = formData.name.trim();
      if (!name) {
        setFormData(prev => ({ ...prev, category: '' }));
        setCategoryStatus('idle');
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setCategoryStatus('loading');
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const category = detectProductCategory(name);
        if (!controller.signal.aborted) {
          setFormData(prev => ({ ...prev, category: category || '' }));
          setCategoryStatus('done');
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setCategoryStatus('idle');
        }
      }
    };

    const timer = setTimeout(detectCategory, 300);
    return () => clearTimeout(timer);
  }, [formData.name]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const costPrice = parseFloat(formData.costPrice) || 0;
    const marketPrice = parseFloat(formData.marketPrice) || 0;
    const sellingPrice = parseFloat(formData.sellingPrice) || 0;
    const quantity = parseInt(formData.quantity) || 1;

    const newProduct: Product = {
      id: Date.now().toString(),
      name: formData.name,
      category: formData.category,
      costPrice,
      marketPrice,
      sellingPrice,
      quantity,
      isActive: true,
      description: formData.description,
      sku: formData.sku,
      supplier: formData.supplier,
      lastUpdated: new Date()
    };

    setProducts([...products, newProduct]);
    setFormData({ 
      name: '', 
      category: '', 
      costPrice: '', 
      marketPrice: '',
      sellingPrice: '', 
      quantity: '1',
      description: '',
      sku: '',
      supplier: ''
    });
    setShowAddForm(false);
    setCategoryStatus('idle');
  };

  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setProducts(products.map(p => 
      p.id === id 
        ? { ...p, [field]: value, lastUpdated: new Date() }
        : p
    ));
  };

  const deleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const duplicateProduct = (product: Product) => {
    const newProduct = {
      ...product,
      id: Date.now().toString(),
      name: `${product.name} (Copy)`,
      lastUpdated: new Date()
    };
    setProducts([...products, newProduct]);
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['Product Name', 'Category', 'Cost Price', 'Market Price', 'Selling Price', 'Quantity', 'Description', 'SKU', 'Supplier'],
      ['iPhone 15 Pro Max', 'Mobile Phones & Accessories', '120000', '180000', '165000', '5', 'Latest iPhone with advanced features', 'IPH15PM-256', 'Apple Inc'],
      ['Samsung Galaxy Buds Pro', 'Audio & Headphones', '8000', '15000', '13500', '10', 'Premium wireless earbuds', 'SGBP-BLK', 'Samsung'],
      ['Nike Air Max 270', 'Shoes & Footwear', '15000', '25000', '22000', '8', 'Comfortable running shoes', 'NAM270-42', 'Nike'],
      ['MacBook Pro 14"', 'Computers & Laptops', '250000', '350000', '320000', '2', 'Professional laptop for creators', 'MBP14-M3', 'Apple Inc'],
      ['Sony WH-1000XM5', 'Audio & Headphones', '35000', '50000', '45000', '6', 'Noise cancelling headphones', 'WH1000XM5', 'Sony'],
      ['Adidas Ultraboost 22', 'Shoes & Footwear', '18000', '28000', '25000', '12', 'Premium running shoes', 'UB22-BLK-43', 'Adidas'],
      ['iPad Air 5th Gen', 'Tablets & E-readers', '80000', '120000', '110000', '4', 'Powerful tablet for work and play', 'IPAD-AIR5-256', 'Apple Inc'],
      ['Dell XPS 13', 'Computers & Laptops', '180000', '250000', '230000', '3', 'Ultra-portable business laptop', 'XPS13-I7-512', 'Dell'],
      ['Banana (1kg)', 'Food & Beverages', '200', '400', '350', '100', 'Fresh organic bananas', 'BAN-ORG-1KG', 'Local Farm'],
      ['Office Chair Ergonomic', 'Office Supplies', '25000', '40000', '36000', '15', 'Comfortable ergonomic office chair', 'OFC-ERG-BLK', 'Office Pro']
    ];

    const csvContent = sampleData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trustcart_sample_products.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('Processing CSV file...');

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setImportStatus('Error: CSV file must have at least a header and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
      
      // Find column indices
      const nameIndex = headers.findIndex(h => ['name', 'product', 'title', 'product name'].some(term => h.includes(term)));
      const categoryIndex = headers.findIndex(h => ['category', 'dept', 'department'].some(term => h.includes(term)));
      const costIndex = headers.findIndex(h => ['cost', 'cost price', 'buy price', 'purchase price'].some(term => h.includes(term)));
      const marketIndex = headers.findIndex(h => ['market', 'market price', 'mrp', 'retail price', 'list price'].some(term => h.includes(term)));
      const sellingIndex = headers.findIndex(h => ['selling', 'selling price', 'sell price'].some(term => h.includes(term)));
      const quantityIndex = headers.findIndex(h => ['quantity', 'qty', 'stock', 'amount'].some(term => h.includes(term)));
      const descriptionIndex = headers.findIndex(h => ['description', 'desc', 'details'].some(term => h.includes(term)));
      const skuIndex = headers.findIndex(h => ['sku', 'code', 'item code'].some(term => h.includes(term)));
      const supplierIndex = headers.findIndex(h => ['supplier', 'vendor', 'brand'].some(term => h.includes(term)));

      if (nameIndex === -1) {
        setImportStatus('Error: CSV must have a "Product Name" or "Name" column');
        return;
      }

      const newProducts: Product[] = [];
      let processed = 0;
      let skipped = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        const name = values[nameIndex];
        
        if (!name) {
          skipped++;
          continue;
        }

        let category = categoryIndex >= 0 ? values[categoryIndex] : '';
        
        // Auto-detect category if not provided
        if (!category) {
          try {
            category = detectProductCategory(name) || 'Uncategorized';
          } catch {
            category = 'Uncategorized';
          }
        }

        const costPrice = costIndex >= 0 ? parseFloat(values[costIndex]) || 0 : 0;
        const marketPrice = marketIndex >= 0 ? parseFloat(values[marketIndex]) || 0 : 0;
        const sellingPrice = sellingIndex >= 0 ? parseFloat(values[sellingIndex]) || 0 : 0;
        const quantity = quantityIndex >= 0 ? parseInt(values[quantityIndex]) || 1 : 1;
        const description = descriptionIndex >= 0 ? values[descriptionIndex] : '';
        const sku = skuIndex >= 0 ? values[skuIndex] : '';
        const supplier = supplierIndex >= 0 ? values[supplierIndex] : '';

        newProducts.push({
          id: `${Date.now()}-${i}`,
          name,
          category,
          costPrice,
          marketPrice,
          sellingPrice,
          quantity,
          isActive: true,
          description,
          sku,
          supplier,
          lastUpdated: new Date()
        });

        processed++;
      }

      setProducts([...products, ...newProducts]);
      setImportStatus(`✅ Successfully imported ${processed} products${skipped > 0 ? `, skipped ${skipped} invalid rows` : ''}`);
      
      setTimeout(() => {
        setShowImportModal(false);
        setImportStatus('');
      }, 2000);

    } catch (error) {
      setImportStatus('Error: Failed to process CSV file. Please check the format.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !filterCategory || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.category))].filter(Boolean);

  const getNetProfit = (product: Product) => {
    const sellingPrice = product.sellingPrice || calculatePrice(product.costPrice).sellingPrice;
    return sellingPrice - product.costPrice - config.adCost - config.deliveryCost - 
           (sellingPrice * config.taxRate / 100) - (sellingPrice * config.gatewayFee / 100);
  };

  const getProfitMargin = (product: Product) => {
    const sellingPrice = product.sellingPrice || calculatePrice(product.costPrice).sellingPrice;
    const netProfit = getNetProfit(product);
    return sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
            <p className="text-gray-600 mt-1">Manage your product inventory with advanced pricing calculations</p>
          </div>
          <div className="flex items-center space-x-3">
            {products.length > 0 && (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset All</span>
              </button>
            )}
            {products.length > 0 && (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset All</span>
              </button>
            )}
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products by name, category, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      {filteredProducts.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                            className="text-sm font-medium text-gray-900 bg-transparent border-b border-gray-200 hover:border-blue-300 focus:border-blue-500 outline-none w-full"
                          />
                          {product.sku && <div className="text-sm text-gray-500">SKU: {product.sku}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={product.category}
                        onChange={(e) => updateProduct(product.id, 'category', e.target.value)}
                        className="text-sm text-gray-900 bg-transparent border-b border-gray-200 hover:border-blue-300 focus:border-blue-500 outline-none w-full"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 mr-1">{config.currency}</span>
                        <input
                          type="number"
                          value={product.costPrice}
                          onChange={(e) => updateProduct(product.id, 'costPrice', parseFloat(e.target.value) || 0)}
                          className="text-sm font-medium text-gray-900 bg-transparent border-b border-gray-200 hover:border-orange-300 focus:border-orange-500 outline-none w-20"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 mr-1">{config.currency}</span>
                        <input
                          type="number"
                          value={product.marketPrice || ''}
                          onChange={(e) => updateProduct(product.id, 'marketPrice', parseFloat(e.target.value) || 0)}
                          className="text-sm text-gray-600 bg-transparent border-b border-gray-200 hover:border-purple-300 focus:border-purple-500 outline-none w-20"
                          min="0"
                          step="0.01"
                          placeholder="0"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 mr-1">{config.currency}</span>
                        <input
                          type="number"
                          value={product.sellingPrice || ''}
                          onChange={(e) => updateProduct(product.id, 'sellingPrice', parseFloat(e.target.value) || 0)}
                          className="text-sm font-medium text-green-600 bg-transparent border-b border-gray-200 hover:border-green-300 focus:border-green-500 outline-none w-20"
                          min="0"
                          step="0.01"
                          placeholder={calculatePrice(product.costPrice).sellingPrice.toString()}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={product.quantity}
                        onChange={(e) => updateProduct(product.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="text-sm text-gray-900 bg-transparent border-b border-gray-200 hover:border-blue-300 focus:border-blue-500 outline-none w-16"
                        min="1"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-green-600">
                        {config.currency} {Math.round(getNetProfit(product)).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        getProfitMargin(product) >= 25 ? 'text-green-600' :
                        getProfitMargin(product) >= 15 ? 'text-blue-600' :
                        getProfitMargin(product) >= 5 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {getProfitMargin(product).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingProduct(product.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => duplicateProduct(product)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded"
                          title="Duplicate"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {products.length === 0 ? 'No products yet' : 'No products match your search'}
          </h3>
          <p className="text-gray-500 mb-4">
            {products.length === 0 
              ? 'Add your first product or import from CSV to get started'
              : 'Try adjusting your search terms or filters'
            }
          </p>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Product</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter product name..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                    {categoryStatus === 'loading' && (
                      <span className="text-xs text-blue-600 ml-2">🤖 Detecting...</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Auto-detected or enter manually..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Price ({config.currency}) *
                  </label>
                  <input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => handleInputChange('costPrice', e.target.value)}
                    className="w-full p-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Market Price ({config.currency})
                  </label>
                  <input
                    type="number"
                    value={formData.marketPrice}
                    onChange={(e) => handleInputChange('marketPrice', e.target.value)}
                    className="w-full p-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selling Price ({config.currency})
                  </label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                    className="w-full p-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={formData.costPrice ? calculatePrice(parseFloat(formData.costPrice) || 0).sellingPrice.toString() : '0'}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Product code..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Supplier name..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Product description..."
                  rows={3}
                />
              </div>

              {(formData.costPrice || formData.sellingPrice) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Pricing Preview</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Calculated Price:</span>
                      <span className="ml-2 font-medium text-blue-600">
                        {config.currency} {calculatePrice(parseFloat(formData.costPrice) || 0).sellingPrice.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Net Profit:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {config.currency} {Math.round(calculatePrice(parseFloat(formData.costPrice) || 0).netProfit).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Import Products from CSV</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">CSV Format Requirements:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Required:</strong> Product Name, Cost Price</li>
                  <li>• <strong>Optional:</strong> Category, Market Price, Selling Price, Quantity, Description, SKU, Supplier</li>
                  <li>• If Category is empty, AI will auto-detect it</li>
                  <li>• If Selling Price is empty, it will be calculated automatically</li>
                  <li>• Market Price helps with competitive analysis</li>
                </ul>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Choose a CSV file to import</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Select CSV File
                </button>
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={downloadSampleCSV}
                  className="flex items-center gap-2 text-green-600 hover:text-green-700"
                >
                  <Download className="w-4 h-4" />
                  Download Sample CSV
                </button>
              </div>

              {importStatus && (
                <div className={`p-3 rounded-lg ${
                  importStatus.startsWith('Error') 
                    ? 'bg-red-50 text-red-700' 
                    : importStatus.startsWith('✅')
                    ? 'bg-green-50 text-green-700'
                    : 'bg-blue-50 text-blue-700'
                }`}>
                  {importStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Reset All Products</h2>
                <p className="text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">
                Are you sure you want to delete all {products.length} products? This will permanently remove all product data and cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};