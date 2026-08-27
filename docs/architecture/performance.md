# EduAI Performance & Async Architecture

## Request path
The API must stay responsive while expensive AI and document work runs asynchronously.

```text
Client -> API -> validate/auth -> enqueue -> 202 + jobId
                              |
                              v
                         Redis/BullMQ
                              |
                              v
                           Worker
                              |
                 extraction/chunking/embeddings
                              |
                              v
                         vector store
```

## Queues
- `eduai-rag`: document extraction, chunking and embeddings.
- `eduai-assessments`: expensive assessment generation.
- `eduai-email`: notifications and transactional email.

Workers use retries and exponential backoff. Configure `RAG_WORKER_CONCURRENCY` for controlled throughput.

## Redis
Set `REDIS_URL` in production. Redis provides distributed cache, rate-limit counters and BullMQ queue state. The cache/rate-limit helpers have an in-memory fallback for local development only.

## SSE
Use `openSse`, `sendSse` and `streamChunks` from `src/infrastructure/sse.js` for incremental LLM output. Responses are emitted as named SSE events and finish with a `done` event.

## Rate limiting
Use `consumeRateLimit(key, limit, windowSeconds)` at API boundaries. In production the counter is distributed through Redis; do not rely on the memory fallback across multiple replicas.

## Vector strategy
PostgreSQL + `pgvector` remains the default architectural target for tenant-aware embeddings. A future external vector provider can be introduced behind the retrieval adapter without changing application-level APIs.

## Production requirements
- Run API and worker processes separately.
- Use managed Redis with persistence/monitoring appropriate to workload.
- Configure connection pools and queue concurrency from environment variables.
- Apply request timeouts and payload/file-size limits before expensive processing.
- Monitor queue depth, job latency, worker failures, cache hit rate and LLM latency.
