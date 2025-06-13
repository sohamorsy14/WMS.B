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
            It looks for specific column headers like Num, Reference, Height, Width, Quantity, and edge banding information.
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
              <li>Column labeled "Num" for panel number</li>
              <li>Column labeled "Reference" for part name</li>
              <li>Column labeled "Height" for panel length</li>
              <li>Column labeled "Width" for panel width</li>
              <li>Column labeled "Quantity" for panel quantity</li>
              <li>Columns for edge banding: "Left Edge", "Right Edge", "Top Edge", "Bottom Edge"</li>
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
              <li>Missing required column headers</li>
              <li>Unusual dimension formats</li>
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
Num | Reference      | Height | Width | Quantity | Left Edge | Right Edge | Top Edge | Bottom Edge
1   | Side Panel     | 720    | 560   | 2        | X         | X          |          |
2   | Bottom Panel   | 568    | 560   | 1        | X         | X          | X        |
3   | Top Panel      | 568    | 560   | 1        | X         | X          | X        |
4   | Back Panel     | 720    | 568   | 1        |           |            |          |
5   | Shelf          | 568    | 540   | 2        | X         | X          | X        |
6   | Door           | 720    | 300   | 2        | X         | X          | X        | X`}
            </pre>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Understanding Edge Banding Format</h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              For edge banding columns, any non-empty value is considered TRUE, and an empty value is considered FALSE:
            </p>
            <ul className="list-disc pl-5 text-gray-600 text-sm">
              <li><strong>Left Edge:</strong> Edge banding on the left side of the panel</li>
              <li><strong>Right Edge:</strong> Edge banding on the right side of the panel</li>
              <li><strong>Top Edge:</strong> Edge banding on the front side of the panel</li>
              <li><strong>Bottom Edge:</strong> Edge banding on the back side of the panel</li>
            </ul>
            <p className="text-sm text-gray-600 mt-2">
              For example, if "Left Edge" column has an "X" or any other value, it means there is edge banding on the left side.
              If the cell is empty, it means there is no edge banding on that side.
            </p>
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