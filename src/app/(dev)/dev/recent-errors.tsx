import path from "node:path";
import Database from "better-sqlite3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DB_PATH = path.resolve(process.cwd(), ".sentry-local/events.db");

interface ErrorRow {
  timestamp: string;
  level: string;
  message: string | null;
}

function levelClass(level: string): string {
  switch (level.toLowerCase()) {
    case "fatal":
    case "error":
      return "text-red-500";
    case "warning":
      return "text-amber-500";
    case "info":
      return "text-blue-500";
    default:
      return "text-muted-foreground";
  }
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function truncate(str: string | null, max: number): string {
  if (!str) return "(no message)";
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

export async function RecentErrors() {
  if (!process.env.SENTRY_LOCAL) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Sentry Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs">
            Local Sentry capture is disabled. Add{" "}
            <code className="font-mono bg-muted px-1 py-0.5 rounded text-xs">
              SENTRY_LOCAL=true
            </code>{" "}
            to your{" "}
            <code className="font-mono bg-muted px-1 py-0.5 rounded text-xs">.env.local</code> to
            start capturing errors locally.
          </p>
        </CardContent>
      </Card>
    );
  }

  let rows: ErrorRow[] = [];
  let dbError: string | null = null;

  try {
    const db = new Database(DB_PATH, { readonly: true });
    try {
      rows = db
        .prepare("SELECT timestamp, level, message FROM events ORDER BY id DESC LIMIT 15")
        .all() as ErrorRow[];
    } finally {
      db.close();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("ENOENT") || message.includes("unable to open")) {
      dbError =
        "No events database found yet — errors will appear here once your app captures some.";
    } else {
      dbError = `Could not read events database: ${message}`;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sentry Errors</CardTitle>
      </CardHeader>
      <CardContent>
        {dbError ? (
          <p className="text-muted-foreground text-xs">{dbError}</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-xs">No errors recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-foreground/10 text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium whitespace-nowrap">Time</th>
                  <th className="pb-2 pr-4 font-medium">Level</th>
                  <th className="pb-2 font-medium">Message</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static list, no reordering
                  <tr key={i} className="border-b border-foreground/5 last:border-0">
                    <td className="py-1.5 pr-4 text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(row.timestamp)}
                    </td>
                    <td className={`py-1.5 pr-4 font-medium uppercase ${levelClass(row.level)}`}>
                      {row.level}
                    </td>
                    <td className="py-1.5 font-mono">{truncate(row.message, 80)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
