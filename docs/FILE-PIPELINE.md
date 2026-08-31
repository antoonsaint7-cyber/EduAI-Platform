# Production File Processing Pipeline

The production ingestion contract is:

`Upload -> validation -> malware scan -> private object storage -> extraction -> chunking -> embeddings -> PostgreSQL/pgvector -> RAG worker`

## Security boundary

- Accept only PDF, DOCX and PPTX with matching MIME type and extension.
- Enforce `UPLOAD_MAX_BYTES` (25 MiB by default).
- Reject production uploads when no malware scanner is configured unless `ALLOW_UNSCANNED_UPLOADS=true` is explicitly set.
- Store source files in private S3-compatible object storage, never in the application container filesystem.
- Use short-lived signed URLs for access and keep object keys tenant-scoped.
- Never expose OpenAI or storage credentials to browser clients.

## Current implementation

`src/infrastructure/file-pipeline.js` provides the secure ingestion contract, checksum generation and RAG enqueue boundary. Existing RAG processing already chunks extracted text, creates embeddings and persists knowledge chunks. The extractor and S3/ClamAV adapters remain deployment-specific integration points so provider credentials and native binaries are not baked into the application core.

## Required production adapters

1. S3-compatible object storage adapter: multipart upload, private bucket, server-side encryption and signed URLs.
2. ClamAV or managed malware-scanning adapter: fail closed when unavailable.
3. PDF/DOCX/PPTX extraction adapter with page/slide metadata preserved where available.
4. Queue worker consuming `eduai-rag` jobs.
5. PostgreSQL with pgvector for vector persistence.

## Operational controls

- Idempotency key: tenant + document ID + SHA-256 checksum.
- Retry transient extraction, storage and embedding failures with bounded exponential backoff.
- Dead-letter/failed-job monitoring for the RAG queue.
- Log metadata only; never log document contents or secrets.
- Apply tenant authorization before every object and document operation.
