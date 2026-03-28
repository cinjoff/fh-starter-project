import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPool } from "@/lib/db";

interface OrgRow {
  id: string;
  name: string;
  slug: string;
}

interface MemberRow {
  userId: string;
  organizationId: string;
  role: string;
  userName: string | null;
  userEmail: string;
}

function roleBadgeClass(role: string): string {
  switch (role) {
    case "owner":
      return "bg-amber-100 text-amber-800";
    case "admin":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export async function OrgTree() {
  const pool = getPool();

  if (!pool) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Tree</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Requires Postgres</p>
        </CardContent>
      </Card>
    );
  }

  let orgs: OrgRow[] = [];
  let members: MemberRow[] = [];
  let isError = false;
  let errorMessage = "";

  try {
    const orgResult = await pool.query<OrgRow>(
      "SELECT id, name, slug FROM organization ORDER BY name",
    );
    orgs = orgResult.rows;

    const memberResult = await pool.query<MemberRow>(
      `SELECT m."userId", m."organizationId", m.role, u.name AS "userName", u.email AS "userEmail"
       FROM member m
       JOIN "user" u ON u.id = m."userId"
       ORDER BY m.role, u.email`,
    );
    members = memberResult.rows;
  } catch (err) {
    isError = true;
    errorMessage = err instanceof Error ? err.message : "Unknown error";
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Tree</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Query error: {errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  if (orgs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Tree</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No organizations found.</p>
        </CardContent>
      </Card>
    );
  }

  const membersByOrg = new Map<string, MemberRow[]>();
  for (const m of members) {
    const list = membersByOrg.get(m.organizationId) ?? [];
    list.push(m);
    membersByOrg.set(m.organizationId, list);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Tree</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {orgs.map((org) => {
            const orgMembers = membersByOrg.get(org.id) ?? [];
            return (
              <li key={org.id}>
                <p className="font-medium">
                  {org.name} <span className="text-muted-foreground text-xs">({org.slug})</span>
                </p>
                {orgMembers.length === 0 ? (
                  <p className="text-muted-foreground text-xs ml-4 mt-1">No members</p>
                ) : (
                  <ul className="ml-4 mt-1 space-y-1">
                    {orgMembers.map((m) => (
                      <li key={m.userId} className="flex items-center gap-2 text-sm">
                        <span>{m.userName ?? m.userEmail}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${roleBadgeClass(m.role)}`}>
                          {m.role}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
