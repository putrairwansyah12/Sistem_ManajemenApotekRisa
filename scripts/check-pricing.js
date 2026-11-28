const fs = require('fs');

const products = JSON.parse(fs.readFileSync('D:\\sistem apotek risa\\extracted_products.json', 'utf8'));

let zeroJual = 0;
let zeroBeli = 0;

for (const p of products) {
  if (!p.hargaJual || p.hargaJual === 0) zeroJual++;
  if (!p.hargaBeli || p.hargaBeli === 0) zeroBeli++;
}

console.log(`Total: ${products.length}, Zero hargaJual: ${zeroJual}, Zero hargaBeli: ${zeroBeli}`);
