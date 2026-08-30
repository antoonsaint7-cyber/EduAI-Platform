# Production Infrastructure Baseline

This document defines the production boundary for EduAI Platform. The application container is stateless; persistent state belongs in managed PostgreSQL/pgvector and managed Redis. Secrets must be supplied by the deployment platform or a secret manager.

## Required services

1. **Application**: the `app` service from `docker-compose.production.yml` behind HTTPS/TLS and a reverse proxy or load balancer.
2. **Worker**: one or more `worker` replicas for BullMQ/RAG jobs.
3. **PostgreSQL**: managed PostgreSQL 16+ with pgvector, automated backups, point-in-time recovery where available, encryption at rest, TLS, and restricted network access.
4. **Redis**: managed Redis 7+ with TLS, authentication, persistence appropriate to the queue/cache role, and restricted network access.
5. **Object storage**: S3-compatible storage for uploaded source files and generated artifacts. Do not store uploads on the application container filesystem.
6. **Secret manager**: store OpenAI, database, Redis, billing, and other credentials outside Git and outside images.
7. **Monitoring**: collect application logs, health status, CPU/memory, database connection saturation, Redis health, queue depth, job failures, and HTTP error rates.

## Deployment

```bash
cp .env.production.example .env.production
# Fill values using your secret manager or deployment environment.
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

Do not commit `.env.production`.

## Database requirements

- Enable `pgvector` on the managed PostgreSQL instance.
- Run migrations as a controlled deployment step: `npm run db:migrate`.
- Configure automated backups and test restoration before real student data is introduced.
- Use TLS in production (`DATABASE_SSL=true`).
- Restrict the database to application/worker network identities only.

## Redis requirements

- Use `rediss://` when TLS is enabled.
- Do not expose Redis publicly.
- Monitor BullMQ queue depth and failed jobs.
- Configure persistence according to whether Redis data is disposable cache data or operational queue state.

## Object storage

The production application should use an S3-compatible object store for uploads. Required controls include private buckets, server-side encryption, short-lived signed URLs, lifecycle policies, size/type validation, malware scanning, and retention/deletion policies. Credentials belong in the secret manager.

## Backups and recovery

Back up PostgreSQL automatically and retain backups according to the organization's data-retention policy. Perform a restore drill before launch and periodically afterward. Document RPO/RTO and the recovery owner.

## Network and security

- Terminate HTTPS at a trusted load balancer/reverse proxy.
- Keep PostgreSQL and Redis on private networks.
- Apply least-privilege firewall/security-group rules.
- Run the container as the non-root `node` user.
- Keep secrets out of logs, Git history, Docker images, and client-side code.
- Add rate limiting at the application and edge layers.

## Current implementation boundary

`docker-compose.production.yml` provides the stateless app/worker deployment baseline and requires externally managed PostgreSQL and Redis. It intentionally does not pretend that local Docker volumes are a production backup strategy. Cloud-provider resources, DNS, TLS certificates, secret-manager configuration, object-storage buckets, monitoring, and credentials must be provisioned in the target environment.

## Launch checklist

- [ ] Managed PostgreSQL + pgvector provisioned
- [ ] Automated database backups enabled and restore tested
- [ ] Managed Redis provisioned with TLS/authentication
- [ ] Private networking/firewall rules applied
- [ ] S3-compatible object storage provisioned
- [ ] Malware scanning enabled for uploads
- [ ] Secret manager configured
- [ ] HTTPS/load balancer configured
- [ ] App and worker deployed
- [ ] Migrations executed
- [ ] Monitoring and alerts enabled
- [ ] Queue failure/depth alerts enabled
- [ ] Load/security testing completed
- [ ] RPO/RTO documented
