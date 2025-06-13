import React, { useState, useCallback } from 'react';
import { Upload, File, FileText, AlertCircle, Check, X, Info } from 'lucide-react';
import { CuttingListItem } from '../../types/cabinet';
import toast from 'react-hot-toast';

interface CuttingListImporterProps {
  onImport: (cuttingList: CuttingListItem[]) => void;
}

const CuttingListImporter: React.FC<CuttingListImporterProps> = ({ onImport }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<CuttingListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const text = await file.text();
      const items = parseFileContent(text, file.name);
      
      if (items.length === 0) {
        setError('No valid cutting list items found in the file');
        setParsedItems([]);
        return;
      }
      
      setParsedItems(items);
      setFile(file);
    } catch (err) {
      console.error('Error parsing file:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setParsedItems([]);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setFile(file);
      processFile(file);
    }
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFile(file);
      processFile(file);
    }
  }, [processFile]);

  const parseFileContent = (content: string, fileName: string): CuttingListItem[] => {
    // Detect file type based on extension or content
    const isCSV = fileName.toLowerCase().endsWith('.csv');
    const isXML = fileName.toLowerCase().endsWith('.xml') || content.trim().startsWith('<?xml');
    const isJSON = fileName.toLowerCase().endsWith('.json') || (content.trim().startsWith('{') && content.trim().endsWith('}'));
    
    if (isCSV) {
      return parseCSV(content);
    } else if (isXML) {
      return parseXML(content);
    } else if (isJSON) {
      return parseJSON(content);
    } else {
      // Try to detect format from content
      if (content.includes(',') && content.includes('\n')) {
        return parseCSV(content);
      } else if (content.includes('<') && content.includes('>')) {
        return parseXML(content);
      } else {
        throw new Error('Unsupported file format. Please use CSV, XML, or JSON files.');
      }
    }
  };

  const parseCSV = (content: string): CuttingListItem[] => {
    const lines = content.split('\n');
    if (lines.length < 2) {
      throw new Error('Invalid CSV file format');
    }

    // Try to detect header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('part') || 
                      firstLine.includes('name') || 
                      firstLine.includes('length') || 
                      firstLine.includes('width') || 
                      firstLine.includes('thickness');
    
    const startIndex = hasHeader ? 1 : 0;
    const items: CuttingListItem[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(val => val.trim());
      if (values.length < 4) continue; // Need at least name, length, width, thickness
      
      // Try to determine which columns contain what data
      let nameIndex = 0;
      let lengthIndex = 1;
      let widthIndex = 2;
      let thicknessIndex = 3;
      let quantityIndex = 4;
      let materialIndex = 5;
      let grainIndex = 6;
      
      // If we have a header, try to find the correct columns
      if (hasHeader && i === 1) {
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
        nameIndex = headers.findIndex(h => h.includes('part') || h.includes('name') || h.includes('description'));
        lengthIndex = headers.findIndex(h => h.includes('length') || h.includes('len'));
        widthIndex = headers.findIndex(h => h.includes('width') || h.includes('wid'));
        thicknessIndex = headers.findIndex(h => h.includes('thickness') || h.includes('thick'));
        quantityIndex = headers.findIndex(h => h.includes('quantity') || h.includes('qty') || h.includes('count'));
        materialIndex = headers.findIndex(h => h.includes('material') || h.includes('type'));
        grainIndex = headers.findIndex(h => h.includes('grain') || h.includes('direction'));
        
        // Use default indices if not found
        nameIndex = nameIndex >= 0 ? nameIndex : 0;
        lengthIndex = lengthIndex >= 0 ? lengthIndex : 1;
        widthIndex = widthIndex >= 0 ? widthIndex : 2;
        thicknessIndex = thicknessIndex >= 0 ? thicknessIndex : 3;
        quantityIndex = quantityIndex >= 0 ? quantityIndex : 4;
        materialIndex = materialIndex >= 0 ? materialIndex : 5;
        grainIndex = grainIndex >= 0 ? grainIndex : 6;
      }
      
      const item: CuttingListItem = {
        id: `imported-${i}-${Date.now()}`,
        partName: values[nameIndex] || `Part ${i}`,
        cabinetId: 'imported',
        cabinetName: 'Imported Cabinet',
        materialType: values[materialIndex] || 'Plywood',
        thickness: parseFloat(values[thicknessIndex]) || 18,
        length: parseFloat(values[lengthIndex]) || 0,
        width: parseFloat(values[widthIndex]) || 0,
        quantity: parseInt(values[quantityIndex]) || 1,
        edgeBanding: { front: false, back: false, left: false, right: false },
        grain: (values[grainIndex]?.toLowerCase()?.includes('length') ? 'length' : 
                values[grainIndex]?.toLowerCase()?.includes('width') ? 'width' : 'none') as 'length' | 'width' | 'none',
        priority: 1
      };
      
      // Only add if we have valid dimensions
      if (item.length > 0 && item.width > 0 && item.thickness > 0) {
        items.push(item);
      }
    }
    
    return items;
  };

  const parseXML = (content: string): CuttingListItem[] => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, "text/xml");
      
      // Check for parse errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid XML format');
      }
      
      const items: CuttingListItem[] = [];
      
      // Try different possible XML structures
      // First try: look for <Part> or <Item> elements
      let parts = xmlDoc.querySelectorAll('Part, Item, CuttingListItem, Panel');
      
      if (parts.length === 0) {
        // Second try: look for any elements with length and width attributes
        parts = xmlDoc.querySelectorAll('*[length][width], *[Length][Width]');
      }
      
      if (parts.length === 0) {
        throw new Error('Could not find cutting list items in the XML file');
      }
      
      parts.forEach((part, index) => {
        // Helper function to get attribute or child element text
        const getValue = (name: string): string => {
          // Try attribute first
          const attr = part.getAttribute(name) || part.getAttribute(name.toLowerCase()) || part.getAttribute(name.toUpperCase());
          if (attr) return attr;
          
          // Try child element
          const element = part.querySelector(name) || part.querySelector(name.toLowerCase()) || part.querySelector(name.toUpperCase());
          return element ? element.textContent || '' : '';
        };
        
        const item: CuttingListItem = {
          id: `imported-${index}-${Date.now()}`,
          partName: getValue('Name') || getValue('Description') || `Part ${index + 1}`,
          cabinetId: 'imported',
          cabinetName: 'Imported Cabinet',
          materialType: getValue('Material') || getValue('Type') || 'Plywood',
          thickness: parseFloat(getValue('Thickness')) || 18,
          length: parseFloat(getValue('Length')) || 0,
          width: parseFloat(getValue('Width')) || 0,
          quantity: parseInt(getValue('Quantity')) || parseInt(getValue('Count')) || 1,
          edgeBanding: { 
            front: getValue('EdgeFront')?.toLowerCase() === 'true', 
            back: getValue('EdgeBack')?.toLowerCase() === 'true', 
            left: getValue('EdgeLeft')?.toLowerCase() === 'true', 
            right: getValue('EdgeRight')?.toLowerCase() === 'true' 
          },
          grain: (getValue('Grain')?.toLowerCase()?.includes('length') ? 'length' : 
                 getValue('Grain')?.toLowerCase()?.includes('width') ? 'width' : 'none') as 'length' | 'width' | 'none',
          priority: parseInt(getValue('Priority')) || 1
        };
        
        // Only add if we have valid dimensions
        if (item.length > 0 && item.width > 0 && item.thickness > 0) {
          items.push(item);
        }
      });
      
      return items;
    } catch (error) {
      console.error('XML parsing error:', error);
      throw new Error('Failed to parse XML file');
    }
  };

  const parseJSON = (content: string): CuttingListItem[] => {
    try {
      const data = JSON.parse(content);
      let itemsArray: any[] = [];
      
      // Handle different possible JSON structures
      if (Array.isArray(data)) {
        itemsArray = data;
      } else if (data.parts && Array.isArray(data.parts)) {
        itemsArray = data.parts;
      } else if (data.items && Array.isArray(data.items)) {
        itemsArray = data.items;
      } else if (data.cuttingList && Array.isArray(data.cuttingList)) {
        itemsArray = data.cuttingList;
      } else {
        // Try to find any array in the JSON
        for (const key in data) {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            // Check if first item has properties that look like cutting list items
            const firstItem = data[key][0];
            if (firstItem.length || firstItem.width || firstItem.thickness || 
                firstItem.Length || firstItem.Width || firstItem.Thickness) {
              itemsArray = data[key];
              break;
            }
          }
        }
      }
      
      if (itemsArray.length === 0) {
        throw new Error('No cutting list items found in JSON');
      }
      
      return itemsArray.map((item, index) => {
        // Normalize property names (handle different casing)
        const normalizedItem: Record<string, any> = {};
        Object.keys(item).forEach(key => {
          normalizedItem[key.toLowerCase()] = item[key];
        });
        
        const edgeBanding = {
          front: false,
          back: false,
          left: false,
          right: false
        };
        
        // Try to parse edge banding information
        if (normalizedItem.edgebanding) {
          if (typeof normalizedItem.edgebanding === 'object') {
            edgeBanding.front = !!normalizedItem.edgebanding.front;
            edgeBanding.back = !!normalizedItem.edgebanding.back;
            edgeBanding.left = !!normalizedItem.edgebanding.left;
            edgeBanding.right = !!normalizedItem.edgebanding.right;
          } else if (typeof normalizedItem.edgebanding === 'string') {
            const edges = normalizedItem.edgebanding.toLowerCase();
            edgeBanding.front = edges.includes('front') || edges.includes('f');
            edgeBanding.back = edges.includes('back') || edges.includes('b');
            edgeBanding.left = edges.includes('left') || edges.includes('l');
            edgeBanding.right = edges.includes('right') || edges.includes('r');
          }
        }
        
        // Determine grain direction
        let grain: 'length' | 'width' | 'none' = 'none';
        if (normalizedItem.grain) {
          const grainValue = normalizedItem.grain.toString().toLowerCase();
          grain = grainValue.includes('length') ? 'length' : 
                 grainValue.includes('width') ? 'width' : 'none';
        }
        
        return {
          id: `imported-${index}-${Date.now()}`,
          partName: normalizedItem.name || normalizedItem.partname || normalizedItem.description || `Part ${index + 1}`,
          cabinetId: 'imported',
          cabinetName: 'Imported Cabinet',
          materialType: normalizedItem.material || normalizedItem.materialtype || normalizedItem.type || 'Plywood',
          thickness: parseFloat(normalizedItem.thickness) || 18,
          length: parseFloat(normalizedItem.length) || 0,
          width: parseFloat(normalizedItem.width) || 0,
          quantity: parseInt(normalizedItem.quantity) || parseInt(normalizedItem.count) || 1,
          edgeBanding,
          grain,
          priority: parseInt(normalizedItem.priority) || 1
        };
      }).filter(item => item.length > 0 && item.width > 0 && item.thickness > 0);
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error('Failed to parse JSON file');
    }
  };

  const handleImport = () => {
    if (parsedItems.length > 0) {
      onImport(parsedItems);
      toast.success(`Successfully imported ${parsedItems.length} cutting list items`);
      setFile(null);
      setParsedItems([]);
    } else {
      toast.error('No valid items to import');
    }
  };

  const handleCancel = () => {
    setFile(null);
    setParsedItems([]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Cutting List</h3>
        
        {!file ? (
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Drag & Drop your cutting list file here</h4>
            <p className="text-gray-600 mb-6">or click to browse your files</p>
            
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".csv,.xml,.json,.txt"
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Browse Files
            </label>
            
            <div className="mt-6 text-sm text-gray-500">
              <p>Supported file formats: CSV, XML, JSON</p>
              <p className="mt-2">The file should contain panel dimensions, material types, and quantities</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <File className="w-8 h-8 text-blue-600 mr-4" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              {isProcessing ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              ) : error ? (
                <AlertCircle className="w-6 h-6 text-red-600" />
              ) : (
                <Check className="w-6 h-6 text-green-600" />
              )}
            </div>
            
            {error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center text-red-800 mb-2">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <h4 className="font-medium">Error Processing File</h4>
                </div>
                <p className="text-red-700">{error}</p>
              </div>
            ) : parsedItems.length > 0 ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center text-green-800 mb-2">
                  <Check className="w-5 h-5 mr-2" />
                  <h4 className="font-medium">File Processed Successfully</h4>
                </div>
                <p className="text-green-700">Found {parsedItems.length} cutting list items ready to import</p>
              </div>
            ) : null}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={parsedItems.length === 0 || !!error}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4 mr-2" />
                Import {parsedItems.length} Items
              </button>
            </div>
          </div>
        )}
      </div>
      
      {parsedItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Preview ({parsedItems.length} items)</h3>
            <div className="text-sm text-blue-600 flex items-center">
              <Info className="w-4 h-4 mr-1" />
              Scroll to see all items
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Part Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thickness</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Length</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Width</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parsedItems.slice(0, 10).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{item.partName}</td>
                    <td className="px-3 py-2 text-gray-900">{item.materialType}</td>
                    <td className="px-3 py-2 text-gray-900">{item.thickness}mm</td>
                    <td className="px-3 py-2 text-gray-900">{item.length}mm</td>
                    <td className="px-3 py-2 text-gray-900">{item.width}mm</td>
                    <td className="px-3 py-2 text-gray-900">{item.quantity}</td>
                    <td className="px-3 py-2 text-gray-900 capitalize">{item.grain}</td>
                  </tr>
                ))}
                {parsedItems.length > 10 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-2 text-center text-gray-500">
                      ... and {parsedItems.length - 10} more items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CuttingListImporter;