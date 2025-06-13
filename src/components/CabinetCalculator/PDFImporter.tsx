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
    defaultMaterial: 'MDF',
    defaultGrain: 'none' as 'length' | 'width' | 'none',
    columnMappings: {
      partNumber: ['num', 'number', 'part number', 'part no', 'item'],
      partName: ['reference', 'name', 'part name', 'description', 'part'],
      length: ['height', 'length', 'len', 'l'],
      width: ['width', 'w', 'wid'],
      thickness: ['thickness', 'thick', 't'],
      quantity: ['quantity', 'qty', 'count', 'pcs'],
      material: ['material', 'mat', 'type'],
      grain: ['grain', 'grain direction', 'direction'],
      edgeLeft: ['left edge', 'edge left', 'left'],
      edgeRight: ['right edge', 'edge right', 'right'],
      edgeTop: ['top edge', 'edge top', 'top', 'front edge', 'edge front', 'front'],
      edgeBottom: ['bottom edge', 'edge bottom', 'bottom', 'back edge', 'edge back', 'back']
    }
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
        
        // Preserve the original layout as much as possible
        let lastY = null;
        let text = '';
        
        for (const item of textContent.items) {
          const itemAny = item as any;
          if (lastY !== itemAny.transform[5] && lastY !== null) {
            text += '\n';
          }
          text += itemAny.str;
          lastY = itemAny.transform[5];
        }
        
        fullText += text + '\n';
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
    const items: CuttingListItem[] = [];
    
    // Split into lines and remove empty ones
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Find the header line that contains column headers
    const headerLineIndex = lines.findIndex(line => {
      const lowerLine = line.toLowerCase();
      return (
        lowerLine.includes('num') && 
        (lowerLine.includes('reference') || lowerLine.includes('part name')) && 
        lowerLine.includes('height') && 
        lowerLine.includes('width') && 
        lowerLine.includes('quantity')
      );
    });
    
    if (headerLineIndex === -1) {
      console.warn("Couldn't find header line in PDF");
      return [];
    }
    
    const headerLine = lines[headerLineIndex].toLowerCase();
    console.log("Found header line:", headerLine);
    
    // Find column positions
    const columnPositions: Record<string, { start: number, end?: number }> = {};
    
    // Map of column types to possible header names
    const columnMappings = {
      num: ['num', 'number', 'part number', 'part no', 'item'],
      reference: ['reference', 'name', 'part name', 'description', 'part'],
      height: ['height', 'length', 'len', 'l'],
      width: ['width', 'w', 'wid'],
      quantity: ['quantity', 'qty', 'count', 'pcs'],
      leftEdge: ['left edge', 'edge left', 'left'],
      rightEdge: ['right edge', 'edge right', 'right'],
      topEdge: ['top edge', 'edge top', 'top', 'front edge', 'edge front', 'front'],
      bottomEdge: ['bottom edge', 'edge bottom', 'bottom', 'back edge', 'edge back', 'back'],
      material: ['material', 'mat', 'type'],
      thickness: ['thickness', 'thick', 't'],
      grain: ['grain', 'grain direction', 'direction']
    };
    
    // Find the position of each column in the header line
    for (const [columnType, possibleNames] of Object.entries(columnMappings)) {
      for (const name of possibleNames) {
        const position = headerLine.indexOf(name);
        if (position !== -1) {
          columnPositions[columnType] = { start: position };
          break;
        }
      }
    }
    
    // Sort columns by position to determine column boundaries
    const sortedColumns = Object.entries(columnPositions)
      .sort((a, b) => a[1].start - b[1].start)
      .map(([type, position]) => ({ type, position }));
    
    // Set end positions based on the next column's start position
    for (let i = 0; i < sortedColumns.length - 1; i++) {
      sortedColumns[i].position.end = sortedColumns[i + 1].position.start;
    }
    
    console.log("Column positions:", sortedColumns);
    
    // Process data rows
    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || !line.match(/\d+/)) continue; // Skip empty lines or lines without numbers
      
      // Extract values from each column
      const values: Record<string, string> = {};
      
      for (const { type, position } of sortedColumns) {
        const start = position.start;
        const end = position.end || line.length;
        if (start < line.length) {
          values[type] = line.substring(start, end).trim();
        }
      }
      
      // Skip rows that don't have essential data
      if (!values.num || (!values.height && !values.width)) {
        continue;
      }
      
      // Parse material and thickness
      let materialType = extractionSettings.defaultMaterial;
      let thickness = extractionSettings.defaultThickness;
      
      if (values.material) {
        // Check if material contains thickness info like "MDF1, 18.0"
        const materialMatch = values.material.match(/([^,]+),\s*(\d+(?:\.\d+)?)/);
        if (materialMatch) {
          materialType = materialMatch[1].trim();
          thickness = parseFloat(materialMatch[2]);
        } else {
          materialType = values.material;
        }
      }
      
      if (values.thickness) {
        thickness = parseFloat(values.thickness) || thickness;
      }
      
      // Parse grain direction
      let grain: 'length' | 'width' | 'none' = extractionSettings.defaultGrain;
      if (values.grain) {
        const grainValue = values.grain.toLowerCase();
        if (grainValue === 'yes' || grainValue.includes('length')) {
          grain = 'length';
        } else if (grainValue === 'reserve grain' || grainValue.includes('width')) {
          grain = 'width';
        } else if (grainValue === 'no' || grainValue.includes('none')) {
          grain = 'none';
        }
      }
      
      // Parse edge banding - any non-empty value is considered TRUE
      const edgeBanding = {
        front: !!values.topEdge && values.topEdge.trim() !== '',
        back: !!values.bottomEdge && values.bottomEdge.trim() !== '',
        left: !!values.leftEdge && values.leftEdge.trim() !== '',
        right: !!values.rightEdge && values.rightEdge.trim() !== ''
      };
      
      // Create cutting list item
      const item: CuttingListItem = {
        id: `imported-${i}-${Date.now()}`,
        partName: values.reference || `Part ${values.num}`,
        cabinetId: 'imported',
        cabinetName: 'Imported Cabinet',
        materialType,
        thickness,
        length: parseFloat(values.height) || 0,
        width: parseFloat(values.width) || 0,
        quantity: parseInt(values.quantity) || 1,
        edgeBanding,
        grain,
        priority: 1
      };
      
      // Only add if we have valid dimensions
      if (item.length > 0 && item.width > 0) {
        items.push(item);
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
      let edgeLeftIndex = -1;
      let edgeRightIndex = -1;
      let edgeTopIndex = -1;
      let edgeBottomIndex = -1;
      
      // If we have a header, try to find the correct columns
      if (hasHeader && i === 1) {
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
        nameIndex = headers.findIndex(h => h.includes('part') || h.includes('name') || h.includes('description') || h.includes('reference'));
        lengthIndex = headers.findIndex(h => h.includes('length') || h.includes('len') || h.includes('height'));
        widthIndex = headers.findIndex(h => h.includes('width') || h.includes('wid'));
        thicknessIndex = headers.findIndex(h => h.includes('thickness') || h.includes('thick'));
        quantityIndex = headers.findIndex(h => h.includes('quantity') || h.includes('qty') || h.includes('count'));
        materialIndex = headers.findIndex(h => h.includes('material') || h.includes('type'));
        grainIndex = headers.findIndex(h => h.includes('grain') || h.includes('direction'));
        edgeLeftIndex = headers.findIndex(h => h.includes('left edge') || h.includes('edge left'));
        edgeRightIndex = headers.findIndex(h => h.includes('right edge') || h.includes('edge right'));
        edgeTopIndex = headers.findIndex(h => h.includes('top edge') || h.includes('edge top') || h.includes('front edge'));
        edgeBottomIndex = headers.findIndex(h => h.includes('bottom edge') || h.includes('edge bottom') || h.includes('back edge'));
        
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
      if (grainIndex >= 0 && values[grainIndex]) {
        const grainValue = values[grainIndex].toLowerCase();
        if (grainValue === 'yes' || grainValue.includes('length')) {
          grain = 'length';
        } else if (grainValue === 'reserve grain' || grainValue.includes('width')) {
          grain = 'width';
        } else if (grainValue === 'no' || grainValue.includes('none')) {
          grain = 'none';
        }
      }
      
      // Process edge banding
      const edgeBanding = {
        front: edgeTopIndex >= 0 ? !!values[edgeTopIndex] && values[edgeTopIndex].toLowerCase() !== 'false' && values[edgeTopIndex].toLowerCase() !== 'no' : false,
        back: edgeBottomIndex >= 0 ? !!values[edgeBottomIndex] && values[edgeBottomIndex].toLowerCase() !== 'false' && values[edgeBottomIndex].toLowerCase() !== 'no' : false,
        left: edgeLeftIndex >= 0 ? !!values[edgeLeftIndex] && values[edgeLeftIndex].toLowerCase() !== 'false' && values[edgeLeftIndex].toLowerCase() !== 'no' : false,
        right: edgeRightIndex >= 0 ? !!values[edgeRightIndex] && values[edgeRightIndex].toLowerCase() !== 'false' && values[edgeRightIndex].toLowerCase() !== 'no' : false
      };
      
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
        edgeBanding,
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
        
        // Process edge banding
        const edgeBanding = {
          front: getValue('EdgeTop')?.toLowerCase() === 'true' || getValue('EdgeFront')?.toLowerCase() === 'true',
          back: getValue('EdgeBottom')?.toLowerCase() === 'true' || getValue('EdgeBack')?.toLowerCase() === 'true',
          left: getValue('EdgeLeft')?.toLowerCase() === 'true',
          right: getValue('EdgeRight')?.toLowerCase() === 'true'
        };
        
        const item: CuttingListItem = {
          id: `imported-${index}-${Date.now()}`,
          partName: getValue('Reference') || getValue('Name') || getValue('Description') || `Part ${index + 1}`,
          cabinetId: 'imported',
          cabinetName: 'Imported Cabinet',
          materialType: getValue('Material') || getValue('Type') || extractionSettings.defaultMaterial,
          thickness: parseFloat(getValue('Thickness')) || extractionSettings.defaultThickness,
          length: parseFloat(getValue('Length') || getValue('Height')) || 0,
          width: parseFloat(getValue('Width')) || 0,
          quantity: parseInt(getValue('Quantity')) || parseInt(getValue('Count')) || 1,
          edgeBanding,
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
        
        // Process edge banding
        const edgeBanding = {
          front: !!normalizedItem.edgetop || !!normalizedItem.edgefront || !!normalizedItem.topedge || !!normalizedItem.frontedge,
          back: !!normalizedItem.edgebottom || !!normalizedItem.edgeback || !!normalizedItem.bottomedge || !!normalizedItem.backedge,
          left: !!normalizedItem.edgeleft || !!normalizedItem.leftedge,
          right: !!normalizedItem.edgeright || !!normalizedItem.rightedge
        };
        
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
          partName: normalizedItem.reference || normalizedItem.name || normalizedItem.partname || normalizedItem.description || `Part ${index + 1}`,
          cabinetId: 'imported',
          cabinetName: 'Imported Cabinet',
          materialType: normalizedItem.material || normalizedItem.materialtype || normalizedItem.type || extractionSettings.defaultMaterial,
          thickness: parseFloat(normalizedItem.thickness) || extractionSettings.defaultThickness,
          length: parseFloat(normalizedItem.length || normalizedItem.height) || 0,
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
        // Try a more direct approach to parsing the PDF text
        const lines = pdfText.split('\n').filter(line => line.trim().length > 0);
        
        // Find the header line
        const headerLineIndex = lines.findIndex(line => {
          const lowerLine = line.toLowerCase();
          return lowerLine.includes('num') && lowerLine.includes('reference') && 
                 lowerLine.includes('height') && lowerLine.includes('width');
        });
        
        if (headerLineIndex === -1) {
          setError('Could not find header line in the PDF');
          return;
        }
        
        const headerLine = lines[headerLineIndex];
        console.log("Header line:", headerLine);
        
        // Define column positions
        const numPos = headerLine.toLowerCase().indexOf('num');
        const refPos = headerLine.toLowerCase().indexOf('reference');
        const heightPos = headerLine.toLowerCase().indexOf('height');
        const widthPos = headerLine.toLowerCase().indexOf('width');
        const qtyPos = headerLine.toLowerCase().indexOf('quantity');
        const leftEdgePos = headerLine.toLowerCase().indexOf('left edge');
        const rightEdgePos = headerLine.toLowerCase().indexOf('right edge');
        const topEdgePos = headerLine.toLowerCase().indexOf('top edge');
        const bottomEdgePos = headerLine.toLowerCase().indexOf('bottom edge');
        
        // Define column boundaries
        const columns = [
          { name: 'num', pos: numPos },
          { name: 'reference', pos: refPos },
          { name: 'height', pos: heightPos },
          { name: 'width', pos: widthPos },
          { name: 'quantity', pos: qtyPos },
          { name: 'leftEdge', pos: leftEdgePos },
          { name: 'rightEdge', pos: rightEdgePos },
          { name: 'topEdge', pos: topEdgePos },
          { name: 'bottomEdge', pos: bottomEdgePos }
        ].filter(col => col.pos !== -1)
         .sort((a, b) => a.pos - b.pos);
        
        // Process data rows
        const items: CuttingListItem[] = [];
        
        for (let i = headerLineIndex + 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.match(/\d+/)) continue; // Skip lines without numbers
          
          // Extract values from each column
          const values: Record<string, string> = {};
          
          for (let j = 0; j < columns.length; j++) {
            const col = columns[j];
            const nextCol = columns[j + 1];
            const start = col.pos;
            const end = nextCol ? nextCol.pos : line.length;
            
            if (start < line.length) {
              values[col.name] = line.substring(start, end).trim();
            }
          }
          
          // Skip rows that don't have essential data
          if (!values.num || !values.height || !values.width) {
            continue;
          }
          
          // Create cutting list item
          const item: CuttingListItem = {
            id: `imported-${i}-${Date.now()}`,
            partName: values.reference || `Part ${values.num}`,
            cabinetId: 'imported',
            cabinetName: 'Imported Cabinet',
            materialType: extractionSettings.defaultMaterial,
            thickness: extractionSettings.defaultThickness,
            length: parseFloat(values.height) || 0,
            width: parseFloat(values.width) || 0,
            quantity: parseInt(values.quantity) || 1,
            edgeBanding: {
              left: !!values.leftEdge,
              right: !!values.rightEdge,
              front: !!values.topEdge,
              back: !!values.bottomEdge
            },
            grain: extractionSettings.defaultGrain,
            priority: 1
          };
          
          // Only add if we have valid dimensions
          if (item.length > 0 && item.width > 0) {
            items.push(item);
          }
        }
        
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
              PDF Column Mapping Settings
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
                  Column Mapping Information
                </label>
                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                  <p className="mb-2">The system will look for these column headers in your PDF:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Part Number:</strong> Num, Number, Part Number, Part No, Item</li>
                    <li><strong>Part Name:</strong> Reference, Name, Part Name, Description, Part</li>
                    <li><strong>Length:</strong> Height, Length, Len, L</li>
                    <li><strong>Width:</strong> Width, W, Wid</li>
                    <li><strong>Quantity:</strong> Quantity, Qty, Count, Pcs</li>
                    <li><strong>Edge Banding:</strong> Left Edge, Right Edge, Top Edge, Bottom Edge</li>
                  </ul>
                </div>
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
                        .map(([edge]) => edge.charAt(0).toUpperCase() + edge.slice(1))
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
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Column Mapping Guide</h3>
        <p className="text-blue-800 mb-4">
          For best results, your PDF should include these columns with the following information:
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
                <td className="px-3 py-2 font-medium">Num</td>
                <td className="px-3 py-2">Panel number or identifier</td>
                <td className="px-3 py-2">Yes</td>
                <td className="px-3 py-2">1, 2, 3...</td>
              </tr>
              <tr className="bg-white">
                <td className="px-3 py-2 font-medium">Reference</td>
                <td className="px-3 py-2">Part name or description</td>
                <td className="px-3 py-2">Yes</td>
                <td className="px-3 py-2">Side Panel, Bottom Panel</td>
              </tr>
              <tr className="bg-white">
                <td className="px-3 py-2 font-medium">Height</td>
                <td className="px-3 py-2">Length of the panel in millimeters</td>
                <td className="px-3 py-2">Yes</td>
                <td className="px-3 py-2">720</td>
              </tr>
              <tr className="bg-white">
                <td className="px-3 py-2 font-medium">Width</td>
                <td className="px-3 py-2">Width of the panel in millimeters</td>
                <td className="px-3 py-2">Yes</td>
                <td className="px-3 py-2">560</td>
              </tr>
              <tr className="bg-white">
                <td className="px-3 py-2 font-medium">Quantity</td>
                <td className="px-3 py-2">Number of identical panels needed</td>
                <td className="px-3 py-2">Yes</td>
                <td className="px-3 py-2">2</td>
              </tr>
              <tr className="bg-white">
                <td className="px-3 py-2 font-medium">Left Edge</td>
                <td className="px-3 py-2">Edge banding on left side</td>
                <td className="px-3 py-2">No</td>
                <td className="px-3 py-2">X (any value = TRUE, empty = FALSE)</td>
              </tr>
              <tr className="bg-white">
                <td className="px-3 py-2 font-medium">Right Edge</td>
                <td className="px-3 py-2">Edge banding on right side</td>
                <td className="px-3 py-2">No</td>
                <td className="px-3 py-2">X (any value = TRUE, empty = FALSE)</td>
              </tr>
              <tr className="bg-white">
                <td className="px-3 py-2 font-medium">Bottom Edge</td>
                <td className="px-3 py-2">Edge banding on back side</td>
                <td className="px-3 py-2">No</td>
                <td className="px-3 py-2">X (any value = TRUE, empty = FALSE)</td>
              </tr>
              <tr className="bg-white">
                <td className="px-3 py-2 font-medium">Top Edge</td>
                <td className="px-3 py-2">Edge banding on front side</td>
                <td className="px-3 py-2">No</td>
                <td className="px-3 py-2">X (any value = TRUE, empty = FALSE)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PDFImporter;