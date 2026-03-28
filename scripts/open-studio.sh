#!/bin/sh
# Open Supabase Studio — OrbStack-aware
# OrbStack exposes containers via .orb.local domains

if docker context show 2>/dev/null | grep -q orbstack; then
  PROJECT_ID=$(grep 'project_id' supabase/config.toml 2>/dev/null | sed 's/.*= *"\(.*\)"/\1/')
  if [ -n "$PROJECT_ID" ]; then
    URL="http://supabase_studio_${PROJECT_ID}.orb.local"
  else
    URL="http://localhost:54323"
  fi
else
  URL="http://localhost:54323"
fi

echo "Opening Supabase Studio at $URL"
open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || echo "Visit: $URL"
