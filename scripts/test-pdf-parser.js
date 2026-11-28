const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = 'D:\\sistem apotek risa\\DAFTAR HARGA.pdf';

function parseNumber(str) {
  if (!str) return 0;
  // Indonesian number: e.g. 14.500,00 or -7,00 or 10.097,67
  const cleaned = str.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

async function testParser() {
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

      // Find header Y (usually around 472 on page 1, 571 on later pages)
      const headerItem = items.find(it => it.str === 'Harga Jual' && it.x >= 550 && it.x <= 580);
      const headerY = headerItem ? headerItem.y : 580;

      // Filter out page footer
      const contentItems = items.filter(it => {
        if (it.y <= 25) return false; // footer like "18/11/2026 20:37"
        if (it.y >= headerY) {
          // If above header, it could be header or overflow on page > 1
          return pageNum > 1 && it.y > headerY && it.x < 285;
        }
        return true;
      });

      // Anchor lines: lines with Satuan or Harga Jual below header
      // Notice Satuan is at 425 <= x <= 455, or Harga Jual at 555 <= x <= 605
      const rowAnchors = contentItems
        .filter(it => it.y < headerY && it.x >= 425 && it.x <= 455)
        .map(it => it.y);

      // Sort anchors descending
      rowAnchors.sort((a, b) => b - a);

      // If page > 1, any items with y > rowAnchors[0] + 5 might belong to pendingPreviousRow or overflow
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

      // Now slice items for each anchor
      for (let i = 0; i < rowAnchors.length; i++) {
        const anchorY = rowAnchors[i];
        const nextAnchorY = i + 1 < rowAnchors.length ? rowAnchors[i + 1] : 25;

        // items belonging to this row are those with y <= anchorY + 5 and y > nextAnchorY + 5
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

        // Sort row items descending by Y, then ascending by X
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
          namaItem: namaParts.join(' ').trim(),
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

      return "";
    });
  }

  await pdf(dataBuffer, { pagerender, max: 10 });
  console.log(`Parsed ${allProducts.length} products across 10 pages.`);
  console.log('Sample parsed products:');
  console.log(JSON.stringify(allProducts.slice(0, 5), null, 2));
  console.log('Last parsed product:');
  console.log(JSON.stringify(allProducts[allProducts.length - 1], null, 2));
}

testParser().catch(console.error);
