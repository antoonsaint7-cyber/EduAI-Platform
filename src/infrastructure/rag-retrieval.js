const { Pool } = require('pg');

function toVectorLiteral(values) {
  if (!Array.isArray(values) || values.length !== 1536 || values.some((v) => !Number.isFinite(v))) {
    throw new Error('Embedding must contain exactly 1536 finite numeric values.');
  }
  return `[${values.join(',')}]`;
}

async function retrieveRelevantChunks({ pool, tenantId, embedding, limit = 5 }) {
  if (!pool || typeof pool.query !== 'function') throw new Error('PostgreSQL pool is required.');
  if (!tenantId) throw new Error('tenantId is required.');
  const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 20);
  const vector = toVectorLiteral(embedding);
  const { rows } = await pool.query(
    `SELECT id, document_id, chunk_index, content, source_title, object_key, checksum,
            1 - (embedding <=> $1::vector) AS similarity
       FROM knowledge_chunks
      WHERE tenant_id = $2
      ORDER BY embedding <=> $1::vector
      LIMIT $3`,
    [vector, tenantId, safeLimit]
  );
  return rows;
}

module.exports = { toVectorLiteral, retrieveRelevantChunks };
