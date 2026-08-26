import { parse } from 'node:querystring';

export function normalizeStudentRow(row = {}) {
  const email = String(row.email ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) throw new Error('valid email is required');
  return { name: String(row.name ?? '').trim(), email, externalId: row.externalId ? String(row.externalId).trim() : null };
}

export function validateBulkRows(rows = []) {
  if (!Array.isArray(rows)) throw new Error('rows must be an array');
  return rows.map(normalizeStudentRow);
}

export function buildExportEnvelope(rows = [], format = 'json') {
  if (!['json', 'csv', 'xlsx', 'pdf'].includes(format)) throw new Error('unsupported export format');
  return { format, count: rows.length, rows };
}
