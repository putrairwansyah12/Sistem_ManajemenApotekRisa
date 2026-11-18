function dayStart(now) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function addMonths(date, months) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export function getExpiryWindow(now = new Date(), months = 6) {
  if (!Number.isInteger(months) || months < 0) throw new RangeError("Jumlah bulan harus bilangan bulat nonnegatif.");
  const start = dayStart(now);
  const end = addMonths(start, months);

  return { start, end };
}

export function getExpiryThresholds(now = new Date()) {
  const { start, end: preventifEnd } = getExpiryWindow(now, 6);
  const returEnd = addMonths(start, 3);
  return { start, returEnd, preventifEnd };
}
