import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, FileText, CheckCircle, AlertCircle, BarChart3, TrendingUp, Package, AlertTriangle, Info } from 'lucide-react';
import { Product, PricingConfig, BundleOffer } from '../types';
import { CSVProcessor, ProcessingResult, AnalysisReport, ValidationError } from '../utils/csvProcessor';

interface AdvancedImportExportProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  bundles: BundleOffer[];
  config: PricingConfig;
}

export const AdvancedImportExport: React.FC<AdvancedImportExportProps> = ({ 
  products, 
  setProducts, 
  bundles, 
  config 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processor = new CSVProcessor(config);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessingResult(null);
    setAnalysisReport(null);

    try {
      // Process CSV
      const result = await processor.parseCSV(file);
      setProcessingResult(result);

      if (result.success && result.data.length > 0) {
        // Recalculate formulas
        const calculatedProducts = processor.recalculateFormulas(result.data);
        
        // Generate analysis
        const analysis = processor.generateAnalysis(calculatedProducts);
        setAnalysisReport(analysis);

        // Add to existing products
        setProducts([...products, ...calculatedProducts]);
        setShowAnalysis(true);
      }
    } catch (error) {
      setProcessingResult({
        success: false,
        data: [],
        errors: [{ row: 0, field: 'file', value: file.name, message: 'Failed to process file', severity: 'error' }],
        warnings: [],
        stats: { totalRows: 0, validRows: 0, invalidRows: 0, duplicates: 0 }
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const exportToCSV = () => {
    const { productsCSV, bundlesCSV } = processor.exportToCSV(products, bundles);
    
    // Download products CSV
    const productsBlob = new Blob([productsCSV], { type: 'text/csv' });
    const productsUrl = URL.createObjectURL(productsBlob);
    const productsLink = document.createElement('a');
    productsLink.href = productsUrl;
    productsLink.download = `trustcart-products-${new Date().toISOString().split('T')[0]}.csv`;
    productsLink.click();
    URL.revokeObjectURL(productsUrl);

    // Download bundles CSV if bundles exist
    if (bundles.length > 0) {
      setTimeout(() => {
        const bundlesBlob = new Blob([bundlesCSV], { type: 'text/csv' });
        const bundlesUrl = URL.createObjectURL(bundlesBlob);
        const bundlesLink = document.createElement('a');
        bundlesLink.href = bundlesUrl;
        bundlesLink.download = `trustcart-bundles-${new Date().toISOString().split('T')[0]}.csv`;
        bundlesLink.click();
        URL.revokeObjectURL(bundlesUrl);
      }, 500);
    }
  };

  const exportToXLSX = () => {
    if (!analysisReport) {
      const analysis = processor.generateAnalysis(products);
      setAnalysisReport(analysis);
    }

    const xlsxBuffer = processor.exportToXLSX(products, bundles, analysisReport!);
    const blob = new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trustcart-complete-analysis-${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['Product Name', 'Category', 'Cost Price', 'Market Price', 'Selling Price', 'Quantity', 'Description', 'SKU', 'Supplier'],
      ['iPhone 15 Pro Max', 'Mobile Phones & Accessories', '120000', '180000', '165000', '5', 'Latest iPhone with advanced features', 'IPH15PM-256', 'Apple Inc'],
      ['Samsung Galaxy Buds Pro', 'Audio & Headphones', '8000', '15000', '13500', '10', 'Premium wireless earbuds', 'SGBP-BLK', 'Samsung'],
      ['Nike Air Max 270', 'Shoes & Footwear', '15000', '25000', '22000', '8', 'Comfortable running shoes', 'NAM270-42', 'Nike'],
      ['MacBook Pro 14"', 'Computers & Laptops', '250000', '350000', '320000', '2', 'Professional laptop for creators', 'MBP14-M3', 'Apple Inc'],
      ['Sony WH-1000XM5', 'Audio & Headphones', '35000', '50000', '45000', '6', 'Noise cancelling headphones', 'WH1000XM5', 'Sony']
    ];

    const csvContent = sampleData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'trustcart-sample-advanced.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const recalculateAllFormulas = () => {
    const recalculated = processor.recalculateFormulas(products);
    setProducts(recalculated);
    
    // Update analysis
    const analysis = processor.generateAnalysis(recalculated);
    setAnalysisReport(analysis);
  };

  const ErrorWarningDisplay: React.FC<{ errors: ValidationError[]; warnings: ValidationError[] }> = ({ errors, warnings }) => (
    <div className="space-y-4">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-red-800">Errors ({errors.length})</h4>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {errors.slice(0, 10).map((error, index) => (
              <div key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                <strong>Row {error.row}:</strong> {error.message}
                {error.field !== 'file' && error.field !== 'headers' && (
                  <span className="ml-2 text-red-600">({error.field}: "{error.value}")</span>
                )}
              </div>
            ))}
            {errors.length > 10 && (
              <div className="text-sm text-red-600 italic">... and {errors.length - 10} more errors</div>
            )}
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h4 className="font-medium text-yellow-800">Warnings ({warnings.length})</h4>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {warnings.slice(0, 10).map((warning, index) => (
              <div key={index} className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded">
                <strong>Row {warning.row}:</strong> {warning.message}
                {warning.field !== 'file' && warning.field !== 'headers' && (
                  <span className="ml-2 text-yellow-600">({warning.field}: "{warning.value}")</span>
                )}
              </div>
            ))}
            {warnings.length > 10 && (
              <div className="text-sm text-yellow-600 italic">... and {warnings.length - 10} more warnings</div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Advanced Import & Export</h3>
            <p className="text-gray-600 mt-1">Professional CSV processing with validation, analysis, and multi-format export</p>
          </div>
          <div className="flex items-center space-x-2">
            <Upload className="w-6 h-6 text-blue-600" />
            <Download className="w-6 h-6 text-green-600" />
          </div>
        </div>

        {/* Formula Recalculation */}
        {products.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Automatic Formula Recalculation</h4>
                  <p className="text-sm text-gray-600">Recalculate all prices and profits based on current configuration</p>
                </div>
              </div>
              <button
                onClick={recalculateAllFormulas}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Recalculate All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Import Products</h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Upload CSV file with advanced validation and analysis
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                className="hidden"
                disabled={isProcessing}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Choose CSV File'}
              </button>
            </div>

            <div className="mt-4 flex justify-center">
              <button
                onClick={downloadSampleCSV}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm"
              >
                <Download className="w-4 h-4" />
                Download Advanced Sample CSV
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-3">Advanced Features:</h5>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span><strong>Smart Validation:</strong> Comprehensive data validation with detailed error reporting</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span><strong>Auto-Detection:</strong> Automatic category detection using AI</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span><strong>Formula Calculation:</strong> Automatic price calculation for missing values</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span><strong>Business Analysis:</strong> Instant profitability and quality analysis</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span><strong>Duplicate Detection:</strong> Identifies and warns about duplicate products</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Processing Results */}
      {processingResult && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            {processingResult.success ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
            <h4 className="text-lg font-medium text-gray-900">Processing Results</h4>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{processingResult.stats.totalRows}</div>
              <div className="text-sm text-blue-800">Total Rows</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{processingResult.stats.validRows}</div>
              <div className="text-sm text-green-800">Valid Products</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{processingResult.stats.invalidRows}</div>
              <div className="text-sm text-red-800">Invalid Rows</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{processingResult.stats.duplicates}</div>
              <div className="text-sm text-yellow-800">Duplicates</div>
            </div>
          </div>

          {/* Errors and Warnings */}
          <ErrorWarningDisplay errors={processingResult.errors} warnings={processingResult.warnings} />
        </div>
      )}

      {/* Analysis Report */}
      {analysisReport && showAnalysis && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <h4 className="text-lg font-medium text-gray-900">Business Analysis Report</h4>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                analysisReport.qualityScore >= 80 ? 'bg-green-100 text-green-800' :
                analysisReport.qualityScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                Quality Score: {analysisReport.qualityScore}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Financial Overview */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
              <h5 className="font-medium text-green-900 mb-3">Financial Overview</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Total Investment:</span>
                  <span className="font-medium text-green-900">{config.currency} {analysisReport.profitAnalysis.totalInvestment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Projected Revenue:</span>
                  <span className="font-medium text-green-900">{config.currency} {analysisReport.profitAnalysis.projectedRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Projected Profit:</span>
                  <span className="font-medium text-green-900">{config.currency} {analysisReport.profitAnalysis.projectedProfit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Avg Margin:</span>
                  <span className="font-medium text-green-900">{analysisReport.profitAnalysis.avgMargin.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-3">Category Distribution</h5>
              <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
                {Object.entries(analysisReport.categoryDistribution)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([category, count]) => (
                    <div key={category} className="flex justify-between">
                      <span className="text-blue-700 truncate">{category}:</span>
                      <span className="font-medium text-blue-900">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Price Ranges */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
              <h5 className="font-medium text-purple-900 mb-3">Price Ranges</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">Low (&lt; 1K):</span>
                  <span className="font-medium text-purple-900">{analysisReport.priceRanges.low}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Medium (1K-10K):</span>
                  <span className="font-medium text-purple-900">{analysisReport.priceRanges.medium}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">High (10K-50K):</span>
                  <span className="font-medium text-purple-900">{analysisReport.priceRanges.high}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Premium (50K+):</span>
                  <span className="font-medium text-purple-900">{analysisReport.priceRanges.premium}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {analysisReport.recommendations.length > 0 && (
            <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Info className="w-5 h-5 text-orange-600" />
                <h5 className="font-medium text-orange-900">Recommendations</h5>
              </div>
              <ul className="space-y-2">
                {analysisReport.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-orange-800 flex items-start space-x-2">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Export Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-6">Export Data</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CSV Export */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <h5 className="font-medium text-gray-900">CSV Export</h5>
                  <p className="text-sm text-gray-600">Values only, no formulas</p>
                </div>
              </div>
              <button
                onClick={exportToCSV}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
              >
                Export CSV
              </button>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Products: Complete data with calculated values</div>
              <div>• Bundles: Separate file if bundles exist</div>
              <div>• Compatible with all spreadsheet applications</div>
              <div>• No broken formulas - values only</div>
            </div>
          </div>

          {/* XLSX Export */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
                <div>
                  <h5 className="font-medium text-gray-900">XLSX Export (Recommended)</h5>
                  <p className="text-sm text-gray-600">Multi-sheet with analysis</p>
                </div>
              </div>
              <button
                onClick={exportToXLSX}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200"
              >
                Export XLSX
              </button>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Products: Complete data with formulas</div>
              <div>• Bundle Offers: Separate sheet</div>
              <div>• Analysis: Business insights and metrics</div>
              <div>• Configuration: Current pricing settings</div>
            </div>
          </div>
        </div>

        {/* Export Info */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-2">Export Features:</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <ul className="space-y-1">
              <li>✅ Automatic formula recalculation before export</li>
              <li>✅ Real-time pricing based on current settings</li>
              <li>✅ Complete profit and margin calculations</li>
              <li>✅ Category-wise analysis and insights</li>
            </ul>
            <ul className="space-y-1">
              <li>✅ Bundle offers in separate sheet/file</li>
              <li>✅ Data quality scoring and recommendations</li>
              <li>✅ Configuration backup for reproducibility</li>
              <li>✅ Error-free exports with validation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};