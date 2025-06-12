import React from 'react';
import { Info } from 'lucide-react';

const PanelFormulaHelp: React.FC = () => {
  return (
    <div className="p-4 bg-blue-50 rounded-lg">
      <h4 className="flex items-center font-medium text-blue-800 mb-2">
        <Info className="w-4 h-4 mr-2" />
        Panel Formula Guide
      </h4>
      
      <p className="text-sm text-blue-700 mb-3">
        You can use these variables and operators in your panel formulas to create parametric panels that adjust automatically when cabinet dimensions change.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 className="text-sm font-medium text-blue-800 mb-2">Cabinet Dimensions</h5>
          <ul className="text-xs text-blue-700 space-y-1 list-disc pl-5">
            <li><code className="font-mono bg-blue-100 px-1 rounded">width</code> - Cabinet width</li>
            <li><code className="font-mono bg-blue-100 px-1 rounded">height</code> - Cabinet height</li>
            <li><code className="font-mono bg-blue-100 px-1 rounded">depth</code> - Cabinet depth</li>
          </ul>
        </div>
        
        <div>
          <h5 className="text-sm font-medium text-blue-800 mb-2">Material Thicknesses</h5>
          <ul className="text-xs text-blue-700 space-y-1 list-disc pl-5">
            <li><code className="font-mono bg-blue-100 px-1 rounded">side</code> - Side panel thickness</li>
            <li><code className="font-mono bg-blue-100 px-1 rounded">topBottom</code> - Top/bottom panel thickness</li>
            <li><code className="font-mono bg-blue-100 px-1 rounded">back</code> - Back panel thickness</li>
            <li><code className="font-mono bg-blue-100 px-1 rounded">shelf</code> - Shelf thickness</li>
            <li><code className="font-mono bg-blue-100 px-1 rounded">door</code> - Door thickness</li>
          </ul>
        </div>
        
        <div>
          <h5 className="text-sm font-medium text-blue-800 mb-2">Construction Flags</h5>
          <ul className="text-xs text-blue-700 space-y-1 list-disc pl-5">
            <li><code className="font-mono bg-blue-100 px-1 rounded">hasTop</code> - Has top panel</li>
            <li><code className="font-mono bg-blue-100 px-1 rounded">hasBottom</code> - Has bottom panel</li>
            <li><code className="font-mono bg-blue-100 px-1 rounded">hasBack</code> - Has back panel</li>
            <li><code className="font-mono bg-blue-100 px-1 rounded">isCorner</code> - Is corner cabinet</li>
          </ul>
        </div>
        
        <div>
          <h5 className="text-sm font-medium text-blue-800 mb-2">Example Formulas</h5>
          <ul className="text-xs text-blue-700 space-y-1 list-disc pl-5">
            <li><code className="font-mono bg-blue-100 px-1 rounded">width - (2 * side)</code> - Width between sides</li>
            <li><code className="font-mono bg-blue-100 px-1 rounded">depth - (hasBack ? back : 0)</code> - Depth with back panel</li>
            <li><code className="font-mono bg-blue-100 px-1 rounded">height - topBottom - 3</code> - Height minus top thickness and gap</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-blue-600">
        <p>You can use arithmetic operators (+, -, *, /), parentheses, and ternary conditions (condition ? trueValue : falseValue).</p>
      </div>
    </div>
  );
};

export default PanelFormulaHelp;