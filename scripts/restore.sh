#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_FILE:?BACKUP_FILE is required}"
[ -f "$BACKUP_FILE" ] || { echo 'Backup file not found' >&2; exit 1; }
pg_restore "$DATABASE_URL" --clean --if-exists --no-owner "$BACKUP_FILE"
echo "Restored $BACKUP_FILE"
