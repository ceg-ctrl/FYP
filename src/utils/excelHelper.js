import * as XLSX from 'xlsx';

// Export Function
export const exportToExcel = (data, fileName = 'my_portfolio.xlsx') => {
  // Format data for cleaner Excel columns
  const formattedData = data.map(item => ({
    Bank: item.bankName,
    Principal: item.principal,
    Rate: item.interestRate,
    'Start Date': item.startDate,
    'Maturity Date': item.maturityDate,
    Status: item.status
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Portfolio");
  XLSX.writeFile(workbook, fileName);
};

// Import Function
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        // Map Excel columns back to Firestore schema
        // This makes it flexible if users name columns slightly differently
        const parsedData = jsonData.map(row => ({
          bankName: row['Bank'] || row['bankName'] || row['Bank Name'] || '',
          principal: row['Principal'] || row['principal'] || 0,
          interestRate: row['Rate'] || row['interestRate'] || row['Interest Rate'] || 0,
          startDate: row['Start Date'] || row['startDate'] || '',
          maturityDate: row['Maturity Date'] || row['maturityDate'] || '',
          status: 'active' // Default to active on import
        })).filter(item => item.bankName && item.principal); // Basic validation

        resolve(parsedData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};