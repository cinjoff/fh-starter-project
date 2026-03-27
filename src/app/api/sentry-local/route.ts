/**
 * Sentry local tunnel endpoint — receives browser envelopes and
 * stores them in the local SQLite database for development.
 *
 * Only active when SENTRY_LOCAL=true. Returns 404 otherwise.
 * The client SDK is configured to use this as its tunnel in instrumentation-client.ts.
 *
 * Envelope format (newline-delimited):
 *   line 0: envelope header  {"dsn":"…","sent_at":"…"}
 *   line 1: item header      {"type":"event", "length":…}
 *   line 2: item body        { full event JSON }
 *   line 3: item header      (next item…)
 *   line 4: item body
 *   …
 */
import { NextResponse } from "next/server";

/** Item types the tunnel accepts from the Sentry SDK. */
const ACCEPTED_ITEM_TYPES = new Set([
  "event",
  "transaction",
  "log",
  "session",
  "attachment",
  "profile",
  "replay_event",
  "replay_recording",
  "check_in",
  "statsd",
  "metric_buckets",
  "span",
  "otel_span",
]);

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

    // First line is the envelope header — skip it.
    // Remaining lines alternate: item-header, item-body, item-header, item-body…
    let i = 1;
    while (i < lines.length) {
      const headerLine = lines[i];
      i++;
      if (!headerLine || !headerLine.startsWith("{")) continue;

      let itemHeader: Record<string, unknown>;
      try {
        itemHeader = JSON.parse(headerLine) as Record<string, unknown>;
      } catch {
        continue;
      }

      const itemType = typeof itemHeader.type === "string" ? itemHeader.type : null;
      if (!itemType || !ACCEPTED_ITEM_TYPES.has(itemType)) {
        // Skip the body line for unrecognised types
        i++;
        continue;
      }

      // The next line is the item body
      const bodyLine = lines[i];
      i++;
      if (!bodyLine) continue;

      // Build a minimal envelope: empty envelope header + item header + item body
      const miniEnvelope = new TextEncoder().encode(`{}\n${headerLine}\n${bodyLine}`);
      store.push(miniEnvelope);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[sentry-local] Tunnel error:", err);
    return NextResponse.json({ ok: true }); // always return 200 for SDK
  }
}
