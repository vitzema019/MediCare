export function formatDate(date: Date) {
  return date.toISOString().substring(0, 10);
}

export function formatDateTime(date: Date) {
  return date.toISOString().substring(0, 16);
}
