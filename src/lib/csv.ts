export function escapeCsv(value: string): string {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsv(headers: string[], rows: string[][]): string {
  const lines = [headers.map(escapeCsv).join(',')];
  rows.forEach((row) => lines.push(row.map(escapeCsv).join(',')));
  return lines.join('\n');
}
