import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, Search, BarChart3, TrendingUp, DollarSign, Package, Eye, Trash2, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Report, InventoryValuation, Department, CostCenter } from '../types';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Common/Modal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  category?: string;
  department?: string;
  costCenter?: string;
  supplier?: string;
  location?: string;
}

const ReportManagement: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [inventoryValuation, setInventoryValuation] = useState<InventoryValuation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0]
  });

  const reportTypes = [
    {
      id: 'inventory_valuation',
      name: 'Inventory Valuation Report',
      description: 'Detailed inventory valuation with last and average purchase prices',
      icon: Package,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'stock_movement',
      name: 'Stock Movement Report',
      description: 'Track inventory movements and transactions',
      icon: TrendingUp,
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 'purchase_analysis',
      name: 'Purchase Analysis Report',
      description: 'Analyze purchasing patterns and supplier performance',
      icon: BarChart3,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'cost_center_budget',
      name: 'Cost Center Budget Report',
      description: 'Budget vs actual spending by cost center',
      icon: DollarSign,
      color: 'bg-orange-100 text-orange-800'
    },
    {
      id: 'department_spending',
      name: 'Department Spending Report',
      description: 'Spending analysis by department',
      icon: BarChart3,
      color: 'bg-red-100 text-red-800'
    },
    {
      id: 'supplier_performance',
      name: 'Supplier Performance Report',
      description: 'Evaluate supplier delivery and quality metrics',
      icon: TrendingUp,
      color: 'bg-indigo-100 text-indigo-800'
    }
  ];

  useEffect(() => {
    fetchReports();
    fetchInventoryValuation();
    fetchDepartments();
    fetchCostCenters();
  }, []);

  const fetchReports = async () => {
    try {
      // Mock reports data
      const mockReports: Report[] = [
        {
          id: '1',
          name: 'Monthly Inventory Valuation - December 2024',
          type: 'inventory_valuation',
          description: 'Complete inventory valuation report with purchase price analysis',
          parameters: { dateFrom: '2024-12-01', dateTo: '2024-12-31', includeZeroStock: false },
          generatedBy: user?.username || 'admin',
          generatedAt: new Date().toISOString(),
          status: 'completed',
          fileUrl: '/reports/inventory-valuation-dec-2024.pdf',
          fileSize: 2048576
        },
        {
          id: '2',
          name: 'Q4 Purchase Analysis Report',
          type: 'purchase_analysis',
          description: 'Quarterly purchase analysis with supplier performance metrics',
          parameters: { dateFrom: '2024-10-01', dateTo: '2024-12-31' },
          generatedBy: user?.username || 'manager',
          generatedAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed',
          fileUrl: '/reports/purchase-analysis-q4-2024.pdf',
          fileSize: 1536000
        },
        {
          id: '3',
          name: 'Cost Center Budget Report - December',
          type: 'cost_center_budget',
          description: 'Monthly budget vs actual spending by cost center',
          parameters: { dateFrom: '2024-12-01', dateTo: '2024-12-31' },
          generatedBy: user?.username || 'admin',
          generatedAt: new Date(Date.now() - 3600000).toISOString(),
          status: 'generating',
          fileSize: 0
        }
      ];
      setReports(mockReports);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryValuation = async () => {
    try {
      // Mock inventory valuation data with purchase history
      const mockValuation: InventoryValuation[] = [
        {
          id: '1',
          itemId: 'PLY-18-4X8',
          itemName: 'Plywood 18mm 4x8ft',
          category: 'Panels',
          currentQuantity: 45,
          unitMeasurement: 'Sheets (sht)',
          lastPurchasePrice: 54.25,
          averagePurchasePrice: 52.75,
          totalPurchases: 3,
          valuationAtLastPrice: 2441.25,
          valuationAtAveragePrice: 2373.75,
          lastPurchaseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          supplier: 'Wood Supply Co.',
          location: 'A-1-01'
        },
        {
          id: '2',
          itemId: 'HNG-CONC-35',
          itemName: 'Concealed Hinges 35mm',
          category: 'Hardware',
          currentQuantity: 485,
          unitMeasurement: 'Pieces (pcs)',
          lastPurchasePrice: 3.45,
          averagePurchasePrice: 3.25,
          totalPurchases: 5,
          valuationAtLastPrice: 1673.25,
          valuationAtAveragePrice: 1576.25,
          lastPurchaseDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          supplier: 'Hardware Plus',
          location: 'B-1-01'
        },
        {
          id: '3',
          itemId: 'SLD-18-FULL',
          itemName: 'Full Extension Slides 18"',
          category: 'Hardware',
          currentQuantity: 124,
          unitMeasurement: 'Pairs (pr)',
          lastPurchasePrice: 13.25,
          averagePurchasePrice: 12.50,
          totalPurchases: 4,
          valuationAtLastPrice: 1643.00,
          valuationAtAveragePrice: 1550.00,
          lastPurchaseDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          supplier: 'Slide Systems Inc.',
          location: 'B-2-01'
        },
        {
          id: '4',
          itemId: 'MEL-WHT-4X8',
          itemName: 'White Melamine 4x8ft',
          category: 'Panels',
          currentQuantity: 22,
          unitMeasurement: 'Sheets (sht)',
          lastPurchasePrice: 70.00,
          averagePurchasePrice: 68.50,
          totalPurchases: 2,
          valuationAtLastPrice: 1540.00,
          valuationAtAveragePrice: 1507.00,
          lastPurchaseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          supplier: 'Laminate Plus',
          location: 'A-2-01'
        },
        {
          id: '5',
          itemId: 'ADH-PVA-5L',
          itemName: 'PVA Wood Glue 5L',
          category: 'Adhesives',
          currentQuantity: 24,
          unitMeasurement: 'Bottles (btl)',
          lastPurchasePrice: 29.50,
          averagePurchasePrice: 28.50,
          totalPurchases: 6,
          valuationAtLastPrice: 708.00,
          valuationAtAveragePrice: 684.00,
          lastPurchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          supplier: 'Chemical Solutions',
          location: 'E-1-01'
        }
      ];
      setInventoryValuation(mockValuation);
    } catch (error) {
      console.error('Failed to fetch inventory valuation:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      // Mock departments data
      const mockDepartments: Department[] = [
        { id: '1', name: 'Production', code: 'PROD', description: '', manager: '', costCenter: '', isActive: true, createdAt: '' },
        { id: '2', name: 'Assembly', code: 'ASSY', description: '', manager: '', costCenter: '', isActive: true, createdAt: '' },
        { id: '3', name: 'Quality Control', code: 'QC', description: '', manager: '', costCenter: '', isActive: true, createdAt: '' }
      ];
      setDepartments(mockDepartments);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchCostCenters = async () => {
    try {
      // Mock cost centers data
      const mockCostCenters: CostCenter[] = [
        { id: '1', code: 'CC-001', name: 'Production Operations', description: '', budget: 50000, actualSpent: 42500, budgetPeriod: 'monthly', manager: '', isActive: true, createdAt: '', updatedAt: '' },
        { id: '2', code: 'CC-002', name: 'Assembly Operations', description: '', budget: 35000, actualSpent: 38200, budgetPeriod: 'monthly', manager: '', isActive: true, createdAt: '', updatedAt: '' }
      ];
      setCostCenters(mockCostCenters);
    } catch (error) {
      console.error('Failed to fetch cost centers:', error);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const generateCSVContent = (report: Report): string => {
    const reportType = reportTypes.find(type => type.id === report.type);
    let csvContent = '';

    // Add header
    csvContent += `${reportType?.name || report.type}\n`;
    csvContent += `Generated: ${new Date(report.generatedAt).toLocaleString()}\n`;
    csvContent += `Generated by: ${report.generatedBy}\n`;
    csvContent += `Parameters: ${JSON.stringify(report.parameters)}\n\n`;

    if (report.type === 'inventory_valuation') {
      // Inventory Valuation CSV
      csvContent += 'Item ID,Item Name,Category,Current Qty,Unit,Last Price,Avg Price,Valuation (Last),Valuation (Avg),Purchases,Last Purchase Date,Supplier,Location\n';
      inventoryValuation.forEach(item => {
        csvContent += `"${item.itemId}","${item.itemName}","${item.category}",${item.currentQuantity},"${item.unitMeasurement}",${item.lastPurchasePrice},${item.averagePurchasePrice},${item.valuationAtLastPrice},${item.valuationAtAveragePrice},${item.totalPurchases},"${new Date(item.lastPurchaseDate).toLocaleDateString()}","${item.supplier}","${item.location}"\n`;
      });
      
      // Add summary
      const totalLastPrice = inventoryValuation.reduce((sum, item) => sum + item.valuationAtLastPrice, 0);
      const totalAvgPrice = inventoryValuation.reduce((sum, item) => sum + item.valuationAtAveragePrice, 0);
      csvContent += `\nSummary\n`;
      csvContent += `Total Items,${inventoryValuation.length}\n`;
      csvContent += `Total Valuation (Last Price),${totalLastPrice.toFixed(2)}\n`;
      csvContent += `Total Valuation (Average Price),${totalAvgPrice.toFixed(2)}\n`;
    } else {
      // Generic report format
      csvContent += 'Report Type,Description,Status\n';
      csvContent += `"${report.type}","${report.description}","${report.status}"\n`;
    }

    return csvContent;
  };

  const generatePDFContent = (report: Report): string => {
    // For demo purposes, we'll create a simple HTML content that could be converted to PDF
    const reportType = reportTypes.find(type => type.id === report.type);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${reportType?.name || report.type}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; color: #333; }
        .meta { color: #666; margin-top: 10px; }
        .content { margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .summary { background-color: #f9f9f9; padding: 15px; margin-top: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${reportType?.name || report.type}</div>
        <div class="meta">
            <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>
            <p><strong>Generated by:</strong> ${report.generatedBy}</p>
            <p><strong>Description:</strong> ${report.description}</p>
        </div>
    </div>
    
    <div class="content">
        ${report.type === 'inventory_valuation' ? `
            <table>
                <thead>
                    <tr>
                        <th>Item ID</th>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Qty</th>
                        <th>Last Price</th>
                        <th>Avg Price</th>
                        <th>Valuation (Last)</th>
                        <th>Valuation (Avg)</th>
                    </tr>
                </thead>
                <tbody>
                    ${inventoryValuation.map(item => `
                        <tr>
                            <td>${item.itemId}</td>
                            <td>${item.itemName}</td>
                            <td>${item.category}</td>
                            <td>${item.currentQuantity} ${item.unitMeasurement}</td>
                            <td>$${item.lastPurchasePrice.toFixed(2)}</td>
                            <td>$${item.averagePurchasePrice.toFixed(2)}</td>
                            <td>$${item.valuationAtLastPrice.toFixed(2)}</td>
                            <td>$${item.valuationAtAveragePrice.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="summary">
                <h3>Summary</h3>
                <p><strong>Total Items:</strong> ${inventoryValuation.length}</p>
                <p><strong>Total Valuation (Last Price):</strong> $${inventoryValuation.reduce((sum, item) => sum + item.valuationAtLastPrice, 0).toFixed(2)}</p>
                <p><strong>Total Valuation (Average Price):</strong> $${inventoryValuation.reduce((sum, item) => sum + item.valuationAtAveragePrice, 0).toFixed(2)}</p>
            </div>
        ` : `
            <p>This is a ${report.type} report.</p>
            <p>Report data would be displayed here based on the specific report type.</p>
        `}
    </div>
</body>
</html>`;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReportType) {
      toast.error('Please select a report type');
      return;
    }

    const reportType = reportTypes.find(type => type.id === selectedReportType);
    if (!reportType) return;

    setGenerating(selectedReportType);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newReport: Report = {
        id: Date.now().toString(),
        name: `${reportType.name} - ${new Date().toLocaleDateString()}`,
        type: selectedReportType as any,
        description: reportType.description,
        parameters: reportFilters,
        generatedBy: user?.username || 'admin',
        generatedAt: new Date().toISOString(),
        status: 'completed',
        fileUrl: `/reports/${selectedReportType}-${Date.now()}.pdf`,
        fileSize: Math.floor(Math.random() * 3000000) + 500000
      };

      setReports([newReport, ...reports]);
      setIsGenerateModalOpen(false);
      setSelectedReportType('');
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  const handleDownloadReport = (report: Report, format: 'pdf' | 'csv' = 'pdf') => {
    if (report.status !== 'completed') {
      toast.error('Report is not ready for download');
      return;
    }
    
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const reportType = reportTypes.find(type => type.id === report.type);
      const baseFilename = `${reportType?.name || report.type}_${timestamp}`;
      
      if (format === 'csv') {
        const csvContent = generateCSVContent(report);
        downloadFile(csvContent, `${baseFilename}.csv`, 'text/csv');
        toast.success(`CSV report downloaded: ${baseFilename}.csv`);
      } else {
        const htmlContent = generatePDFContent(report);
        downloadFile(htmlContent, `${baseFilename}.html`, 'text/html');
        toast.success(`Report downloaded: ${baseFilename}.html`);
        toast.info('Note: In production, this would be a PDF file. For now, it\'s an HTML file you can print to PDF.');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download report');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      setReports(reports.filter(r => r.id !== reportId));
      toast.success('Report deleted successfully');
    } catch (error) {
      console.error('Failed to delete report:', error);
      toast.error('Failed to delete report');
    }
  };

  const openViewModal = (report: Report) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'generating': return <Clock className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!hasPermission('inventory.view')) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Management</h1>
          <p className="text-gray-600 mt-1">Generate and manage business reports and analytics</p>
        </div>
        <button
          onClick={() => setIsGenerateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <FileText className="w-4 h-4" />
          <span>Generate Report</span>
        </button>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((reportType) => {
          const Icon = reportType.icon;
          return (
            <div key={reportType.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-full ${reportType.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <button
                  onClick={() => {
                    setSelectedReportType(reportType.id);
                    setIsGenerateModalOpen(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Generate
                </button>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{reportType.name}</h3>
              <p className="text-sm text-gray-600">{reportType.description}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {reportTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Size
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => {
                const reportType = reportTypes.find(type => type.id === report.type);
                return (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{report.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{report.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${reportType?.color || 'bg-gray-100 text-gray-800'}`}>
                        {reportType?.name || report.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.generatedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.generatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        <span className="ml-1 capitalize">{report.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.fileSize ? formatFileSize(report.fileSize) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openViewModal(report)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {report.status === 'completed' && (
                          <>
                            <button
                              onClick={() => handleDownloadReport(report, 'pdf')}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              title="Download as HTML/PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadReport(report, 'csv')}
                              className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                              title="Download as CSV"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-600">Generate your first report to get started.</p>
          </div>
        )}
      </div>

      {/* Generate Report Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => {
          setIsGenerateModalOpen(false);
          setSelectedReportType('');
        }}
        title="Generate Report"
        size="lg"
      >
        <form onSubmit={handleGenerateReport} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type *
            </label>
            <select
              required
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Report Type</option>
              {reportTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date From
              </label>
              <input
                type="date"
                value={reportFilters.dateFrom}
                onChange={(e) => setReportFilters({ ...reportFilters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date To
              </label>
              <input
                type="date"
                value={reportFilters.dateTo}
                onChange={(e) => setReportFilters({ ...reportFilters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {(selectedReportType === 'department_spending' || selectedReportType === 'cost_center_budget') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedReportType === 'department_spending' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department (Optional)
                  </label>
                  <select
                    value={reportFilters.department || ''}
                    onChange={(e) => setReportFilters({ ...reportFilters, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {selectedReportType === 'cost_center_budget' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost Center (Optional)
                  </label>
                  <select
                    value={reportFilters.costCenter || ''}
                    onChange={(e) => setReportFilters({ ...reportFilters, costCenter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Cost Centers</option>
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.code}>
                        {cc.code} - {cc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {selectedReportType === 'inventory_valuation' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category (Optional)
              </label>
              <select
                value={reportFilters.category || ''}
                onChange={(e) => setReportFilters({ ...reportFilters, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="Panels">Panels</option>
                <option value="Hardware">Hardware</option>
                <option value="Edge Banding">Edge Banding</option>
                <option value="Fasteners">Fasteners</option>
                <option value="Adhesives">Adhesives</option>
                <option value="Finishes">Finishes</option>
                <option value="Accessories">Accessories</option>
                <option value="Lighting">Lighting</option>
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsGenerateModalOpen(false);
                setSelectedReportType('');
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={generating !== null}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              disabled={generating !== null}
            >
              {generating === selectedReportType ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Report Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedReport(null);
        }}
        title="Report Details"
        size="xl"
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Report Name</label>
                  <p className="text-gray-900">{selectedReport.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="text-gray-900">{reportTypes.find(t => t.id === selectedReport.type)?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Generated By</label>
                  <p className="text-gray-900">{selectedReport.generatedBy}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedReport.status)}`}>
                    {getStatusIcon(selectedReport.status)}
                    <span className="ml-1 capitalize">{selectedReport.status}</span>
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Generated At</label>
                  <p className="text-gray-900">{new Date(selectedReport.generatedAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">File Size</label>
                  <p className="text-gray-900">{selectedReport.fileSize ? formatFileSize(selectedReport.fileSize) : 'N/A'}</p>
                </div>
                {selectedReport.fileUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">File URL</label>
                    <p className="text-gray-900 text-sm break-all">{selectedReport.fileUrl}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-900">{selectedReport.description}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parameters</label>
              <div className="bg-gray-50 rounded-lg p-3">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(selectedReport.parameters, null, 2)}
                </pre>
              </div>
            </div>

            {/* Sample Inventory Valuation Data */}
            {selectedReport.type === 'inventory_valuation' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Sample Inventory Valuation Data</label>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Price</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valuation (Last)</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valuation (Avg)</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Purchases</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {inventoryValuation.slice(0, 5).map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <div>
                              <div className="font-medium text-gray-900">{item.itemId}</div>
                              <div className="text-gray-500 text-xs">{item.itemName}</div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-gray-900">
                            {item.currentQuantity} {item.unitMeasurement}
                          </td>
                          <td className="px-3 py-2 text-gray-900">
                            {formatCurrency(item.lastPurchasePrice)}
                          </td>
                          <td className="px-3 py-2 text-gray-900">
                            {formatCurrency(item.averagePurchasePrice)}
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {formatCurrency(item.valuationAtLastPrice)}
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {formatCurrency(item.valuationAtAveragePrice)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {item.totalPurchases}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Valuation Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Total Valuation (Last Price):</span>
                      <span className="font-semibold text-blue-900 ml-2">
                        {formatCurrency(inventoryValuation.reduce((sum, item) => sum + item.valuationAtLastPrice, 0))}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Total Valuation (Average Price):</span>
                      <span className="font-semibold text-blue-900 ml-2">
                        {formatCurrency(inventoryValuation.reduce((sum, item) => sum + item.valuationAtAveragePrice, 0))}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-blue-600">
                    * This report shows both last purchase price and average purchase price for accurate inventory valuation
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              {selectedReport.status === 'completed' && (
                <>
                  <button
                    onClick={() => handleDownloadReport(selectedReport, 'csv')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Download CSV</span>
                  </button>
                  <button
                    onClick={() => handleDownloadReport(selectedReport, 'pdf')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download HTML</span>
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedReport(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReportManagement;