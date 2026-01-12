import * as XLSX from 'xlsx';

export interface ExcelSheetData {
  name: string;
  data: Record<string, unknown>[];
  headers?: string[];
}

/**
 * Export data to Excel file with multiple sheets
 */
export function exportToExcel(
  sheets: ExcelSheetData[],
  filename: string
): void {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    let worksheet;
    
    if (sheet.headers && sheet.data.length > 0) {
      // If headers are provided, create worksheet with headers
      const dataWithHeaders = [sheet.headers, ...sheet.data.map(row => 
        sheet.headers!.map(header => row[header] ?? '')
      )];
      worksheet = XLSX.utils.aoa_to_sheet(dataWithHeaders);
    } else if (sheet.data.length > 0) {
      // Auto-detect headers from first row
      worksheet = XLSX.utils.json_to_sheet(sheet.data);
    } else {
      // Empty sheet
      worksheet = XLSX.utils.aoa_to_sheet([[]]);
    }

    // Auto-size columns
    const maxWidth = 50;
    const colWidths: { wch: number }[] = [];
    
    if (sheet.data.length > 0) {
      const firstRow = sheet.data[0];
      const keys = Object.keys(firstRow);
      keys.forEach((key) => {
        const headerLength = key.length;
        const maxDataLength = Math.max(
          ...sheet.data.map((row) => {
            const value = row[key];
            return value ? String(value).length : 0;
          })
        );
        colWidths.push({ wch: Math.min(maxWidth, Math.max(headerLength, maxDataLength) + 2) });
      });
    }
    
    if (colWidths.length > 0) {
      worksheet['!cols'] = colWidths;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });

  // Generate Excel file and download
  XLSX.writeFile(workbook, filename);
}

/**
 * Export single sheet to Excel
 */
export function exportSingleSheetToExcel(
  data: any[],
  filename: string,
  sheetName: string = 'Sheet1',
  headers?: string[]
): void {
  exportToExcel([{ name: sheetName, data, headers }], filename);
}

