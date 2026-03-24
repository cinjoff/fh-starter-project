#!/usr/bin/env node

import { existsSync } from "node:fs";
import { resolve } from "node:path";
/**
 * CLI tool for querying locally-stored Sentry events.
 *
 * Usage:
 *   node src/lib/sentry-local-query.mjs recent [--minutes N]
 *   node src/lib/sentry-local-query.mjs search "<keyword>"
 *   node src/lib/sentry-local-query.mjs stats
 *   node src/lib/sentry-local-query.mjs detail <event_id>
 *
 * Reads from .sentry-local/events.db (created when SENTRY_LOCAL=true).
 */
import Database from "better-sqlite3";

const DB_PATH = resolve(process.cwd(), ".sentry-local/events.db");

if (!existsSync(DB_PATH)) {
  console.log(
    "No .sentry-local/events.db found. Run your app with SENTRY_LOCAL=true to start capturing errors.",
  );
  process.exit(0);
}

const db = new Database(DB_PATH, { readonly: true });
const [, , command, ...args] = process.argv;

function recent() {
  const minutes = args.includes("--minutes")
    ? parseInt(args[args.indexOf("--minutes") + 1], 10)
    : null;

  let rows;
  if (minutes) {
    if (Number.isNaN(minutes) || minutes <= 0) {
      console.log("Usage: recent --minutes <positive number>");
      return;
    }
    const cutoff = new Date(Date.now() - minutes * 60_000).toISOString();
    rows = db
      .prepare(
        `SELECT event_id, timestamp, level, message, exception
         FROM events
         WHERE created_at >= ?
         ORDER BY timestamp DESC
         LIMIT 20`,
      )
      .all(cutoff);
  } else {
    rows = db
      .prepare(
        `SELECT event_id, timestamp, level, message, exception
         FROM events ORDER BY timestamp DESC LIMIT 20`,
      )
      .all();
  }

  if (rows.length === 0) {
    console.log(minutes ? `No errors in the last ${minutes} minutes.` : "No errors recorded.");
    return;
  }

  console.log(`=== Recent Errors (${rows.length}) ===\n`);
  for (const row of rows) {
    const exc = row.exception ? summarizeException(row.exception) : "";
    console.log(
      `[${row.timestamp}] ${row.level.toUpperCase()}: ${row.message || exc || "(no message)"}`,
    );
    if (exc && row.message) console.log(`  Exception: ${exc}`);
    console.log(`  ID: ${row.event_id}\n`);
  }
}

function search() {
  const keyword = args[0];
  if (!keyword) {
    console.log("Usage: search <keyword>");
    process.exit(1);
  }

  const pattern = `%${keyword}%`;
  const rows = db
    .prepare(
      `SELECT event_id, timestamp, level, message, exception, breadcrumbs
       FROM events
       WHERE message LIKE ? OR exception LIKE ? OR breadcrumbs LIKE ?
       ORDER BY timestamp DESC
       LIMIT 20`,
    )
    .all(pattern, pattern, pattern);

  if (rows.length === 0) {
    console.log(`No errors matching "${keyword}".`);
    return;
  }

  console.log(`=== Search Results for "${keyword}" (${rows.length}) ===\n`);
  for (const row of rows) {
    const exc = row.exception ? summarizeException(row.exception) : "";
    console.log(
      `[${row.timestamp}] ${row.level.toUpperCase()}: ${row.message || exc || "(no message)"}`,
    );
    console.log(`  ID: ${row.event_id}\n`);
  }
}

function stats() {
  const byLevel = db
    .prepare("SELECT level, COUNT(*) as count FROM events GROUP BY level ORDER BY count DESC")
    .all();

  const topErrors = db
    .prepare(
      `SELECT message, COUNT(*) as count FROM events
       WHERE message IS NOT NULL
       GROUP BY message ORDER BY count DESC LIMIT 10`,
    )
    .all();

  const hourly = db
    .prepare(
      `SELECT strftime('%H:00', timestamp) as hour, COUNT(*) as count
       FROM events
       WHERE timestamp >= datetime('now', '-1 hour')
       GROUP BY hour`,
    )
    .all();

  console.log("=== Error Statistics ===\n");

  console.log("By Level:");
  for (const row of byLevel) {
    console.log(`  ${row.level}: ${row.count}`);
  }

  console.log("\nMost Common Errors:");
  for (const row of topErrors) {
    console.log(`  (${row.count}x) ${row.message}`);
  }

  console.log("\nLast Hour:");
  if (hourly.length === 0) {
    console.log("  No errors in the last hour.");
  } else {
    for (const row of hourly) {
      console.log(`  ${row.hour}: ${row.count} errors`);
    }
  }
}

