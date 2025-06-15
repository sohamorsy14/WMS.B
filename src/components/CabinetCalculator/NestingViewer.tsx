import React, { useState, useEffect } from 'react';
import { NestingResult } from '../../types/cabinet';
import { Package, Maximize, BarChart3, RefreshCw, Download, Settings, Info } from 'lucide-react';

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
  const [selectedSheetSize, setSelectedSheetSize] = useState<string>('2440x1220');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedTechnology, setSelectedTechnology] = useState<string>('rectpack2d');
  const [showTechInfo, setShowTechInfo] = useState<boolean>(false);

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

  const sheetSizes = [
    { value: '2440x1220', label: '2440 × 1220mm (4×8ft)' },
    { value: '3050x1525', label: '3050 × 1525mm (5×10ft)' },
    { value: '2100x2800', label: '2100 × 2800mm' },
    { value: '1520x1520', label: '1520 × 1520mm' },
    { value: '2100x2100', label: '2100 × 2100mm' },
    { value: '1800x3600', label: '1800 × 3600mm' }
  ];

  const materialTypes = [
    { value: 'all', label: 'All Materials' },
    { value: 'Plywood', label: 'Plywood' },
    { value: 'MDF', label: 'MDF' },
    { value: 'Melamine', label: 'Melamine' },
    { value: 'Particleboard', label: 'Particleboard' },
    { value: 'Material 1', label: 'Material 1' },
    { value: 'Material 2', label: 'Material 2' },
    { value: 'Material 3', label: 'Material 3' }
  ];

  const technologies = [
    { value: 'rectpack2d', label: 'RectPack2D', description: 'Specialized rectangle packing algorithm library' },
    { value: 'binpacking', label: 'BinPacking.js', description: '2D bin packing optimization library' },
    { value: 'd3js', label: 'D3.js', description: 'Data visualization library with powerful layout algorithms' },
    { value: 'fabricjs', label: 'Fabric.js', description: 'Interactive object model on canvas with pattern support' },
    { value: 'cutlist', label: 'CutList Optimizer', description: 'Specialized woodworking cut optimization' },
    { value: 'svgrenderer', label: 'SVG-based Custom Renderer', description: 'Direct SVG rendering with precise control over grain patterns' },
    { value: 'canvasrenderer', label: 'Canvas-based Visualization', description: 'HTML5 Canvas for more complex rendering with grain textures' },
    { value: 'cssgrid', label: 'CSS Grid with Pattern Overlays', description: 'For simpler visualization with CSS patterns' },
    { value: 'webglrenderer', label: 'WebGL-based Renderer', description: 'For high-performance visualization with texture patterns' },
    { value: 'reactkonva', label: 'React-Konva', description: 'Canvas rendering for React with pattern support' }
  ];

  const totalSheets = nestingResults.reduce((sum, result) => sum + result.sheetCount, 0);
  const averageEfficiency = nestingResults.length > 0 
    ? nestingResults.reduce((sum, result) => sum + result.efficiency, 0) / nestingResults.length
    : 0;

  const handleOptimizeWithSettings = () => {
    // In a real implementation, this would pass the selected sheet size, material, and technology to the optimization function
    onOptimize();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Nesting Optimization</h2>
        <div className="flex space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Sheet Size:</label>
            <select
              value={selectedSheetSize}
              onChange={(e) => setSelectedSheetSize(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {sheetSizes.map(size => (
                <option key={size.value} value={size.value}>{size.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Material:</label>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {materialTypes.map(material => (
                <option key={material.value} value={material.value}>{material.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Technology:</label>
            <div className="relative">
              <select
                value={selectedTechnology}
                onChange={(e) => setSelectedTechnology(e.target.value)}
                className="px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {technologies.map(tech => (
                  <option key={tech.value} value={tech.value}>{tech.label}</option>
                ))}
              </select>
              <button 
                onClick={() => setShowTechInfo(!showTechInfo)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                title="Technology Information"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            onClick={handleOptimizeWithSettings}
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
                <Settings className="w-4 h-4 mr-2" />
                Optimize Layout
              </>
            )}
          </button>
        </div>
      </div>

      {/* Technology Info Panel */}
      {showTechInfo && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-900">Technology Information</h3>
            <button 
              onClick={() => setShowTechInfo(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {technologies.map(tech => (
              <div 
                key={tech.value} 
                className={`p-3 rounded-lg border ${selectedTechnology === tech.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                <h4 className="font-medium text-gray-900">{tech.label}</h4>
                <p className="text-sm text-gray-600 mt-1">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
                {/* Container with proper aspect ratio */}
                <div 
                  className="relative border-2 border-gray-300 bg-white w-full" 
                  style={{ 
                    paddingTop: `${(result.sheetSize.width / result.sheetSize.length) * 100}%`,
                    maxWidth: '800px',
                    margin: '0 auto'
                  }}
                >
                  {/* Sheet outline */}
                  <div className="absolute inset-0 border border-gray-400">
                    {/* Parts layout */}
                    {result.parts.map((part, index) => {
                      // Calculate position percentages based on sheet dimensions
                      const xPercent = (part.x / result.sheetSize.length) * 100;
                      const yPercent = (part.y / result.sheetSize.width) * 100;
                      const widthPercent = (part.length / result.sheetSize.length) * 100;
                      const heightPercent = (part.width / result.sheetSize.width) * 100;
                      
                      // Determine color based on grain direction
                      let bgColor = 'bg-gray-100';
                      let borderColor = 'border-gray-500';
                      let textColor = 'text-gray-800';
                      
                      if (part.grain === 'length') {
                        bgColor = 'bg-blue-100';
                        borderColor = 'border-blue-500';
                        textColor = 'text-blue-800';
                      } else if (part.grain === 'width') {
                        bgColor = 'bg-purple-100';
                        borderColor = 'border-purple-500';
                        textColor = 'text-purple-800';
                      }
                      
                      // If grain direction is violated, show warning color
                      if (part.grainViolated) {
                        bgColor = 'bg-yellow-100';
                        borderColor = 'border-yellow-500';
                        textColor = 'text-yellow-800';
                      }
                      
                      // For rotated parts
                      if (part.rotation) {
                        // Calculate center point for rotation
                        const centerX = xPercent + widthPercent/2;
                        const centerY = yPercent + heightPercent/2;
                        
                        return (
                          <div
                            key={part.id}
                            className={`absolute border ${borderColor} ${bgColor} bg-opacity-50 flex items-center justify-center text-xs font-medium ${textColor}`}
                            style={{
                              left: `${xPercent}%`,
                              top: `${yPercent}%`,
                              width: `${widthPercent}%`,
                              height: `${heightPercent}%`,
                              transform: `rotate(${part.rotation}deg)`,
                              transformOrigin: `${centerX}% ${centerY}%`,
                              zIndex: index + 1
                            }}
                            title={`Part ${index + 1}: ${part.length} × ${part.width}mm${part.grain ? `, Grain: ${part.grain}` : ''}`}
                          >
                            {index + 1}
                          </div>
                        );
                      }
                      
                      return (
                        <div
                          key={part.id}
                          className={`absolute border ${borderColor} ${bgColor} bg-opacity-50 flex items-center justify-center text-xs font-medium ${textColor}`}
                          style={{
                            left: `${xPercent}%`,
                            top: `${yPercent}%`,
                            width: `${widthPercent}%`,
                            height: `${heightPercent}%`,
                            zIndex: index + 1
                          }}
                          title={`Part ${index + 1}: ${part.length} × ${part.width}mm${part.grain ? `, Grain: ${part.grain}` : ''}`}
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
                
                {/* Grain direction legend */}
                <div className="mt-2 flex justify-center space-x-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-100 border border-blue-500 mr-1"></div>
                    <span>Grain with Length</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-100 border border-purple-500 mr-1"></div>
                    <span>Grain with Width</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-100 border border-gray-500 mr-1"></div>
                    <span>No Grain</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-100 border border-yellow-500 mr-1"></div>
                    <span>Grain Violated</span>
                  </div>
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
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grain</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
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
                            <td className="px-3 py-2 text-gray-900">
                              {part.grain === 'length' ? 'Grain with Length' : 
                               part.grain === 'width' ? 'Grain with Width' : 
                               'No Grain'}
                            </td>
                            <td className="px-3 py-2">
                              {part.grainViolated ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Grain Violated
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Optimal
                                </span>
                              )}
                            </td>
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
            onClick={handleOptimizeWithSettings}
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