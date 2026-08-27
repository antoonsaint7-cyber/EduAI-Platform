function normalizeStudentRow(row = {}) {
  const email = String(row.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('valid email is required');
  return { name: String(row.name || '').trim(), email, externalId: row.externalId ? String(row.externalId).trim() : null };
}
function validateBulkRows(rows = []) { if (!Array.isArray(rows)) throw new Error('rows must be an array'); return rows.map(normalizeStudentRow); }
function buildExportEnvelope(rows = [], format = 'json') { if (!['json', 'csv', 'xlsx', 'pdf'].includes(format)) throw new Error('unsupported export format'); return { format, count: rows.length, rows }; }
module.exports = { normalizeStudentRow, validateBulkRows, buildExportEnvelope };
