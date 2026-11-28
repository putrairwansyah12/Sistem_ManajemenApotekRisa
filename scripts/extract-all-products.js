const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = 'D:\\sistem apotek risa\\DAFTAR HARGA.pdf';

function parseNumber(str) {
  if (!str) return 0;
  const cleaned = str.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

async function runFullExtraction() {
  console.log('Starting full PDF extraction...');
  const startTime = Date.now();
  const dataBuffer = fs.readFileSync(pdfPath);

  const allProducts = [];
  let pendingPreviousRow = null;

  function pagerender(pageData) {
    return pageData.getTextContent().then(function(textContent) {
      const pageNum = pageData.pageIndex + 1;
      
      const items = textContent.items
        .filter(it => it.str && it.str.trim() !== '')
        .map(it => ({
          str: it.str.trim(),
          x: Math.round(it.transform[4]),
          y: Math.round(it.transform[5])
        }));

      // Find header Y
      const headerItem = items.find(it => it.str === 'Harga Jual' && it.x >= 550 && it.x <= 580);
      const headerY = headerItem ? headerItem.y : 580;

      // Filter content items
      const contentItems = items.filter(it => {
        if (it.y <= 25) return false;
        if (it.y >= headerY) {
          return pageNum > 1 && it.y > headerY && it.x < 285;
        }
        return true;
      });

      // Find row anchors
      const rowAnchors = contentItems
        .filter(it => it.y < headerY && it.x >= 425 && it.x <= 455)
        .map(it => it.y);

      rowAnchors.sort((a, b) => b - a);

      // Handle top overflow from previous page
      if (pageNum > 1 && pendingPreviousRow && rowAnchors.length > 0) {
        const topOverflow = contentItems.filter(it => it.y > rowAnchors[0] + 5);
        for (const it of topOverflow) {
          if (it.x >= 155 && it.x < 285) {
            pendingPreviousRow.namaItem += ' ' + it.str;
          } else if (it.x >= 15 && it.x < 85) {
            pendingPreviousRow.kodeItem += ' ' + it.str;
          }
        }
      }

      for (let i = 0; i < rowAnchors.length; i++) {
        const anchorY = rowAnchors[i];
        const nextAnchorY = i + 1 < rowAnchors.length ? rowAnchors[i + 1] : 25;

        const rowItems = contentItems.filter(it => it.y <= anchorY + 5 && it.y > nextAnchorY + 5);

        let kodeItemParts = [];
        let barcodeParts = [];
        let namaParts = [];
        let jenisParts = [];
        let merekParts = [];
        let stokStr = '';
        let satuanStr = '';
        let hargaBeliStr = '';
        let hargaJualStr = '';
        let stokMinStr = '';

        rowItems.sort((a, b) => b.y - a.y || a.x - b.x);

        for (const it of rowItems) {
          if (it.x >= 15 && it.x < 85) {
            kodeItemParts.push(it.str);
          } else if (it.x >= 85 && it.x < 155) {
            barcodeParts.push(it.str);
          } else if (it.x >= 155 && it.x < 285) {
            namaParts.push(it.str);
          } else if (it.x >= 285 && it.x < 335) {
            jenisParts.push(it.str);
          } else if (it.x >= 335 && it.x < 390) {
            merekParts.push(it.str);
          } else if (it.x >= 390 && it.x < 425) {
            stokStr = it.str;
          } else if (it.x >= 425 && it.x < 485) {
            satuanStr = it.str;
          } else if (it.x >= 485 && it.x < 555) {
            hargaBeliStr = it.str;
          } else if (it.x >= 555 && it.x < 605) {
            hargaJualStr = it.str;
          } else if (it.x >= 605 && it.x < 650) {
            stokMinStr = it.str;
          }
        }

        const product = {
          page: pageNum,
          kodeItem: kodeItemParts.join(' ').trim(),
          barcode: barcodeParts.join('').trim(),
          namaItem: namaParts.join(' ').trim() || kodeItemParts.join(' ').trim(),
          jenis: jenisParts.join(' ').trim() || 'OBAT',
          merek: merekParts.join(' ').trim(),
          satuan: satuanStr.trim() || 'PCS',
          stok: parseNumber(stokStr),
          hargaBeli: parseNumber(hargaBeliStr),
          hargaJual: parseNumber(hargaJualStr),
          stokMin: parseNumber(stokMinStr)
        };

        allProducts.push(product);
        if (i === rowAnchors.length - 1) {
          pendingPreviousRow = product;
        }
      }

      if (pageNum % 50 === 0 || pageNum === 255) {
        console.log(`Page ${pageNum}/255 processed (${allProducts.length} items so far)...`);
      }

      return "";
    });
  }

  const result = await pdf(dataBuffer, { pagerender });
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Finished full extraction in ${duration}s. Total items extracted: ${allProducts.length}`);

  // Check unique barcodes, names, categories, units
  const barcodeMap = new Map();
  const nameMap = new Map();
  const categories = new Set();
  const units = new Set();

  let dupBarcodes = 0;
  let dupNames = 0;

  for (const p of allProducts) {
    if (p.barcode) {
      if (barcodeMap.has(p.barcode)) dupBarcodes++;
      else barcodeMap.set(p.barcode, p);
    }
    if (nameMap.has(p.namaItem)) dupNames++;
    else nameMap.set(p.namaItem, p);

    categories.add(p.jenis);
    units.add(p.satuan);
  }

  console.log(`Unique barcodes: ${barcodeMap.size} (duplicates: ${dupBarcodes})`);
  console.log(`Unique names: ${nameMap.size} (duplicates: ${dupNames})`);
  console.log(`Unique categories (${categories.size}):`, Array.from(categories).slice(0, 20));
  console.log(`Unique units (${units.size}):`, Array.from(units).slice(0, 20));

  fs.writeFileSync('D:\\sistem apotek risa\\extracted_products.json', JSON.stringify(allProducts, null, 2));
  console.log('Saved to D:\\sistem apotek risa\\extracted_products.json');
}

runFullExtraction().catch(console.error);
