import { CabinetConfiguration, CabinetProject, NestingResult } from '../../types/cabinet';
import { CabinetCalculatorService } from '../../services/cabinetCalculator';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';
import toast from 'react-hot-toast';

// Helper function to download a file
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Export cutting list as CSV
export const exportCuttingListCSV = (config: CabinetConfiguration) => {
  const csv = CabinetCalculatorService.generateCuttingListCSV(config);
  downloadFile(csv, `cutting-list-${config.name.replace(/\s+/g, '-')}.csv`, 'text/csv');
};

// Export cutting list as PDF
export const exportCuttingListPDF = (config: CabinetConfiguration) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(`Cutting List: ${config.name}`, 14, 22);
  
  // Add cabinet info
  doc.setFontSize(12);
  doc.text(`Dimensions: ${config.dimensions.width} × ${config.dimensions.height} × ${config.dimensions.depth}mm`, 14, 32);
  
  // Add cutting list table
  (doc as any).autoTable({
    startY: 40,
    head: [['Part Name', 'Material', 'Thickness', 'Length', 'Width', 'Qty', 'Edge Banding']],
    body: config.cuttingList.map(item => [
      item.partName,
      item.materialType,
      `${item.thickness}mm`,
      `${item.length}mm`,
      `${item.width}mm`,
      item.quantity,
      Object.entries(item.edgeBanding)
        .filter(([_, value]) => value)
        .map(([edge]) => edge)
        .join(', ') || 'None'
    ]),
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] }
  });
  
  // Save the PDF
  doc.save(`cutting-list-${config.name.replace(/\s+/g, '-')}.pdf`);
};

// Export BOM as Excel
export const exportBOMExcel = (config: CabinetConfiguration) => {
  const bom = CabinetCalculatorService.generateBOM(config);
  
  // Create workbook
  const wb = utils.book_new();
  
  // Create materials worksheet
  const materialsData = [
    ['Material ID', 'Material Name', 'Type', 'Thickness', 'Dimensions', 'Quantity', 'Unit Cost', 'Total Cost', 'Supplier']
  ];
  
  config.materials.forEach(material => {
    materialsData.push([
      material.materialId,
      material.materialName,
      material.type,
      `${material.thickness}mm`,
      `${material.dimensions.length} × ${material.dimensions.width}mm`,
      material.quantity,
      material.unitCost,
      material.totalCost,
      material.supplier
    ]);
  });
  
  const materialsWs = utils.aoa_to_sheet(materialsData);
  utils.book_append_sheet(wb, materialsWs, 'Materials');
  
  // Create hardware worksheet
  const hardwareData = [
    ['Hardware ID', 'Hardware Name', 'Type', 'Quantity', 'Unit Cost', 'Total Cost', 'Supplier']
  ];
  
  config.hardware.forEach(hardware => {
    hardwareData.push([
      hardware.hardwareId,
      hardware.hardwareName,
      hardware.type,
      hardware.quantity,
      hardware.unitCost,
      hardware.totalCost,
      hardware.supplier
    ]);
  });
  
  const hardwareWs = utils.aoa_to_sheet(hardwareData);
  utils.book_append_sheet(wb, hardwareWs, 'Hardware');
  
  // Create cutting list worksheet
  const cuttingData = [
    ['Part Name', 'Material', 'Thickness', 'Length', 'Width', 'Quantity', 'Edge Banding', 'Grain']
  ];
  
  config.cuttingList.forEach(item => {
    cuttingData.push([
      item.partName,
      item.materialType,
      item.thickness,
      item.length,
      item.width,
      item.quantity,
      Object.entries(item.edgeBanding)
        .filter(([_, value]) => value)
        .map(([edge]) => edge)
        .join(', ') || 'None',
      item.grain
    ]);
  });
  
  const cuttingWs = utils.aoa_to_sheet(cuttingData);
  utils.book_append_sheet(wb, cuttingWs, 'Cutting List');
  
  // Create summary worksheet
  const summaryData = [
    ['Cabinet Name', config.name],
    ['Template', config.templateId],
    ['Dimensions', `${config.dimensions.width} × ${config.dimensions.height} × ${config.dimensions.depth}mm`],
    ['Door Count', config.customizations.doorCount],
    ['Drawer Count', config.customizations.drawerCount],
    ['Shelf Count', config.customizations.shelfCount],
    ['Door Style', config.customizations.doorStyle],
    ['Finish', config.customizations.finish],
    ['Hardware', config.customizations.hardware],
    ['Material Cost', config.materials.reduce((sum, m) => sum + m.totalCost, 0)],
    ['Hardware Cost', config.hardware.reduce((sum, h) => sum + h.totalCost, 0)],
    ['Labor Cost', config.laborCost],
    ['Total Cost', config.totalCost]
  ];
  
  const summaryWs = utils.aoa_to_sheet(summaryData);
  utils.book_append_sheet(wb, summaryWs, 'Summary');
  
  // Write to file and download
  writeFile(wb, `bom-${config.name.replace(/\s+/g, '-')}.xlsx`);
};

