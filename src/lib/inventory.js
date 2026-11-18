export function getStockAvailability(productStock, batches, now = new Date()) {
  if (!Number.isInteger(productStock) || productStock < 0 || !Array.isArray(batches)) {
    throw new TypeError("Data stok produk tidak valid.");
  }
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);

  let recordedBatchStock = 0;
  let sellableBatchStock = 0;
  for (const batch of batches) {
    if (!batch || typeof batch !== "object" || !Number.isInteger(batch.jumlah) || batch.jumlah < 0) {
      throw new TypeError("Jumlah batch tidak valid.");
    }
    const expiry = new Date(batch.tanggalKedaluwarsa);
    if (Number.isNaN(expiry.getTime())) throw new TypeError("Tanggal kedaluwarsa batch tidak valid.");
    recordedBatchStock += batch.jumlah;
    if (batch.jumlah > 0 && expiry >= today) sellableBatchStock += batch.jumlah;
  }

  const unbatchedStock = productStock - recordedBatchStock;
  if (unbatchedStock < 0) throw new RangeError("Jumlah batch melebihi stok produk. Lakukan stock opname batch.");

  return {
    unbatchedStock,
    sellableBatchStock,
    sellableStock: unbatchedStock + sellableBatchStock,
  };
}
