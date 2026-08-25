#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_DIR:=./backups}"
mkdir -p "$BACKUP_DIR"
ts=$(date -u +%Y%m%dT%H%M%SZ)
out="$BACKUP_DIR/educational-platform-$ts.dump"
pg_dump "$DATABASE_URL" --format=custom --no-owner --file="$out"
sha256sum "$out" > "$out.sha256"
echo "Created $out"
