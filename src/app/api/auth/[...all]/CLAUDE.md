# Auth API Route — Better Auth Catch-All

## Database & Auth

- **No-config local dev**: leave `DATABASE_URL` and `BETTER_AUTH_SECRET` blank → SQLite fallback in `.data/local-auth.db` with auto-migration
- **Supabase**: use the **transaction pooler** URL (port 6543) from Dashboard → Settings → Database. Region prefix varies — copy exactly from dashboard
- **Email verification**: skipped when `RESEND_API_KEY` is not set. Manual verify in Supabase: `UPDATE "user" SET "emailVerified" = true WHERE email = '...'`
- **Organizations**: require Postgres (not SQLite) — set both `ENABLE_ORGANIZATIONS` and `NEXT_PUBLIC_ENABLE_ORGANIZATIONS` to `true`
- **Google Sign-In**: set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`. Create OAuth credentials at Google Cloud Console → OAuth 2.0 Client ID (Web app). Add `http://localhost:3000/api/auth/callback/google` as redirect URI. The Google button auto-appears on the login page when both env vars are set.