// Export project as PDF
export const exportProjectPDF = (project: CabinetProject) => {
  const doc = new jsPDF();
  
  // Add title and project info
  doc.setFontSize(20);
  doc.text('Cabinet Project Quotation', 14, 22);
  
  doc.setFontSize(14);
  doc.text(project.name, 14, 32);
  
  doc.setFontSize(12);
  doc.text(`Customer: ${project.customerName}`, 14, 42);
  if (project.customerContact) {
    doc.text(`Contact: ${project.customerContact}`, 14, 50);
  }
  
  doc.text(`Date: ${new Date(project.createdAt).toLocaleDateString()}`, 14, 58);
  doc.text(`Valid until: ${new Date(project.createdAt).toLocaleDateString()}`, 14, 66);
  
  // Add cabinets table
  (doc as any).autoTable({
    startY: 76,
    head: [['Cabinet', 'Dimensions', 'Features', 'Unit Price']],
    body: project.configurations.map(config => [
      config.name,
      `${config.dimensions.width} × ${config.dimensions.height} × ${config.dimensions.depth}mm`,
      `Doors: ${config.customizations.doorCount}, Drawers: ${config.customizations.drawerCount}, Shelves: ${config.customizations.shelfCount}`,
      `$${config.totalCost.toFixed(2)}`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] }
  });
  
  // Add cost summary
  const finalY = (doc as any).lastAutoTable.finalY || 120;
  
  doc.text('Cost Summary', 14, finalY + 10);
  
  (doc as any).autoTable({
    startY: finalY + 15,
    head: [['Description', 'Amount']],
    body: [
      ['Materials', `$${project.totalMaterialCost.toFixed(2)}`],
      ['Hardware', `$${project.totalHardwareCost.toFixed(2)}`],
      ['Labor', `$${project.totalLaborCost.toFixed(2)}`],
      ['Subtotal', `$${project.subtotal.toFixed(2)}`],
      ['Tax (10%)', `$${project.tax.toFixed(2)}`],
      ['Total', `$${project.total.toFixed(2)}`]
    ],
    theme: 'plain',
    headStyles: { fillColor: [66, 139, 202] },
    bodyStyles: { fontSize: 12 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 50, halign: 'right' }
    }
  });
  
  // Add notes
  if (project.notes) {
    const finalY2 = (doc as any).lastAutoTable.finalY || 200;
    doc.text('Notes:', 14, finalY2 + 10);
    doc.setFontSize(10);
    doc.text(project.notes, 14, finalY2 + 20);
  }
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    doc.text('Cabinet WMS - Generated Quote', doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
  }
  
  // Save the PDF
  doc.save(`project-quote-${project.name.replace(/\s+/g, '-')}.pdf`);
};

