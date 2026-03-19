/**
 * SQLite-backed Sentry offline store for local development.
 *
 * When SENTRY_LOCAL=true, Sentry events are stored in .sentry-local/events.db
 * instead of being sent to a remote DSN. This enables error tracking during
 * development without requiring a Sentry account.
 *
 * Used by: sentry.server.config.ts (server), /api/sentry-local (client tunnel)
 * Query with: src/lib/sentry-local-query.mjs
 */

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const DB_DIR = path.resolve(process.cwd(), ".sentry-local");
const DB_PATH = path.join(DB_DIR, "events.db");

let db: InstanceType<typeof Database> | null = null;
let writeCount = 0;

function getDb(): InstanceType<typeof Database> {
  if (db) return db;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");

  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT UNIQUE,
      timestamp TEXT NOT NULL,
      level TEXT NOT NULL DEFAULT 'error',
      type TEXT,
      message TEXT,
      transaction_name TEXT,
      release TEXT,
      environment TEXT,
      tags TEXT,
      breadcrumbs TEXT,
      exception TEXT,
      request TEXT,
      contexts TEXT,
      user_data TEXT,
      envelope BLOB,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_events_level ON events(level);
    CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
  `);

  return db;
}

function pruneOldEvents() {
  writeCount++;
  if (writeCount % 100 !== 0) return;
  try {
    getDb().exec("DELETE FROM events WHERE created_at < datetime('now', '-7 days')");
  } catch {
    // best-effort pruning
  }
}

function extractEventFields(envelope: Uint8Array) {
  try {
    const text = new TextDecoder().decode(envelope);
    const lines = text.split("\n");

    for (const line of lines) {
      if (!line.startsWith("{")) continue;
      try {
        const obj = JSON.parse(line);
        if (obj.event_id || obj.exception || obj.message) {
          return {
            event_id: obj.event_id || null,
            timestamp: obj.timestamp
              ? new Date(
                  typeof obj.timestamp === "number" ? obj.timestamp * 1000 : obj.timestamp,
                ).toISOString()
              : new Date().toISOString(),
            level: obj.level || "error",
            type: obj.type || null,
            message: obj.message || obj.exception?.values?.[0]?.value || null,
            transaction_name: obj.transaction || null,
            release: obj.release || null,
            environment: obj.environment || null,
            tags: obj.tags ? JSON.stringify(obj.tags) : null,
            breadcrumbs: obj.breadcrumbs ? JSON.stringify(obj.breadcrumbs) : null,
            exception: obj.exception ? JSON.stringify(obj.exception) : null,
            request: obj.request ? JSON.stringify(obj.request) : null,
            contexts: obj.contexts ? JSON.stringify(obj.contexts) : null,
            user_data: obj.user ? JSON.stringify(obj.user) : null,
          };
        }
      } catch {
        // not valid JSON, skip
      }
    }
  } catch {
    // decode failed
  }
  return null;
}

/**
 * Create a local Sentry offline store backed by SQLite.
 * Used by makeOfflineTransport() from @sentry/core.
 */
export function createLocalSentryStore() {
  return {
    push(envelope: Uint8Array) {
      try {
        const fields = extractEventFields(envelope);
        if (fields?.event_id) {
          const stmt = getDb().prepare(`
            INSERT OR IGNORE INTO events
              (event_id, timestamp, level, type, message, transaction_name,
               release, environment, tags, breadcrumbs, exception, request,
               contexts, user_data, envelope)
            VALUES
              (@event_id, @timestamp, @level, @type, @message, @transaction_name,
               @release, @environment, @tags, @breadcrumbs, @exception, @request,
               @contexts, @user_data, @envelope)
          `);
          stmt.run({ ...fields, envelope: Buffer.from(envelope) });
          pruneOldEvents();
        }
      } catch (err) {
        console.warn("[sentry-local] Failed to store event:", err);
      }
    },
    unshift(envelope: Uint8Array) {
      this.push(envelope);
    },
    shift() {
      try {
        const row = getDb()
          .prepare("SELECT id, envelope FROM events ORDER BY id ASC LIMIT 1")
          .get() as { id: number; envelope: Buffer } | undefined;
        if (row) {
          getDb().prepare("DELETE FROM events WHERE id = ?").run(row.id);
          return new Uint8Array(row.envelope);
        }
      } catch {
        // best-effort
      }
      return undefined;
    },
  };
}
