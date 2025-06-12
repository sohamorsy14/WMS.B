import React, { useState } from 'react';
import { NestingResult } from '../../types/cabinet';
import { Package, Maximize, BarChart3, RefreshCw, Download } from 'lucide-react';

interface NestingViewerProps {
  nestingResults: NestingResult[];
  onOptimize: () => void;
  onExportNesting: (result: NestingResult) => void;
  isOptimizing: boolean;
}

const NestingViewer: React.FC<NestingViewerProps> = ({ 
  nestingResults, 
  onOptimize, 
  onExportNesting,
  isOptimizing 
}) => {
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const toggleExpand = (resultId: string) => {
    if (expandedResult === resultId) {
      setExpandedResult(null);
    } else {
      setExpandedResult(resultId);
    }
  };

  const totalSheets = nestingResults.reduce((sum, result) => sum + result.sheetCount, 0);
  const averageEfficiency = nestingResults.length > 0 
    ? nestingResults.reduce((sum, result) => sum + result.efficiency, 0) / nestingResults.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Nesting Optimization</h2>
        <button
          onClick={onOptimize}
          disabled={isOptimizing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOptimizing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4 mr-2" />
              Optimize Layout
            </>
          )}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sheets</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalSheets}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Efficiency</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{averageEfficiency.toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <Maximize className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Material Types</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{nestingResults.length}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Nesting Results */}
      <div className="space-y-6">
        {nestingResults.map((result) => (
          <div key={result.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {result.materialType} - {result.thickness}mm
                  </h3>
                  <p className="text-sm text-gray-600">
                    Sheet Size: {result.sheetSize.length} × {result.sheetSize.width}mm
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {result.sheetCount} sheets
                  </div>
                  <div className="text-sm text-gray-600">
                    {result.efficiency.toFixed(1)}% efficiency
                  </div>
                </div>
              </div>

              {/* Visual Nesting Layout */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="relative border-2 border-gray-300 bg-white" style={{ 
                  width: '100%', 
                  height: '300px',
                  aspectRatio: `${result.sheetSize.length} / ${result.sheetSize.width}`
                }}>
                  {/* Sheet outline */}
                  <div className="absolute inset-0 border border-gray-400">
                    {/* Parts layout */}
                    {result.parts.map((part, index) => {
                      const scaleX = 100 / result.sheetSize.length;
                      const scaleY = 100 / result.sheetSize.width;
                      
                      return (
                        <div
                          key={part.id}
                          className="absolute border border-blue-500 bg-blue-100 bg-opacity-50 flex items-center justify-center text-xs font-medium text-blue-800"
                          style={{
                            left: `${part.x * scaleX}%`,
                            top: `${part.y * scaleY}%`,
                            width: `${part.length * scaleX}%`,
                            height: `${part.width * scaleY}%`,
                            transform: `rotate(${part.rotation}deg)`
                          }}
                          title={`Part ${index + 1}: ${part.length} × ${part.width}mm`}
                        >
                          {index + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="mt-2 text-sm text-gray-600 text-center">
                  Sheet Layout - {result.parts.length} parts
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => toggleExpand(result.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                >
                  {expandedResult === result.id ? 'Hide Details' : 'Show Details'}
                </button>
                
                <button
                  onClick={() => onExportNesting(result)}
                  className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </button>
              </div>

              {/* Expanded Details */}
              {expandedResult === result.id && (
                <>
                  {/* Parts List */}
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Part ID</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dimensions</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rotation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {result.parts.map((part, index) => (
                          <tr key={part.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-900">{index + 1}</td>
                            <td className="px-3 py-2 text-gray-900 font-mono text-xs">{part.partId.slice(-8)}</td>
                            <td className="px-3 py-2 text-gray-900">{part.length} × {part.width}mm</td>
                            <td className="px-3 py-2 text-gray-900">{part.x}, {part.y}</td>
                            <td className="px-3 py-2 text-gray-900">{part.rotation}°</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Efficiency Stats */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="font-medium text-green-800">Used Area</div>
                      <div className="text-green-600">
                        {((result.totalArea - result.wasteArea) / 1000000).toFixed(2)} m²
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <div className="font-medium text-red-800">Waste Area</div>
                      <div className="text-red-600">
                        {(result.wasteArea / 1000000).toFixed(2)} m²
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="font-medium text-blue-800">Total Area</div>
                      <div className="text-blue-600">
                        {(result.totalArea / 1000000).toFixed(2)} m²
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {nestingResults.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No nesting results</h3>
          <p className="text-gray-600 mb-6">Configure a cabinet and click "Optimize Layout" to see nesting optimization.</p>
          <button
            onClick={onOptimize}
            disabled={isOptimizing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOptimizing ? 'Optimizing...' : 'Optimize Layout'}
          </button>
        </div>
      )}
    </div>
  );
};

export default NestingViewer;