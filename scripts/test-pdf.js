const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfPath = 'D:\\sistem apotek risa\\DAFTAR HARGA.pdf';

async function testPdf() {
  const dataBuffer = fs.readFileSync(pdfPath);
  
  // Custom pager to only extract first 2 pages
  let pageCount = 0;
  const options = {
    max: 3,
  };

  const data = await pdf(dataBuffer, options);
  console.log('Total pages in doc:', data.numpages);
  console.log('Extracted text sample (first 2000 chars):');
  console.log(data.text.slice(0, 2000));
}

testPdf().catch(console.error);
