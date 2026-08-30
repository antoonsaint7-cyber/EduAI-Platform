'use strict';

const OpenAI = require('openai');
const { query } = require('../db');

const DEFAULT_CHUNK_SIZE = 1200;
const DEFAULT_CHUNK_OVERLAP = 150;
const EMBEDDING_DIMENSIONS = 1536;

function chunkText(text, size = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_CHUNK_OVERLAP) {
  const value = String(text || '').trim();
  if (!value) return [];
  const chunkSize = Math.max(100, Number(size) || DEFAULT_CHUNK_SIZE);
  const chunkOverlap = Math.max(0, Math.min(chunkSize - 1, Number(overlap) || DEFAULT_CHUNK_OVERLAP));
  const chunks = [];
  for (let start = 0; start < value.length; start += chunkSize - chunkOverlap) {
    const content = value.slice(start, start + chunkSize).trim();
    if (content) chunks.push(content);
    if (start + chunkSize >= value.length) break;
  }
  return chunks;
}

function embeddingLiteral(values) {
  if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS || values.some((value) => !Number.isFinite(value))) {
    throw new Error(`Embedding must contain exactly ${EMBEDDING_DIMENSIONS} finite numeric values.`);
  }
  return `[${values.join(',')}]`;
}

function createProductionProcessor({ dbQuery = query, embeddingsClient, embeddingModel = process.env.RAG_EMBEDDING_MODEL || 'text-embedding-3-small' } = {}) {
  const client = embeddingsClient || (process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null);
  return async function processDocument(data = {}) {
    const tenantId = String(data.tenant_id || data.tenantId || '');
    const documentId = String(data.document_id || data.documentId || '');
    const sourceTitle = String(data.source_title || data.sourceTitle || documentId || 'Untitled document');
    const text = String(data.text || data.content || '').trim();
    const page = data.page == null ? null : Number(data.page);
    if (!tenantId || !documentId || !text) throw new Error('RAG job requires tenant_id, document_id and text.');
    if (!client?.embeddings?.create) throw new Error('OPENAI_API_KEY is required for the production RAG processor.');

    const chunks = chunkText(text);
    const embeddingResponse = await client.embeddings.create({ model: embeddingModel, input: chunks });
    const embeddings = embeddingResponse.data || [];
    if (embeddings.length !== chunks.length) throw new Error('Embedding response count did not match chunk count.');

    for (let i = 0; i < chunks.length; i += 1) {
      const embedding = embeddingLiteral(embeddings[i]?.embedding || []);
      await dbQuery(
        `INSERT INTO knowledge_chunks (tenant_id, document_id, source_title, page, chunk_index, content, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7::vector)
         ON CONFLICT (tenant_id, document_id, chunk_index)
         DO UPDATE SET source_title=EXCLUDED.source_title, page=EXCLUDED.page, content=EXCLUDED.content, embedding=EXCLUDED.embedding`,
        [tenantId, documentId, sourceTitle, Number.isInteger(page) ? page : null, i, chunks[i], embedding]
      );
    }

    return { document_id: documentId, chunks: chunks.length };
  };
}

const processDocument = createProductionProcessor();

module.exports = { chunkText, embeddingLiteral, createProductionProcessor, processDocument };
