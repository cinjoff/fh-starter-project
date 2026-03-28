#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Checking prerequisites..."

# Check Docker
if ! docker info >/dev/null 2>&1; then
  echo ""
  echo "ERROR: Docker is not running or not installed."
  echo "  macOS: Install OrbStack (https://orbstack.dev) or Docker Desktop (https://www.docker.com/products/docker-desktop)"
  echo "  Then start it and re-run this script."
  exit 1
fi

# Check Supabase CLI
if ! command -v supabase >/dev/null 2>&1; then
  echo ""
  echo "ERROR: Supabase CLI not found."
  echo "  Install it with: brew install supabase/tap/supabase"
  echo "  Then re-run this script."
  exit 1
fi

echo "==> Starting Supabase..."
cd "$REPO_ROOT"
supabase start

echo "==> Setting up .env.local..."
ENV_FILE="$REPO_ROOT/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<'EOF'
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
BETTER_AUTH_SECRET=local-dev-secret-minimum-32-characters-long!!
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
  echo "    Created .env.local"
else
  echo "    .env.local already exists — skipping"
fi

echo "==> Installing dependencies..."
if [ ! -d "$REPO_ROOT/node_modules" ]; then
  cd "$REPO_ROOT"
  pnpm install
else
  echo "    node_modules already present — skipping"
fi

echo "==> Seeding database..."
cd "$REPO_ROOT"
npx tsx scripts/seed.ts

echo ""
echo "============================================"
echo " Setup complete!"
echo " Start the dev server with: pnpm dev"
echo "============================================"
