const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = 'D:\\sistem apotek risa\\DAFTAR HARGA.pdf';

async function testPageItems() {
  const dataBuffer = fs.readFileSync(pdfPath);

  function pagerender(pageData) {
    return pageData.getTextContent().then(function(textContent) {
      if (pageData.pageIndex === 1) { // Page 2
        console.log(`=== Page ${pageData.pageIndex + 1} ===`);
        const items = textContent.items
          .filter(it => it.str.trim() !== '')
          .map(it => ({
            str: it.str.trim(),
            x: Math.round(it.transform[4]),
            y: Math.round(it.transform[5])
          }));
        
        items.sort((a, b) => b.y - a.y || a.x - b.x);
        for (const it of items) {
          console.log(`y=${it.y}, x=${it.x}: "${it.str}"`);
        }
      }
      return "";
    });
  }

  await pdf(dataBuffer, { pagerender, max: 2 });
}

testPageItems().catch(console.error);
