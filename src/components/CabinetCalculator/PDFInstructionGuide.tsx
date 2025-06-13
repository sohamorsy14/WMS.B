import React from 'react';
import { FileText, Info, Check, AlertCircle } from 'lucide-react';

const PDFInstructionGuide: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-blue-600" />
        PDF Import Guide
      </h3>
      
      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-gray-800 mb-2">How PDF Import Works</h4>
          <p className="text-gray-600">
            Our PDF importer extracts text from your PDF files and analyzes it to identify cutting list items.
            It looks for specific patterns like dimensions, part names, and material types.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h5 className="font-medium text-green-800 mb-2 flex items-center">
              <Check className="w-4 h-4 mr-2" />
              Recommended PDF Format
            </h5>
            <ul className="list-disc pl-5 text-green-700 space-y-1">
              <li>Clear tabular format with headers</li>
              <li>Dimensions in format: 800×600×18</li>
              <li>Part names clearly labeled</li>
              <li>Material column with entries like "MDF1, 18.0"</li>
              <li>Grain column with entries like "Yes", "No", "Reserve Grain"</li>
              <li>Quantity for each part</li>
            </ul>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <h5 className="font-medium text-red-800 mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Problematic PDF Formats
            </h5>
            <ul className="list-disc pl-5 text-red-700 space-y-1">
              <li>Scanned images (no extractable text)</li>
              <li>Complex layouts with multiple tables</li>
              <li>Unusual dimension formats</li>
              <li>Missing or ambiguous part names</li>
              <li>Missing material or grain information</li>
              <li>Password-protected PDFs</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-medium text-blue-800 mb-2 flex items-center">
            <Info className="w-4 h-4 mr-2" />
            Example of Good PDF Content
          </h5>
          <div className="bg-white p-3 rounded border border-blue-200 font-mono text-sm">
            <pre className="whitespace-pre-wrap text-blue-900">
{`Cutting List for Base Cabinet
---------------------------
Part Name | Length × Width × Thickness | Material | Grain | Qty
Side Panel | 720 × 560 × 18 | MDF1, 18.0 | Yes | 2
Bottom Panel | 568 × 560 × 18 | MDF1, 18.0 | No | 1
Top Panel | 568 × 560 × 18 | MDF1, 18.0 | Reserve Grain | 1
Back Panel | 720 × 568 × 12 | MDF1, 18.0 | No | 1
Shelf | 568 × 540 × 18 | MDF1, 18.0 | Yes | 2
Door | 720 × 300 × 18 | MDF1, 18.0 | Yes | 2`}
            </pre>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Understanding Material and Grain Format</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Material Format</h5>
              <p className="text-sm text-gray-600 mb-2">
                When you find a column labeled "Material" with entries like "MDF1, 18.0", this means:
              </p>
              <ul className="list-disc pl-5 text-gray-600 text-sm">
                <li><strong>Material type:</strong> MDF1</li>
                <li><strong>Thickness:</strong> 18.0mm</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Grain Direction Format</h5>
              <p className="text-sm text-gray-600 mb-2">
                When you find a column labeled "Grain" with entries like "Yes", "No", or "Reserve Grain", this means:
              </p>
              <ul className="list-disc pl-5 text-gray-600 text-sm">
                <li><strong>Yes:</strong> Grain Direction Length</li>
                <li><strong>No:</strong> No grain direction</li>
                <li><strong>Reserve Grain:</strong> Grain Direction Width</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Tips for Successful Import</h4>
          <ul className="list-disc pl-5 text-gray-600 space-y-1">
            <li>Use our Excel template and export to PDF for best results</li>
            <li>Ensure your PDF contains actual text, not just images</li>
            <li>Keep the format simple and consistent</li>
            <li>Include headers that clearly identify each column</li>
            <li>If automatic extraction fails, try the alternative extraction method</li>
            <li>As a last resort, manually copy data from the PDF into our Excel template</li>
          </ul>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h5 className="font-medium text-yellow-800 mb-2 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Important Note
          </h5>
          <p className="text-yellow-700">
            PDF extraction is inherently challenging due to the variety of PDF formats and structures.
            For the most reliable results, we recommend using our Excel template or CSV format for importing cutting lists.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PDFInstructionGuide;