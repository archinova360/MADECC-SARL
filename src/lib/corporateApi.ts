import { getAuthToken } from './firebase.ts';
import { getCsrfHeaders } from './csrf.ts';

export async function corporateFetch(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  const method = (options.method || 'GET').toUpperCase();
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const csrf = isWrite ? await getCsrfHeaders() : {};

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
    ...csrf,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || `Request failed (${res.status})`);
    }
    return data;
  }

  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }

  return res;
}

export async function downloadCorporateServerExport(moduleName: string, format: 'csv' | 'json') {
  const token = await getAuthToken();
  const res = await fetch(`/api/corporate/export/${moduleName}?format=${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Export failed');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `madecc-${moduleName}-${new Date().toISOString().slice(0, 10)}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportCorporatePdf(title: string, subtitle: string, sections: { heading: string; rows: [string, string][] }[]) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  let y = 18;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(14);
  doc.text('MADECC GROUP — CORPORATE GOVERNANCE BRIEF', 14, 13);
  doc.setTextColor(226, 232, 240);
  doc.setFontSize(9);
  doc.text(`${title} | Generated: ${new Date().toISOString()}`, 14, 21);

  y = 38;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(subtitle, 14, y);
  y += 10;

  for (const sec of sections) {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(10);
    doc.setTextColor(180, 83, 9);
    doc.text(sec.heading.toUpperCase(), 14, y);
    y += 6;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    for (const [label, val] of sec.rows) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      const cleanVal = val && val.trim() ? val : 'Not provided';
      const lines = doc.splitTextToSize(`${label}: ${cleanVal}`, 180);
      doc.text(lines, 14, y);
      y += lines.length * 4.8 + 1.5;
    }
    y += 4;
  }

  doc.save(`madecc-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
}

export async function exportCorporateXlsx(sheetName: string, filename: string, headers: string[], rows: any[][]) {
  const XLSX = await import('xlsx');
  const normalizedRows = rows.map((r) =>
    r.map((cell) => (cell === null || cell === undefined || String(cell).trim() === '' ? 'Not provided' : cell))
  );
  const ws = XLSX.utils.aoa_to_sheet([headers, ...normalizedRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
