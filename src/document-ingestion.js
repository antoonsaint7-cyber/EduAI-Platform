const crypto = require('node:crypto');

function normalizeText(text) {
  return String(text || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function chunkText(text, { chunkSize = 1200, overlap = 180 } = {}) {
  const clean = normalizeText(text);
  if (!clean) return [];
  const size = Math.max(200, Number(chunkSize));
  const step = Math.max(1, size - Math.max(0, Number(overlap)));
  const chunks = [];
  for (let start = 0; start < clean.length; start += step) {
    const content = clean.slice(start, start + size).trim();
    if (!content) break;
    chunks.push({ index: chunks.length, content, content_hash: crypto.createHash('sha256').update(content).digest('hex') });
    if (start + size >= clean.length) break;
  }
  return chunks;
}

function buildMetadata({ tenantId, schoolId, courseId, lessonId, source, page, language, chunkIndex }) {
  return { tenant_id: tenantId || null, school_id: schoolId || null, course_id: courseId || null, lesson_id: lessonId || null, source: source || null, page: Number.isFinite(Number(page)) ? Number(page) : null, language: language || null, chunk_index: chunkIndex };
}

function makeCitation(metadata) {
  return { source: metadata.source || 'unknown', page: metadata.page, chunk_index: metadata.chunk_index };
}

module.exports = { normalizeText, chunkText, buildMetadata, makeCitation };
