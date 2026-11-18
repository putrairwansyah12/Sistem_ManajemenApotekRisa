function amount(value, label) {
  if ((typeof value !== "number" && typeof value !== "string") || (typeof value === "string" && !value.trim())) {
    throw new TypeError(`${label} wajib berupa angka.`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 9999999999.99) {
    throw new RangeError(`${label} harus bernilai nol atau lebih.`);
  }
  return parsed;
}

function percentage(value, label) {
  const parsed = amount(value, label);
  if (Math.abs(parsed * 100 - Math.round(parsed * 100)) > 1e-8) {
    throw new RangeError(`${label} maksimal dua angka desimal.`);
  }
  return parsed;
}

export function getCalculatorHpp(product) {
  const hpp = Number(product?.hpp);
  if (Number.isFinite(hpp) && hpp > 0) return { value: hpp, source: "hpp" };

  const hargaBeli = Number(product?.hargaBeli);
  if (Number.isFinite(hargaBeli) && hargaBeli >= 0) return { value: hargaBeli, source: "hargaBeli" };

  return { value: 0, source: "hpp" };
}

export function calculatePrice(input) {
  const hpp = amount(input.hpp, "HPP");
  const biayaPengemasan = amount(input.biayaPengemasan, "Biaya pengemasan");
  const biayaLayanan = amount(input.biayaLayanan, "Biaya layanan");
  const biayaGratisOngkir = amount(input.biayaGratisOngkir ?? 0, "Biaya gratis ongkir");
  const persenBiayaAdmin = percentage(input.persenBiayaAdmin, "Persentase biaya admin");
  const persenPajak = percentage(input.persenPajak ?? 0, "Persentase pajak");
  const persenTargetLaba = percentage(input.persenTargetLaba, "Persentase target laba");
  const denominator = 1 - (persenBiayaAdmin + persenPajak + persenTargetLaba) / 100;

  if (denominator <= 0) {
    throw new RangeError("Jumlah biaya admin, pajak, dan target laba harus kurang dari 100%.");
  }

  const hargaJual = Math.ceil((hpp + biayaPengemasan + biayaLayanan + biayaGratisOngkir) / denominator);
  if (!Number.isSafeInteger(hargaJual) || hargaJual > 9999999999.99) {
    throw new RangeError("Hasil harga jual melebihi batas database.");
  }
  const labaKotor = Number((hargaJual - hpp).toFixed(2));
  const labaBersih = Number((
    labaKotor - (hargaJual * persenBiayaAdmin / 100) - (hargaJual * persenPajak / 100)
      - biayaPengemasan - biayaLayanan - biayaGratisOngkir
  ).toFixed(2));

  return {
    hpp,
    persenBiayaAdmin,
    persenPajak,
    biayaPengemasan,
    biayaLayanan,
    biayaGratisOngkir,
    persenTargetLaba,
    hargaJual,
    labaKotor,
    labaBersih,
  };
}
