import React, { useState } from 'react';
import { Info, AlertCircle, Check, FileText } from 'lucide-react';
import { CuttingListItem } from '../../types/cabinet';

interface PDFAnalyzerProps {
  pdfText: string;
  parsedItems: CuttingListItem[];
  onAnalyze: () => void;
}

const PDFAnalyzer: React.FC<PDFAnalyzerProps> = ({ pdfText, parsedItems, onAnalyze }) => {
  const [showFullText, setShowFullText] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Analyze the PDF text to find patterns
  const analyzeText = () => {
    setShowAnalysis(true);
    onAnalyze();
  };

  // Find patterns in the text that might be dimensions
  const dimensionPatterns = pdfText.match(/\d+\s*[x×*]\s*\d+\s*[x×*]\s*\d+/g) || [];
  const numberPatterns = pdfText.match(/\b\d+(?:\.\d+)?\s*(?:mm|cm|m)?\b/g) || [];
  const materialPatterns = pdfText.match(/\b(?:plywood|mdf|melamine|particleboard|solid\s*wood|veneer|oak|maple|birch|pine|cherry|walnut)\b/gi) || [];
  const grainPatterns = pdfText.match(/\bgrain\s*(?:direction)?\s*(?:length|width|long|cross)\b/gi) || [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">PDF Content Analysis</h3>
          <button
            onClick={() => setShowFullText(!showFullText)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showFullText ? 'Show Less' : 'Show Full Text'}
          </button>
        </div>

        {showFullText ? (
          <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto font-mono text-xs whitespace-pre-wrap">
            {pdfText}
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto font-mono text-xs">
            {pdfText.substring(0, 500)}...
            <div className="text-center mt-2 text-gray-500">
              (Click "Show Full Text" to see all content)
            </div>
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={analyzeText}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Analyze PDF Content
          </button>
        </div>
      </div>

      {showAnalysis && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-2 text-blue-600" />
                Dimension Patterns Found
              </h4>
              {dimensionPatterns.length > 0 ? (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">Found {dimensionPatterns.length} potential dimensions:</p>
                  <div className="max-h-32 overflow-y-auto">
                    {dimensionPatterns.slice(0, 10).map((pattern, index) => (
                      <div key={index} className="text-xs bg-blue-100 rounded px-2 py-1 mb-1 inline-block mr-1">
                        {pattern}
                      </div>
                    ))}
                    {dimensionPatterns.length > 10 && (
                      <div className="text-xs text-blue-600 mt-1">
                        ...and {dimensionPatterns.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    No dimension patterns found (e.g., 800×600×18)
                  </p>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-2 text-blue-600" />
                Material Types Found
              </h4>
              {materialPatterns.length > 0 ? (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800 mb-2">Found {materialPatterns.length} material references:</p>
                  <div className="max-h-32 overflow-y-auto">
                    {Array.from(new Set(materialPatterns)).slice(0, 10).map((pattern, index) => (
                      <div key={index} className="text-xs bg-green-100 rounded px-2 py-1 mb-1 inline-block mr-1">
                        {pattern}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    No material types found (e.g., Plywood, MDF)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center">
              <Info className="w-4 h-4 mr-2 text-blue-600" />
              Extraction Results
            </h4>
            
            {parsedItems.length > 0 ? (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center text-green-800 mb-3">
                  <Check className="w-5 h-5 mr-2" />
                  <h5 className="font-medium">Successfully extracted {parsedItems.length} items</h5>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-green-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-green-800 uppercase">Part Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-green-800 uppercase">Dimensions</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-green-800 uppercase">Material</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-green-800 uppercase">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-200">
                      {parsedItems.slice(0, 5).map((item) => (
                        <tr key={item.id} className="bg-white">
                          <td className="px-3 py-2 font-medium text-gray-900">{item.partName}</td>
                          <td className="px-3 py-2 text-gray-700">{item.length} × {item.width} × {item.thickness}mm</td>
                          <td className="px-3 py-2 text-gray-700">{item.materialType}</td>
                          <td className="px-3 py-2 text-gray-700">{item.quantity}</td>
                        </tr>
                      ))}
                      {parsedItems.length > 5 && (
                        <tr className="bg-white">
                          <td colSpan={4} className="px-3 py-2 text-center text-gray-500">
                            ...and {parsedItems.length - 5} more items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center text-red-800 mb-3">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <h5 className="font-medium">No items could be extracted</h5>
                </div>
                <p className="text-red-700 mb-3">
                  The system couldn't identify cutting list items in this PDF. This could be due to:
                </p>
                <ul className="list-disc pl-5 text-red-700 space-y-1">
                  <li>The PDF doesn't contain a cutting list</li>
                  <li>The format is not recognized (try using our Excel template)</li>
                  <li>The text is embedded as images rather than actual text</li>
                  <li>The dimensions are in an unusual format</li>
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
            <ul className="list-disc pl-5 text-blue-700 space-y-1">
              <li>Use the Excel template for best results</li>
              <li>Ensure your PDF has text (not just images)</li>
              <li>Make sure dimensions are clearly formatted (e.g., 800×600×18 or 800mm × 600mm × 18mm)</li>
              <li>Include material types and grain directions in your cutting list</li>
              <li>If extraction fails, you can manually enter the data using our Excel template</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFAnalyzer;