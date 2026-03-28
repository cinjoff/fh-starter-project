import { CheckCircle, XCircle } from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPool } from "@/lib/db";
import { env } from "@/lib/env";

// ---------------------------------------------------------------------------
// AuthModeCard
// ---------------------------------------------------------------------------

export async function AuthModeCard() {
  const hasResend = Boolean(env.RESEND_API_KEY);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="text-green-500" weight="fill" />
          Auth Mode
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-medium">Postgres (Supabase)</p>
        <p className="text-muted-foreground mt-1 flex items-center gap-1">
          {hasResend ? (
            <CheckCircle className="text-green-500" weight="fill" />
          ) : (
            <XCircle className="text-red-500" weight="fill" />
          )}
          Email verification {hasResend ? "active" : "inactive (no RESEND_API_KEY)"}
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// DatabaseCard
// ---------------------------------------------------------------------------

function maskConnectionString(url: string | undefined): string {
  if (!url) return "—";
  try {
    const parsed = new URL(url);
    // Show host only, mask password
    parsed.password = "***";
    return parsed.host;
  } catch {
    return "(invalid URL)";
  }
}

export async function DatabaseCard() {
  const pool = getPool();

  let versionText: string;
  let isError = false;

  try {
    const result = await pool.query<{ version: string }>("SELECT version()");
    versionText = result.rows[0]?.version ?? "Unknown version";
  } catch (err) {
    versionText = err instanceof Error ? err.message : "Unknown error";
    isError = true;
  }

  const host = maskConnectionString(env.DATABASE_URL);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isError ? (
            <XCircle className="text-red-500" weight="fill" />
          ) : (
            <CheckCircle className="text-green-500" weight="fill" />
          )}
          Database
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className="text-red-500">Connection error: {versionText}</p>
        ) : (
          <p className="font-medium">{versionText}</p>
        )}
        <p className="text-muted-foreground mt-1">Host: {host}</p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// OrgCountCard
// ---------------------------------------------------------------------------

export async function OrgCountCard() {
  const pool = getPool();

  let orgCount = 0;
  let memberCount = 0;
  let isError = false;
  let errorMessage = "";

  try {
    const orgResult = await pool.query<{ count: string }>("SELECT COUNT(*) FROM organization");
    const memberResult = await pool.query<{ count: string }>("SELECT COUNT(*) FROM member");
    orgCount = Number(orgResult.rows[0]?.count ?? 0);
    memberCount = Number(memberResult.rows[0]?.count ?? 0);
  } catch (err) {
    isError = true;
    errorMessage = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isError ? (
            <XCircle className="text-red-500" weight="fill" />
          ) : (
            <CheckCircle className="text-green-500" weight="fill" />
          )}
          Organizations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className="text-red-500">Query error: {errorMessage}</p>
        ) : (
          <>
            <p>
              <span className="font-medium">{orgCount}</span> organization
              {orgCount !== 1 ? "s" : ""}
            </p>
            <p>
              <span className="font-medium">{memberCount}</span> member
              {memberCount !== 1 ? "s" : ""}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