// Export nesting result as SVG
export const exportNestingSVG = (result: NestingResult) => {
  // Create SVG content
  let svg = `<svg width="${result.sheetSize.length}" height="${result.sheetSize.width}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Add sheet background
  svg += `<rect width="${result.sheetSize.length}" height="${result.sheetSize.width}" fill="white" stroke="black" stroke-width="2"/>`;
  
  // Add parts
  result.parts.forEach((part, index) => {
    // Apply rotation transform if needed
    const transform = part.rotation ? `transform="rotate(${part.rotation} ${part.x + part.length/2} ${part.y + part.width/2})"` : '';
    
    svg += `<g ${transform}>`;
    svg += `<rect x="${part.x}" y="${part.y}" width="${part.length}" height="${part.width}" fill="#BBDEFB" stroke="#1E88E5" stroke-width="1"/>`;
    svg += `<text x="${part.x + part.length/2}" y="${part.y + part.width/2}" font-family="Arial" font-size="12" text-anchor="middle" dominant-baseline="middle">${index + 1}</text>`;
    svg += `</g>`;
  });
  
  // Add legend
  svg += `<text x="10" y="${result.sheetSize.width + 20}" font-family="Arial" font-size="14" font-weight="bold">${result.materialType} - ${result.thickness}mm</text>`;
  svg += `<text x="10" y="${result.sheetSize.width + 40}" font-family="Arial" font-size="12">Efficiency: ${result.efficiency.toFixed(1)}%</text>`;
  svg += `<text x="10" y="${result.sheetSize.width + 60}" font-family="Arial" font-size="12">Sheet size: ${result.sheetSize.length} × ${result.sheetSize.width}mm</text>`;
  
  svg += `</svg>`;
  
  // Download SVG file
  downloadFile(svg, `nesting-${result.materialType}-${result.thickness}mm.svg`, 'image/svg+xml');
};

// Export nesting result as DXF
export const exportNestingDXF = (result: NestingResult) => {
  // Create a simplified DXF file
  let dxf = '0\nSECTION\n2\nENTITIES\n';
  
  // Add parts as rectangles
  result.parts.forEach((part) => {
    // For each part, create a rectangle
    dxf += `0\nPOLYLINE\n8\n${result.materialType}\n66\n1\n70\n1\n`;
    dxf += `0\nVERTEX\n8\n${result.materialType}\n10\n${part.x}\n20\n${part.y}\n`;
    dxf += `0\nVERTEX\n8\n${result.materialType}\n10\n${part.x + part.length}\n20\n${part.y}\n`;
    dxf += `0\nVERTEX\n8\n${result.materialType}\n10\n${part.x + part.length}\n20\n${part.y + part.width}\n`;
    dxf += `0\nVERTEX\n8\n${result.materialType}\n10\n${part.x}\n20\n${part.y + part.width}\n`;
    dxf += `0\nVERTEX\n8\n${result.materialType}\n10\n${part.x}\n20\n${part.y}\n`;
    dxf += `0\nSEQEND\n`;
    
    // Add part number as text
    dxf += `0\nTEXT\n8\n${result.materialType}\n10\n${part.x + part.length/2}\n20\n${part.y + part.width/2}\n40\n10\n1\nPart ${part.id.slice(-4)}\n`;
  });
  
  // Add sheet outline
  dxf += `0\nPOLYLINE\n8\nSheet\n66\n1\n70\n1\n`;
  dxf += `0\nVERTEX\n8\nSheet\n10\n0\n20\n0\n`;
  dxf += `0\nVERTEX\n8\nSheet\n10\n${result.sheetSize.length}\n20\n0\n`;
  dxf += `0\nVERTEX\n8\nSheet\n10\n${result.sheetSize.length}\n20\n${result.sheetSize.width}\n`;
  dxf += `0\nVERTEX\n8\nSheet\n10\n0\n20\n${result.sheetSize.width}\n`;
  dxf += `0\nVERTEX\n8\nSheet\n10\n0\n20\n0\n`;
  dxf += `0\nSEQEND\n`;
  
  dxf += '0\nENDSEC\n0\nEOF\n';
  
  // Download DXF file
  downloadFile(dxf, `nesting-${result.materialType}-${result.thickness}mm.dxf`, 'application/dxf');
};