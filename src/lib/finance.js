const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const TRANSACTION_COST_FIELDS = [
  "potongan",
  "biayaAdmin",
  "biayaPajak",
  "biayaPengemasan",
  "biayaLayanan",
  "biayaGratisOngkir",
];
const REPORT_METRICS = [
  "omzet",
  "jumlahTransaksi",
  "jumlahKunjungan",
  "labaKotor",
  "biayaOperasional",
  "labaBersih",
];

export function getJakartaDate(value = new Date()) {
  return new Date(value.getTime() + JAKARTA_OFFSET_MS).toISOString().slice(0, 10);
}

export function parseBusinessDate(value, fallback = new Date()) {
  const date = value ?? getJakartaDate(fallback);
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new RangeError("Tanggal harus menggunakan format YYYY-MM-DD.");
  }
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new RangeError("Tanggal tidak valid.");
  }
  return date;
}

function businessBoundary(date) {
  return new Date(Date.parse(`${date}T00:00:00.000Z`) - JAKARTA_OFFSET_MS);
}

function nextDate(date) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

export function getFinancePeriodRange(period, date) {
  if (!["day", "month", "year"].includes(period)) {
    throw new RangeError("Periode harus day, month, atau year.");
  }
  const selectedDate = parseBusinessDate(date);
  let startDate;
  let endDate;
  if (period === "day") {
    startDate = selectedDate;
    endDate = nextDate(startDate);
  } else if (period === "month") {
    startDate = `${selectedDate.slice(0, 7)}-01`;
    const [year, month] = selectedDate.slice(0, 7).split("-").map(Number);
    endDate = `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}-01`;
  } else {
    startDate = `${selectedDate.slice(0, 4)}-01-01`;
    endDate = `${Number(selectedDate.slice(0, 4)) + 1}-01-01`;
  }

  const bucketPeriod = period === "year" ? "month" : "day";
  const bucketKeys = [];
  if (bucketPeriod === "month") {
    for (let month = 1; month <= 12; month += 1) {
      bucketKeys.push(`${startDate.slice(0, 4)}-${String(month).padStart(2, "0")}`);
    }
  } else {
    for (let cursor = startDate; cursor < endDate; cursor = nextDate(cursor)) {
      bucketKeys.push(cursor);
    }
  }
  return {
    period,
    date: selectedDate,
    startDate,
    endDate,
    start: businessBoundary(startDate),
    end: businessBoundary(endDate),
    bucketPeriod,
    bucketKeys,
  };
}

function amount(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function bucketForDate(value, period) {
  const date = getJakartaDate(value);
  return period === "month" ? date.slice(0, 7) : date;
}

function emptyBucket(key) {
  return {
    periode: key,
    omzet: 0,
    jumlahTransaksi: 0,
    jumlahKunjungan: 0,
    labaKotor: 0,
    biayaOperasional: 0,
    labaBersih: 0,
  };
}

export function calculateFinanceReport(range, transactions, expenses) {
  const buckets = new Map(range.bucketKeys.map((key) => [key, emptyBucket(key)]));

  for (const transaction of transactions) {
    const key = bucketForDate(transaction.tanggal, range.bucketPeriod);
    const bucket = buckets.get(key);
    if (!bucket) continue;

    const omzet = amount(transaction.total);
    const labaKotor = (transaction.detail || []).reduce(
      (sum, line) => sum + (amount(line.hargaSatuan) - amount(line.hppSatuan)) * amount(line.jumlah),
      0,
    );
    const biayaTransaksi = TRANSACTION_COST_FIELDS.reduce(
      (sum, field) => sum + amount(transaction[field]),
      0,
    );

    bucket.omzet += omzet;
    bucket.jumlahTransaksi += 1;
    bucket.jumlahKunjungan += 1;
    bucket.labaKotor += labaKotor;
    bucket.labaBersih += labaKotor - biayaTransaksi;
  }

  for (const expense of expenses) {
    const key = bucketForDate(expense.tanggal, range.bucketPeriod);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    const jumlah = amount(expense.jumlah);
    bucket.biayaOperasional += jumlah;
    bucket.labaBersih -= jumlah;
  }

  const data = [...buckets.values()].map((bucket) => ({
    ...bucket,
    omzet: roundMoney(bucket.omzet),
    labaKotor: roundMoney(bucket.labaKotor),
    biayaOperasional: roundMoney(bucket.biayaOperasional),
    labaBersih: roundMoney(bucket.labaBersih),
  }));
  const summary = Object.fromEntries(
    REPORT_METRICS.map((metric) => [
      metric,
      metric === "jumlahTransaksi" || metric === "jumlahKunjungan"
        ? data.reduce((sum, bucket) => sum + bucket[metric], 0)
        : roundMoney(data.reduce((sum, bucket) => sum + bucket[metric], 0)),
    ]),
  );

  return { ...summary, data };
}
