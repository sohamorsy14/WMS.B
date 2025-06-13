import React, { useState, useCallback, useRef } from 'react';
import { Upload, File, FileText, AlertCircle, Check, X, Info, FileType, Download, Settings, Eye, Sliders } from 'lucide-react';
import { CuttingListItem } from '../../types/cabinet';
import toast from 'react-hot-toast';
import * as pdfjs from 'pdfjs-dist';
import ExcelTemplateGenerator from './ExcelTemplateGenerator';
import PDFAnalyzer from './PDFAnalyzer';
import PDFInstructionGuide from './PDFInstructionGuide';
import PDFExtractorHelp from './PDFExtractorHelp';

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFImporterProps {
  onImport: (cuttingList: CuttingListItem[]) => void;
}

const PDFImporter: React.FC<PDFImporterProps> = ({ onImport }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<CuttingListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [pdfPages, setPdfPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [extractionSettings, setExtractionSettings] = useState({
    defaultThickness: 18,
    defaultMaterial: 'Plywood',
    defaultGrain: 'none' as 'length' | 'width' | 'none',
    dimensionPattern: '\\d+\\s*(?:x|×|X|\\*)\\s*\\d+\\s*(?:x|×|X|\\*)\\s*\\d+',
    numberPattern: '\\b(\\d+(?:\\.\\d+)?)\\s*(?:mm|cm|m)?\\b',
    materialPatterns: ['plywood', 'mdf', 'melamine', 'particleboard', 'solid\\s*wood', 'veneer', 'oak', 'maple', 'birch', 'pine', 'cherry', 'walnut'],
    grainPatterns: ['grain.*length', 'grain.*width', 'grain.*long', 'grain.*cross', 'yes', 'no', 'reserve grain'],
    quantityPatterns: ['qty.*\\d+', 'quantity.*\\d+', 'count.*\\d+', '\\d+\\s*pcs', '\\d+\\s*pieces']
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      setPdfPages(pdf.numPages);
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      if (file.type === 'application/pdf') {
        // Process PDF file
        const text = await extractTextFromPdf(file);
        setPdfText(text);
        
        // Try to parse the extracted text as a cutting list
        const items = parsePdfText(text);
        
        if (items.length === 0) {
          setError('No valid cutting list items found in the PDF. Try adjusting the format or use CSV/XML/JSON instead.');
          setParsedItems([]);
          return;
        }
        
        setParsedItems(items);
      } else {
        // Process other file types
        const text = await file.text();
        const items = parseFileContent(text, file.name);
        
        if (items.length === 0) {
          setError('No valid cutting list items found in the file');
          setParsedItems([]);
          return;
        }
        
        setParsedItems(items);
      }
      
      setFile(file);
    } catch (err) {
      console.error('Error parsing file:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setParsedItems([]);
    } finally {
      setIsProcessing(false);
    }
  }, [extractionSettings]);

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

  const parsePdfText = (text: string): CuttingListItem[] => {
    // This function attempts to extract cutting list items from PDF text
    // It uses various heuristics to identify parts, dimensions, etc.
    
    const items: CuttingListItem[] = [];
    
    // Split into lines and remove empty ones
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Look for material column header and grain column header
    const materialColumnIndex = lines.findIndex(line => 
      line.toLowerCase().includes('material') && line.match(/material/i)
    );
    
    const grainColumnIndex = lines.findIndex(line => 
      line.toLowerCase().includes('grain') && line.match(/grain/i)
    );

    // Process material and thickness information
    let materialMap: Record<string, { type: string, thickness: number }> = {};
    
    if (materialColumnIndex !== -1) {
      // Look for material entries like "MDF1, 18.0"
      for (let i = materialColumnIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        const materialMatch = line.match(/([A-Za-z0-9]+),\s*([0-9.]+)/);
        
        if (materialMatch) {
          const materialType = materialMatch[1];
          const thickness = parseFloat(materialMatch[2]);
          materialMap[materialType] = { type: materialType, thickness };
        }
      }
    }
    
    // Process grain direction information
    let grainMap: Record<string, 'length' | 'width' | 'none'> = {};
    
    if (grainColumnIndex !== -1) {
      // Look for grain entries
      for (let i = grainColumnIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim().toLowerCase();
        
        if (line.includes('no')) {
          grainMap['no'] = 'none';
        } else if (line.includes('yes')) {
          grainMap['yes'] = 'length';
        } else if (line.includes('reserve grain')) {
          grainMap['reserve grain'] = 'width';
        }
      }
    }
    
    // Try to identify table structure or patterns in the PDF
    // Look for lines that contain dimensions (numbers followed by mm)
    const dimensionPattern = new RegExp(extractionSettings.dimensionPattern);
    const numberPattern = new RegExp(extractionSettings.numberPattern, 'g');
    
    // Try to identify part names and dimensions
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip lines that are too short or don't contain numbers
      if (line.length < 5 || !/\d/.test(line)) continue;
      
      // Try to extract dimensions using pattern matching
      let length = 0;
      let width = 0;
      let thickness = extractionSettings.defaultThickness; // Default thickness
      let partName = '';
      let quantity = 1;
      let materialType = extractionSettings.defaultMaterial;
      let grain: 'length' | 'width' | 'none' = extractionSettings.defaultGrain;
      
      // First try to match a dimension pattern like 800x600x18
      const dimensionMatch = line.match(dimensionPattern);
      if (dimensionMatch) {
        const dimensions = dimensionMatch[0].split(/\s*(?:x|×|X|\*)\s*/);
        if (dimensions.length >= 3) {
          length = parseFloat(dimensions[0]);
          width = parseFloat(dimensions[1]);
          thickness = parseFloat(dimensions[2]);
        } else if (dimensions.length >= 2) {
          length = parseFloat(dimensions[0]);
          width = parseFloat(dimensions[1]);
        }
        
        // Try to extract part name from before the dimensions
        const beforeDimensions = line.split(dimensionMatch[0])[0].trim();
        if (beforeDimensions) {
          partName = beforeDimensions;
        } else {
          // If no name before dimensions, look for it after
          const afterDimensions = line.split(dimensionMatch[0])[1]?.trim();
          if (afterDimensions) {
            partName = afterDimensions;
          }
        }
      } else {
        // If no dimension pattern, try to extract individual numbers
        const numbers = [];
        let match;
        while ((match = numberPattern.exec(line)) !== null) {
          numbers.push(parseFloat(match[1]));
        }
        
        // If we found at least 2 numbers, assume they're length and width
        if (numbers.length >= 2) {
          // Sort numbers in descending order (typically length > width > thickness)
          numbers.sort((a, b) => b - a);
          length = numbers[0];
          width = numbers[1];
          
          if (numbers.length >= 3) {
            thickness = numbers[2];
          }
          
          // Try to extract part name by removing numbers and units
          partName = line.replace(/\b\d+(?:\.\d+)?\s*(?:mm|cm|m)?\b/g, '').trim();
        }
      }
      
      // Look for material information in the line
      for (const materialKey in materialMap) {
        if (line.includes(materialKey)) {
          materialType = materialMap[materialKey].type;
          thickness = materialMap[materialKey].thickness;
          break;
        }
      }
      
      // Look for grain information in the line
      for (const grainKey in grainMap) {
        if (line.toLowerCase().includes(grainKey.toLowerCase())) {
          grain = grainMap[grainKey];
          break;
        }
      }
      
      // Try to extract quantity if it exists
      for (const pattern of extractionSettings.quantityPatterns) {
        const qtyMatch = line.match(new RegExp(pattern, 'i'));
        if (qtyMatch) {
          const qtyNumber = qtyMatch[0].match(/\d+/);
          if (qtyNumber) {
            quantity = parseInt(qtyNumber[0]);
            break;
          }
        }
      }
      
      // Try to extract material type if not already found
      if (materialType === extractionSettings.defaultMaterial) {
        for (const pattern of extractionSettings.materialPatterns) {
          const materialMatch = line.match(new RegExp(`\\b(${pattern})\\b`, 'i'));
          if (materialMatch) {
            materialType = materialMatch[1];
            break;
          }
        }
      }
      
      // Try to extract grain direction if not already found
      if (grain === extractionSettings.defaultGrain) {
        for (const pattern of extractionSettings.grainPatterns) {
          if (line.match(new RegExp(pattern, 'i'))) {
            if (pattern.includes('length') || pattern.includes('long') || pattern === 'yes') {
              grain = 'length';
            } else if (pattern.includes('width') || pattern.includes('cross') || pattern === 'reserve grain') {
              grain = 'width';
            } else if (pattern === 'no') {
              grain = 'none';
            }
            break;
          }
        }
      }
      
      // Only add if we have valid dimensions and a part name
      if (length > 0 && width > 0 && thickness > 0) {
        // Clean up part name if it's still messy
        if (!partName || partName.length < 2) {
          partName = `Part ${i + 1}`;
        }
        
        items.push({
          id: `imported-${i}-${Date.now()}`,
          partName: partName,
          cabinetId: 'imported',
          cabinetName: 'Imported Cabinet',
          materialType,
          thickness,
          length,
          width,
          quantity,
          edgeBanding: { front: false, back: false, left: false, right: false },
          grain,
          priority: 1
        });
      }
    }
    
    return items;
  };

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
        throw new Error('Unsupported file format. Please use PDF, CSV, XML, or JSON files.');
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
      
      // Process grain direction based on your specific format
      let grain: 'length' | 'width' | 'none' = extractionSettings.defaultGrain;
      if (values[grainIndex]) {
        const grainValue = values[grainIndex].toLowerCase();
        if (grainValue === 'yes' || grainValue.includes('length')) {
          grain = 'length';
        } else if (grainValue === 'reserve grain' || grainValue.includes('width')) {
          grain = 'width';
        } else if (grainValue === 'no' || grainValue.includes('none')) {
          grain = 'none';
        }
      }
      
      const item: CuttingListItem = {
        id: `imported-${i}-${Date.now()}`,
        partName: values[nameIndex] || `Part ${i}`,
        cabinetId: 'imported',
        cabinetName: 'Imported Cabinet',
        materialType: values[materialIndex] || extractionSettings.defaultMaterial,
        thickness: parseFloat(values[thicknessIndex]) || extractionSettings.defaultThickness,
        length: parseFloat(values[lengthIndex]) || 0,
        width: parseFloat(values[widthIndex]) || 0,
        quantity: parseInt(values[quantityIndex]) || 1,
        edgeBanding: { front: false, back: false, left: false, right: false },
        grain,
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
        
        // Process grain direction based on your specific format
        let grain: 'length' | 'width' | 'none' = extractionSettings.defaultGrain;
        const grainValue = getValue('Grain')?.toLowerCase() || '';
        if (grainValue === 'yes' || grainValue.includes('length')) {
          grain = 'length';
        } else if (grainValue === 'reserve grain' || grainValue.includes('width')) {
          grain = 'width';
        } else if (grainValue === 'no' || grainValue.includes('none')) {
          grain = 'none';
        }
        
        const item: CuttingListItem = {
          id: `imported-${index}-${Date.now()}`,
          partName: getValue('Name') || getValue('Description') || `Part ${index + 1}`,
          cabinetId: 'imported',
          cabinetName: 'Imported Cabinet',
          materialType: getValue('Material') || getValue('Type') || extractionSettings.defaultMaterial,
          thickness: parseFloat(getValue('Thickness')) || extractionSettings.defaultThickness,
          length: parseFloat(getValue('Length')) || 0,
          width: parseFloat(getValue('Width')) || 0,
          quantity: parseInt(getValue('Quantity')) || parseInt(getValue('Count')) || 1,
          edgeBanding: { 
            front: getValue('EdgeFront')?.toLowerCase() === 'true', 
            back: getValue('EdgeBack')?.toLowerCase() === 'true', 
            left: getValue('EdgeLeft')?.toLowerCase() === 'true', 
            right: getValue('EdgeRight')?.toLowerCase() === 'true' 
          },
          grain,
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
        } else {
          // Check for individual edge banding properties
          edgeBanding.front = !!normalizedItem.edgefront || !!normalizedItem.frontedge;
          edgeBanding.back = !!normalizedItem.edgeback || !!normalizedItem.backedge;
          edgeBanding.left = !!normalizedItem.edgeleft || !!normalizedItem.leftedge;
          edgeBanding.right = !!normalizedItem.edgeright || !!normalizedItem.rightedge;
        }
        
        // Process grain direction based on your specific format
        let grain: 'length' | 'width' | 'none' = extractionSettings.defaultGrain;
        if (normalizedItem.grain) {
          const grainValue = normalizedItem.grain.toString().toLowerCase();
          if (grainValue === 'yes' || grainValue.includes('length')) {
            grain = 'length';
          } else if (grainValue === 'reserve grain' || grainValue.includes('width')) {
            grain = 'width';
          } else if (grainValue === 'no' || grainValue.includes('none')) {
            grain = 'none';
          }
        }
        
        return {
          id: `imported-${index}-${Date.now()}`,
          partName: normalizedItem.name || normalizedItem.partname || normalizedItem.description || `Part ${index + 1}`,
          cabinetId: 'imported',
          cabinetName: 'Imported Cabinet',
          materialType: normalizedItem.material || normalizedItem.materialtype || normalizedItem.type || extractionSettings.defaultMaterial,
          thickness: parseFloat(normalizedItem.thickness) || extractionSettings.defaultThickness,
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
      setPdfText(null);
    } else {
      toast.error('No valid items to import');
    }
  };

  const handleCancel = () => {
    setFile(null);
    setParsedItems([]);
    setError(null);
    setPdfText(null);
  };

  const handleManualExtract = () => {
    if (pdfText) {
      try {
        // Try to parse the PDF text again with manual intervention
        const items = parsePdfText(pdfText);
        if (items.length > 0) {
          setParsedItems(items);
          setError(null);
          toast.success(`Found ${items.length} items in the PDF`);
        } else {
          setError('Could not extract cutting list items from the PDF text');
          toast.error('No items found. Try adjusting extraction settings.');
        }
      } catch (err) {
        console.error('Error parsing PDF text:', err);
        setError(err instanceof Error ? err.message : 'Failed to parse PDF text');
      }
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setExtractionSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Import PDF Cutting List</h3>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-4 h-4 mr-1" />
              {showAdvanced ? 'Hide Settings' : 'Advanced Settings'}
            </button>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              <Info className="w-4 h-4 mr-1" />
              {showHelp ? 'Hide Help' : 'Show Help'}
            </button>
            <ExcelTemplateGenerator />
          </div>
        </div>
        
        {showAdvanced && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
              <Sliders className="w-4 h-4 mr-2 text-gray-600" />
              PDF Extraction Settings
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Thickness (mm)
                </label>
                <input
                  type="number"
                  value={extractionSettings.defaultThickness}
                  onChange={(e) => handleSettingChange('defaultThickness', parseFloat(e.target.value) || 18)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Used when thickness is not found in the PDF</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Material
                </label>
                <input
                  type="text"
                  value={extractionSettings.defaultMaterial}
                  onChange={(e) => handleSettingChange('defaultMaterial', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Used when material is not found in the PDF</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Grain Direction
                </label>
                <select
                  value={extractionSettings.defaultGrain}
                  onChange={(e) => handleSettingChange('defaultGrain', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="none">None</option>
                  <option value="length">Length</option>
                  <option value="width">Width</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Used when grain direction is not found</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material Types to Detect (comma separated)
                </label>
                <input
                  type="text"
                  value={extractionSettings.materialPatterns.join(', ')}
                  onChange={(e) => handleSettingChange('materialPatterns', e.target.value.split(',').map(s => s.trim()))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">The system will look for these material types in the PDF</p>
              </div>
            </div>
            
            <div className="mt-4 text-right">
              <button
                onClick={handleManualExtract}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Settings & Re-Extract
              </button>
            </div>
          </div>
        )}
        
        {!file ? (
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Drag & Drop your PDF cutting list here</h4>
            <p className="text-gray-600 mb-6">or click to browse your files</p>
            
            <input
              type="file"
              id="file-upload"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.csv,.xml,.json,.txt,.xlsx,.xls"
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Browse Files
            </label>
            
            <div className="mt-6 text-sm text-gray-500">
              <p>Supported file formats: PDF, Excel, CSV, XML, JSON</p>
              <p className="mt-2">The file should contain panel dimensions, material types, and quantities</p>
              <p className="mt-2">Click "Download Excel Template" above for a properly formatted template</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              {file.type === 'application/pdf' ? (
                <FileType className="w-8 h-8 text-red-600 mr-4" />
              ) : file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? (
                <FileText className="w-8 h-8 text-green-600 mr-4" />
              ) : (
                <File className="w-8 h-8 text-blue-600 mr-4" />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                  {file.type === 'application/pdf' && pdfPages > 0 && ` • ${pdfPages} pages`}
                </p>
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
                
                {file.type === 'application/pdf' && pdfText && (
                  <div className="mt-4">
                    <button
                      onClick={handleManualExtract}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors text-sm"
                    >
                      Try Alternative Extraction Method
                    </button>
                    <p className="mt-2 text-sm text-red-600">
                      PDF extraction can be challenging. Try adjusting the extraction settings or use the Excel template for better results.
                    </p>
                  </div>
                )}
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
            
            {file.type === 'application/pdf' && pdfText && parsedItems.length === 0 && !isProcessing && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center text-yellow-800 mb-2">
                  <Info className="w-5 h-5 mr-2" />
                  <h4 className="font-medium">PDF Text Extracted</h4>
                </div>
                <p className="text-yellow-700 mb-2">
                  Text was extracted from the PDF, but no cutting list items were identified. 
                  Try using the advanced settings to adjust the extraction parameters.
                </p>
                <div className="mt-3">
                  <button
                    onClick={() => setShowAdvanced(true)}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors text-sm mr-2"
                  >
                    <Settings className="w-3 h-3 inline-block mr-1" />
                    Show Advanced Settings
                  </button>
                  <button
                    onClick={handleManualExtract}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors text-sm"
                  >
                    Try Alternative Extraction
                  </button>
                </div>
              </div>
            )}
            
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
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Edge Banding</th>
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
                    <td className="px-3 py-2 text-gray-900">
                      {Object.entries(item.edgeBanding)
                        .filter(([_, value]) => value)
                        .map(([edge]) => edge)
                        .join(', ') || 'None'}
                    </td>
                  </tr>
                ))}
                {parsedItems.length > 10 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-2 text-center text-gray-500">
                      ... and {parsedItems.length - 10} more items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {file?.type === 'application/pdf' && pdfText && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">PDF Text Content</h3>
            {pdfPages > 1 && (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {currentPage} of {pdfPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(pdfPages, prev + 1))}
                  disabled={currentPage === pdfPages}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto font-mono text-xs whitespace-pre-wrap">
            {pdfText}
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>
              This is the raw text extracted from the PDF. If automatic extraction failed, you can:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Try adjusting the extraction settings above</li>
              <li>Use the Excel template provided above</li>
              <li>Copy this text and format it as CSV in a text editor</li>
              <li>Try a different PDF with clearer formatting</li>
            </ul>
          </div>
        </div>
      )}
      
      {file?.type === 'application/pdf' && pdfText && (
        <PDFAnalyzer 
          pdfText={pdfText} 
          parsedItems={parsedItems} 
          onAnalyze={handleManualExtract} 
        />
      )}
      
      {showHelp && (
        <>
          <PDFInstructionGuide />
          <PDFExtractorHelp />
        </>
      )}
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Excel Template Format</h3>
        <p className="text-blue-800 mb-4">
          For best results, use the Excel template provided above. The template includes the following columns:
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-blue-800 uppercase">Column</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-blue-800 uppercase">Description</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-blue-800 uppercase">Required</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-blue-800 uppercase">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              <tr className="bg-white">
                <td className="px-3 py-2 font-medium">Part Name</td>
                <td className="px-3 py-2">Name or description of the part</td>
                <td className="px-3 py-2">Yes</td>
                <td className="px-3 py-2">Side Panel</td>
              </tr>
              <tr className="bg-white">
                <td className="px-3 py-2 font-medium">Length (mm)</td>
                <td className="px-3 py-2">Length of the part in millimeters</td>
                <td className="px-3 py-2">Yes</td>
                <td className="px-3 py-2">720</td>
              </tr>
              <tr className="bg-white">
                <td className="px-3 py-2 font-medium">Width (mm)</td>
                <td className="px-3 py-2">Width of the part in millimeters</td>
                <td className="px-3 py-2">Yes</td>
                <td className="px-3 py-2">560</td>
              </tr>
              <tr className="bg-white">
                <td className="px-3 py-2 font-medium">Thickness (mm)</td>
                <td className="px-3 py-2">Thickness of the part in millimeters</td>
                <td className="px-3 py-2">Yes</td>
                <td className="px-3 py-2">18</td>
              </tr>
              <tr className="bg-white">
                <td className="px-3 py-2 font-medium">Quantity</td>
                <td className="px-3 py-2">Number of identical parts needed</td>
                <td className="px-3 py-2">Yes</td>
                <td className="px-3 py-2">2</td>
              </tr>
              <tr className="bg-white">
                <td className="px-3 py-2 font-medium">Material Type</td>
                <td className="px-3 py-2">Type of material for the part</td>
                <td className="px-3 py-2">No</td>
                <td className="px-3 py-2">MDF1, 18.0</td>
              </tr>
              <tr className="bg-white">
                <td className="px-3 py-2 font-medium">Grain Direction</td>
                <td className="px-3 py-2">Direction of wood grain</td>
                <td className="px-3 py-2">No</td>
                <td className="px-3 py-2">Yes, No, Reserve Grain</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PDFImporter;