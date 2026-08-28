export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

export function stringifyTechnologies(arr: string[] | string): string {
  if (Array.isArray(arr)) return JSON.stringify(arr);
  return JSON.stringify(String(arr || '').split(',').map((s) => s.trim()).filter(Boolean));
}
