import React from 'react';
import { HelpCircle, FileText, ArrowRight, Check } from 'lucide-react';

const PDFExtractorHelp: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <HelpCircle className="w-5 h-5 mr-2 text-blue-600" />
        Understanding PDF Extraction
      </h3>
      
      <div className="space-y-6">
        <p className="text-gray-700">
          PDF extraction works by analyzing the text content of your PDF files to identify cutting list items.
          Here's how the system processes your PDF:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <span className="font-bold text-blue-700">1</span>
              </div>
              <h4 className="font-medium text-blue-800">Text Extraction</h4>
            </div>
            <p className="text-blue-700 text-sm">
              The system extracts all text content from the PDF document, preserving line breaks and spacing as much as possible.
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <span className="font-bold text-blue-700">2</span>
              </div>
              <h4 className="font-medium text-blue-800">Pattern Matching</h4>
            </div>
            <p className="text-blue-700 text-sm">
              The system searches for patterns that look like dimensions, material types (MDF1, 18.0), and grain directions (Yes, No, Reserve Grain).
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <span className="font-bold text-blue-700">3</span>
              </div>
              <h4 className="font-medium text-blue-800">Data Conversion</h4>
            </div>
            <p className="text-blue-700 text-sm">
              Identified patterns are converted into structured cutting list items with dimensions, materials, and quantities.
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">Example Transformation</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded border border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-2">PDF Text Content:</h5>
              <pre className="whitespace-pre-wrap text-xs text-gray-600 bg-gray-50 p-2 rounded">
{`Side Panel
720 × 560 × 18
Material: MDF1, 18.0
Grain: Yes
Qty: 2`}
              </pre>
            </div>
            
            <div className="flex items-center justify-center">
              <ArrowRight className="w-8 h-8 text-blue-500" />
            </div>
            
            <div className="md:col-start-2 md:row-start-1 bg-white p-3 rounded border border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Extracted Data:</h5>
              <div className="bg-green-50 p-2 rounded">
                <div className="flex items-start">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 mr-1 flex-shrink-0" />
                  <div className="text-xs text-green-800">
                    <p><strong>Part Name:</strong> Side Panel</p>
                    <p><strong>Dimensions:</strong> 720mm × 560mm × 18mm</p>
                    <p><strong>Material:</strong> MDF1</p>
                    <p><strong>Thickness:</strong> 18.0mm</p>
                    <p><strong>Quantity:</strong> 2</p>
                    <p><strong>Grain Direction:</strong> Length (from "Yes")</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">Common Extraction Challenges</h4>
          <ul className="list-disc pl-5 text-yellow-700 space-y-1 text-sm">
            <li>
              <strong>Text as Images:</strong> Some PDFs contain text as images, which cannot be extracted as text.
            </li>
            <li>
              <strong>Complex Layouts:</strong> Multi-column layouts or tables with merged cells can be difficult to interpret.
            </li>
            <li>
              <strong>Inconsistent Formatting:</strong> Varying formats for dimensions or inconsistent naming can cause issues.
            </li>
            <li>
              <strong>Missing Information:</strong> If key information like dimensions is missing, items cannot be created.
            </li>
            <li>
              <strong>Non-standard Material Format:</strong> The system expects material format like "MDF1, 18.0".
            </li>
            <li>
              <strong>Non-standard Grain Format:</strong> The system expects grain values like "Yes", "No", or "Reserve Grain".
            </li>
          </ul>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Best Practices</h4>
          <ul className="list-disc pl-5 text-green-700 space-y-1 text-sm">
            <li>Use our Excel template to ensure your data is in the optimal format</li>
            <li>Export to PDF directly from Excel rather than scanning printed documents</li>
            <li>Use a simple, tabular format with clear headers</li>
            <li>Include all necessary information: part name, dimensions, material, quantity, grain</li>
            <li>Use consistent formatting for dimensions (e.g., always use "×" between values)</li>
            <li>Format material information as "MDF1, 18.0" where MDF1 is the material type and 18.0 is the thickness</li>
            <li>Format grain direction as "Yes" for length, "No" for none, and "Reserve Grain" for width</li>
            <li>If extraction fails, try the alternative extraction method or use the Excel template directly</li>
          </ul>
        </div>
        
        <div className="flex justify-center">
          <div className="inline-block bg-blue-100 px-4 py-3 rounded-lg text-blue-800 text-sm">
            <FileText className="w-4 h-4 inline-block mr-1" />
            For guaranteed accuracy, we recommend using our Excel template directly.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFExtractorHelp;