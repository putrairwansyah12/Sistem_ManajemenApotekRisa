const fs = require('fs');

const products = JSON.parse(fs.readFileSync('D:\\sistem apotek risa\\extracted_products.json', 'utf8'));

let gt0 = 0;
let eq0 = 0;
let lt0 = 0;

for (const p of products) {
  if (p.stok > 0) gt0++;
  else if (p.stok === 0) eq0++;
  else lt0++;
}

console.log(`Total in PDF: ${products.length}`);
console.log(`PDF stok > 0: ${gt0}`);
console.log(`PDF stok === 0: ${eq0}`);
console.log(`PDF stok < 0: ${lt0}`);
