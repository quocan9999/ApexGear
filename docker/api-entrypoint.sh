#!/bin/sh
set -eu

echo 'Applying database migrations...'
npx prisma migrate deploy --schema prisma/schema.prisma

echo 'Seeding demo accounts...'
DEMO_SNAPSHOT=1 npx prisma db seed

echo 'Restoring selected demo snapshot...'
npm run seed:snapshot

echo 'Database bootstrap complete. You can now start the dev servers.'
