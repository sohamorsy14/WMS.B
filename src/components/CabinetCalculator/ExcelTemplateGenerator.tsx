import React from 'react';
import { Download } from 'lucide-react';
import { utils, write } from 'xlsx';

const ExcelTemplateGenerator: React.FC = () => {
  const generateExcelTemplate = () => {
    // Create workbook
    const wb = utils.book_new();
    
    // Create headers for the template
    const headers = [
      'Part Name', 
      'Length (mm)', 
      'Width (mm)', 
      'Thickness (mm)', 
      'Quantity', 
      'Material Type', 
      'Grain Direction',
      'Edge Front',
      'Edge Back',
      'Edge Left',
      'Edge Right',
      'Priority'
    ];
    
    // Create sample data
    const sampleData = [
      ['Side Panel', 720, 560, 18, 2, 'Plywood', 'length', true, false, true, true, 1],
      ['Bottom Panel', 568, 560, 18, 1, 'Plywood', 'length', true, false, true, true, 1],
      ['Top Panel', 568, 560, 18, 1, 'Plywood', 'length', true, false, true, true, 1],
      ['Back Panel', 720, 568, 12, 1, 'Plywood', 'none', false, false, false, false, 2],
      ['Shelf', 568, 540, 18, 2, 'Plywood', 'length', true, false, true, true, 2],
      ['Door', 720, 300, 18, 2, 'Melamine', 'length', true, true, true, true, 3]
    ];
    
    // Create worksheet with headers and sample data
    const ws = utils.aoa_to_sheet([headers, ...sampleData]);
    
    // Add column widths
    const colWidths = [
      { wch: 20 }, // Part Name
      { wch: 12 }, // Length
      { wch: 12 }, // Width
      { wch: 12 }, // Thickness
      { wch: 10 }, // Quantity
      { wch: 15 }, // Material Type
      { wch: 15 }, // Grain Direction
      { wch: 10 }, // Edge Front
      { wch: 10 }, // Edge Back
      { wch: 10 }, // Edge Left
      { wch: 10 }, // Edge Right
      { wch: 10 }  // Priority
    ];
    
    ws['!cols'] = colWidths;
    
    // Add the worksheet to the workbook
    utils.book_append_sheet(wb, ws, "Cutting List Template");
    
    // Create a second sheet with instructions
    const instructionsData = [
      ['Cutting List Template Instructions'],
      [''],
      ['Column', 'Description', 'Required', 'Format/Values'],
      ['Part Name', 'Name or description of the part', 'Yes', 'Text (e.g., "Side Panel", "Shelf")'],
      ['Length (mm)', 'Length of the part in millimeters', 'Yes', 'Number (e.g., 800)'],
      ['Width (mm)', 'Width of the part in millimeters', 'Yes', 'Number (e.g., 600)'],
      ['Thickness (mm)', 'Thickness of the part in millimeters', 'Yes', 'Number (e.g., 18)'],
      ['Quantity', 'Number of identical parts needed', 'Yes', 'Number (e.g., 2)'],
      ['Material Type', 'Type of material for the part', 'No', 'Text (e.g., "Plywood", "MDF", "Melamine")'],
      ['Grain Direction', 'Direction of wood grain', 'No', '"length", "width", or "none"'],
      ['Edge Front', 'Edge banding on front edge', 'No', 'TRUE or FALSE'],
      ['Edge Back', 'Edge banding on back edge', 'No', 'TRUE or FALSE'],
      ['Edge Left', 'Edge banding on left edge', 'No', 'TRUE or FALSE'],
      ['Edge Right', 'Edge banding on right edge', 'No', 'TRUE or FALSE'],
      ['Priority', 'Cutting priority (lower numbers cut first)', 'No', 'Number (e.g., 1, 2, 3)'],
      [''],
      ['Notes:'],
      ['1. The first row contains column headers and should not be modified.'],
      ['2. You can add as many rows as needed for your cutting list.'],
      ['3. Save the file as .xlsx or .csv before importing.'],
      ['4. For CSV export, make sure to use comma as the delimiter.'],
      ['5. The system will try to detect the columns even if they are in a different order.']
    ];
    
    const wsInstructions = utils.aoa_to_sheet(instructionsData);
    
    // Set column widths for instructions
    wsInstructions['!cols'] = [
      { wch: 15 }, // Column
      { wch: 40 }, // Description
      { wch: 10 }, // Required
      { wch: 40 }  // Format/Values
    ];
    
    // Add some formatting to the instructions sheet
    wsInstructions['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } } // Merge the title cell across all columns
    ];
    
    // Add the instructions worksheet to the workbook
    utils.book_append_sheet(wb, wsInstructions, "Instructions");
    
    // Generate the Excel file and trigger download
    const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create download link and trigger click
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Cutting_List_Template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={generateExcelTemplate}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
    >
      <Download className="w-4 h-4 mr-2" />
      Download Excel Template
    </button>
  );
};

export default ExcelTemplateGenerator;