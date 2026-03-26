/**
 * Sentry local tunnel endpoint — receives browser error envelopes and
 * stores them in the local SQLite database for development.
 *
 * Only active when SENTRY_LOCAL=true. Returns 404 otherwise.
 * The client SDK is configured to use this as its tunnel in instrumentation-client.ts.
 */
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (process.env.SENTRY_LOCAL !== "true" || process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await req.text();
    const lines = body.split("\n");

    // Dynamic import to avoid bundling better-sqlite3 in production
    const { createLocalSentryStore } = await import("@/lib/sentry-local");
    const store = createLocalSentryStore();

    for (const line of lines) {
      if (!line.startsWith("{")) continue;
      try {
        const obj = JSON.parse(line);
        if (obj.event_id || obj.exception || obj.message) {
          const envelope = new TextEncoder().encode(`{}\n{"type":"event"}\n${line}`);
          store.push(envelope);
        }
      } catch {
        // skip invalid JSON lines
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[sentry-local] Tunnel error:", err);
    return NextResponse.json({ ok: true }); // always return 200 for SDK
  }
}
