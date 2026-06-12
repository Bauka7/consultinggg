#!/bin/sh
set -e

echo "→ Applying database migrations (prisma migrate deploy)..."
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "→ Seeding database..."
  npx ts-node prisma/seed.ts || echo "  (seed skipped or already applied)"
fi

echo "→ Starting Tradewind API..."
exec node dist/main
