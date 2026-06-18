export function yearOf(dateStr) {
  return dateStr.slice(0, 4);
}

export function monthOf(dateStr) {
  return dateStr.slice(0, 7); // YYYY-MM
}

export function isValidDateStr(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

export function isValidMonthStr(monthStr) {
  return /^\d{4}-\d{2}$/.test(monthStr);
}
