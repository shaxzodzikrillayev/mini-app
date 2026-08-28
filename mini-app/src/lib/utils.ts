export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'по договорённости';
  return `$${value.toLocaleString('en-US')}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function parseTechnologies(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.map(String);
  } catch {
    /* ignore */
  }
  return raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
}