function detail() {
  const eventId = args[0];
  if (!eventId) {
    console.log("Usage: detail <event_id>");
    process.exit(1);
  }

  const row = db.prepare("SELECT * FROM events WHERE event_id = ?").get(eventId);

  if (!row) {
    console.log(`No event found with ID: ${eventId}`);
    return;
  }

  console.log(`=== Error Detail: ${row.event_id} ===\n`);
  console.log(`Timestamp:   ${row.timestamp}`);
  console.log(`Level:       ${row.level}`);
  console.log(`Type:        ${row.type || "(none)"}`);
  console.log(`Message:     ${row.message || "(none)"}`);
  console.log(`Transaction: ${row.transaction_name || "(none)"}`);
  console.log(`Release:     ${row.release || "(none)"}`);
  console.log(`Environment: ${row.environment || "(none)"}`);

  if (row.tags) {
    console.log(`\nTags:`);
    try {
      const tags = JSON.parse(row.tags);
      for (const [k, v] of Object.entries(tags)) {
        console.log(`  ${k}: ${v}`);
      }
    } catch {
      console.log(`  ${row.tags}`);
    }
  }

  if (row.exception) {
    console.log(`\nException:`);
    try {
      const exc = JSON.parse(row.exception);
      for (const val of exc.values || []) {
        console.log(`  ${val.type}: ${val.value}`);
        if (val.stacktrace?.frames) {
          console.log("  Stack trace:");
          for (const frame of val.stacktrace.frames.slice(-10).reverse()) {
            const loc = `${frame.filename || "?"}:${frame.lineno || "?"}:${frame.colno || "?"}`;
            console.log(`    at ${frame.function || "(anonymous)"} (${loc})`);
          }
        }
      }
    } catch {
      console.log(`  ${row.exception}`);
    }
  }

  if (row.breadcrumbs) {
    console.log(`\nBreadcrumbs:`);
    try {
      const bc = JSON.parse(row.breadcrumbs);
      const values = bc.values || bc;
      for (const b of (Array.isArray(values) ? values : []).slice(-10)) {
        console.log(
          `  [${b.timestamp || "?"}] ${b.category || "?"}: ${b.message || JSON.stringify(b.data || {})}`,
        );
      }
    } catch {
      console.log(`  ${row.breadcrumbs}`);
    }
  }

  if (row.request) {
    console.log(`\nRequest:`);
    try {
      const req = JSON.parse(row.request);
      console.log(`  ${req.method || "GET"} ${req.url || "(unknown)"}`);
      if (req.headers) {
        console.log("  Headers:");
        for (const [k, v] of Object.entries(req.headers)) {
          console.log(`    ${k}: ${v}`);
        }
      }
    } catch {
      console.log(`  ${row.request}`);
    }
  }
}

function summarizeException(exceptionJson) {
  try {
    const exc = JSON.parse(exceptionJson);
    const val = exc.values?.[0];
    if (val) return `${val.type}: ${val.value}`;
  } catch {
    // fallback
  }
  return "";
}

switch (command) {
  case "recent":
    recent();
    break;
  case "search":
    search();
    break;
  case "stats":
    stats();
    break;
  case "detail":
    detail();
    break;
  default:
    console.log("Usage: sentry-local-query.mjs <command>\n");
    console.log("Commands:");
    console.log("  recent [--minutes N]   Show recent errors");
    console.log('  search "<keyword>"     Full-text search across errors');
    console.log("  stats                  Error statistics and trends");
    console.log("  detail <event_id>      Full error detail with stack trace");
}

db.close();
