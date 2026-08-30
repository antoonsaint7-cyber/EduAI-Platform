-- Phase 4: migrate the existing knowledge_chunks embedding column to pgvector.
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE knowledge_chunks
  ALTER COLUMN embedding TYPE vector(1536)
  USING CASE
    WHEN embedding IS NULL THEN NULL
    ELSE embedding::text::vector
  END;

CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_hnsw_idx
  ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS knowledge_chunks_tenant_document_idx
  ON knowledge_chunks (tenant_id, document_id);
