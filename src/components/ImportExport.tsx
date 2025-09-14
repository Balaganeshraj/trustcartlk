import React, { useRef, useState } from 'react';
import { Upload, Download, FileSpreadsheet, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Product, PricingConfig } from '../types';

interface ImportExportProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  config: PricingConfig;
}

export const ImportExport: React.FC<ImportExportProps> = ({ products, setProducts, config }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const exportToCSV = () => {
    const headers = ['Name', 'Category', 'Cost Price', 'Selling Price', 'Quantity', 'Net Profit', 'Profit Margin %', 'Total Investment', 'Total Revenue', 'Active', 'Description', 'SKU', 'Supplier'];
    const rows = products.map(product => [
      product.name,
      product.category,
      product.costPrice,
      product.sellingPrice || 0,
      product.quantity,
      calculateNetProfit(product),
      calculateProfitMargin(product),
      product.costPrice * product.quantity,
      (product.sellingPrice || 0) * product.quantity,
      product.isActive ? 'Yes' : 'No',
      product.description || '',
      product.sku || '',
      product.supplier || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustcart-products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const calculateNetProfit = (product: Product) => {
    if (!product.sellingPrice || product.sellingPrice === 0) return 0;
    const netProfit = product.sellingPrice - product.costPrice - config.adCost - config.deliveryCost - 
                      (product.sellingPrice * config.taxRate / 100) - (product.sellingPrice * config.gatewayFee / 100);
    return Math.round(netProfit);
  };

  const calculateProfitMargin = (product: Product) => {
    if (!product.sellingPrice || product.sellingPrice === 0) return 0;
    const netProfit = calculateNetProfit(product);
    return ((netProfit / product.sellingPrice) * 100).toFixed(1);
  };

  const exportToExcel = () => {
    const calculatePrice = (costPrice: number) => {
      const basePrice = costPrice + (costPrice * config.profitMargin / 100) + config.adCost + config.deliveryCost;
      const priceWithTax = basePrice + (basePrice * config.taxRate / 100);
      const sellingPrice = Math.round(priceWithTax / (1 - config.gatewayFee / 100));
      const netProfit = sellingPrice - costPrice - config.adCost - config.deliveryCost - 
                        (sellingPrice * config.taxRate / 100) - (sellingPrice * config.gatewayFee / 100);
      const profitMargin = (netProfit / sellingPrice) * 100;
      return { sellingPrice, netProfit, profitMargin };
    };

    const headers = [
      'Product Name', 'Category', 'Cost Price', 'Market Price', 'Quantity', 'Selling Price', 
      'Net Profit', 'Profit Margin %', 'Status', 'Total Investment', 'Total Revenue'
    ];
    
    const rows = products.map(product => {
      const pricing = calculatePrice(product.costPrice);
      const totalInvestment = product.costPrice * product.quantity;
      const totalRevenue = pricing.sellingPrice * product.quantity;
      
      return [
        product.name,
        product.category,
        `${config.currency} ${product.costPrice.toLocaleString()}`,
        `${config.currency} ${(product.marketPrice || 0).toLocaleString()}`,
        product.quantity,
        `${config.currency} ${pricing.sellingPrice.toLocaleString()}`,
        `${config.currency} ${Math.round(pricing.netProfit).toLocaleString()}`,
        `${pricing.profitMargin.toFixed(1)}%`,
        product.isActive ? 'Active' : 'Inactive',
        `${config.currency} ${totalInvestment.toLocaleString()}`,
        `${config.currency} ${totalRevenue.toLocaleString()}`
      ];
    });

    // Create HTML table for Excel export
    const htmlContent = `
      <table>
        <tr>${headers.map(h => `<th style="font-weight:bold;background-color:#f0f0f0;">${h}</th>`).join('')}</tr>
        ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
      </table>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustcart-analysis-${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
        
        const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('product'));
        const categoryIndex = headers.findIndex(h => h.includes('category'));
        const costIndex = headers.findIndex(h => h.includes('cost') || h.includes('price'));
        const quantityIndex = headers.findIndex(h => h.includes('quantity') || h.includes('qty'));

        if (nameIndex === -1 || categoryIndex === -1 || costIndex === -1) {
          setImportStatus({ type: 'error', message: 'Required columns not found. Please ensure your CSV has Name, Category, and Cost Price columns.' });
          return;
        }

        const importedProducts: Product[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(v => v.replace(/"/g, '').trim());
          
          if (values.length >= 3) {
            const product: Product = {
              id: Date.now().toString() + i,
              name: values[nameIndex] || `Product ${i}`,
              category: values[categoryIndex] || 'Uncategorized',
              costPrice: parseFloat(values[costIndex]) || 0,
              quantity: quantityIndex >= 0 ? parseInt(values[quantityIndex]) || 1 : 1,
              isActive: true
            };
            
            if (product.costPrice > 0) {
              importedProducts.push(product);
            }
          }
        }

        if (importedProducts.length > 0) {
          setProducts([...products, ...importedProducts]);
          setImportStatus({ type: 'success', message: `Successfully imported ${importedProducts.length} products!` });
        } else {
          setImportStatus({ type: 'error', message: 'No valid products found in the file.' });
        }
      } catch (error) {
        setImportStatus({ type: 'error', message: 'Error reading file. Please check the format and try again.' });
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['Product Name', 'Category', 'Cost Price', 'Quantity'],
      ['Sample Smartphone', 'Electronics', '25000', '1'],
      ['Sample Dress', 'Fashion', '8000', '2'],
      ['Sample Furniture', 'Home & Garden', '15000', '1']
    ];

    const csvContent = sampleData
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-products.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Import & Export</h3>
          <p className="text-gray-600 mt-1">Manage your product data with bulk import and export features</p>
        </div>
        <div className="flex items-center space-x-2">
          <Upload className="w-6 h-6 text-gray-400" />
          <Download className="w-6 h-6 text-gray-400" />
        </div>
      </div>

      {/* Import Status */}
      {importStatus && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
          importStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {importStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className={`text-sm font-medium ${
            importStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {importStatus.message}
          </span>
          <button
            onClick={() => setImportStatus(null)}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Import Section */}
        <div className="space-y-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Import Products</h4>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV file to import products in bulk
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".csv,.xlsx,.xls"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
            >
              Choose File
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Supports CSV, Excel (.xlsx, .xls) files
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">Required Columns:</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Product Name (required)</li>
              <li>• Category (required)</li>
              <li>• Cost Price (required)</li>
              <li>• Quantity (optional, defaults to 1)</li>
            </ul>
            <button
              onClick={downloadSampleCSV}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium underline"
            >
              Download Sample CSV
            </button>
          </div>
        </div>

        {/* Export Section */}
        <div className="space-y-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Export Data</h4>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  <div>
                    <h5 className="font-medium text-gray-900">Excel Export</h5>
                    <p className="text-sm text-gray-600">Complete analysis with pricing calculations</p>
                  </div>
                </div>
                <button
                  onClick={exportToExcel}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200"
                >
                  Export .xls
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Includes selling prices, profit calculations, and business metrics
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <h5 className="font-medium text-gray-900">CSV Export</h5>
                    <p className="text-sm text-gray-600">Product data for backup and migration</p>
                  </div>
                </div>
                <button
                  onClick={exportToCSV}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                >
                  Export .csv
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Raw product data compatible with spreadsheet applications
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h5 className="font-medium text-yellow-900 mb-2">Export Features:</h5>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• All product information and calculations</li>
              <li>• Real-time pricing based on current settings</li>
              <li>• Category-wise profit analysis</li>
              <li>• Total investment and revenue metrics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};