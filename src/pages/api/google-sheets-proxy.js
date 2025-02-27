import * as XLSX from 'xlsx';

export default async function handler(req, res) {
  try {
    // Get the output format from query parameters, default to XLSX
    const outputFormat = req.query.format || 'xlsx';
    
    // Base URL for the Google Sheet
    const baseUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRL3vhEkFIUjAFoD0kvEr4SNTc_qmSbpgKDSeRFNNPhzFCIzXBjlyPRKasDYAOZqyX_L46fZrUHZe4M/pub';
    
    // Construct URL based on requested format
    const url = `${baseUrl}?output=${outputFormat}`;
    
    console.log(`Fetching data in ${outputFormat.toUpperCase()} format from:`, url);
    
    const response = await fetch(url, {
      // Add headers to mimic a browser request
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': outputFormat === 'xlsx' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          : 'text/csv,text/plain,*/*'
      },
      // Ensure redirects are followed
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    if (outputFormat === 'xlsx') {
      // For XLSX, we need to get the data as an ArrayBuffer
      const buffer = await response.arrayBuffer();
      
      // Parse the XLSX data
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Convert to proper JSON with headers as keys
      const headers = jsonData[0];
      const rows = jsonData.slice(1);
      
      const formattedData = rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });
      
      // Return the JSON data
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      return res.status(200).json({ replies: formattedData });
    } else {
      // For CSV, return the raw text
      const csvText = await response.text();
      
      // Set appropriate headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      return res.status(200).send(csvText);
    }
  } catch (error) {
    console.error('Proxy request failed:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch CSV data',
      details: error.message
    });
  }
}
