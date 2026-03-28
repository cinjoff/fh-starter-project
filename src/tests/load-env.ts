/**
 * Lightweight .env.local parser for test and E2E code.
 *
 * Avoids importing @t3-oss/env-nextjs which requires the full Next.js runtime.
 * Shared across factory.ts, factory.test.ts, and e2e/global-setup.ts.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export function loadEnv(
  envPath = path.resolve(__dirname, "../../.env.local"),
): Record<string, string> {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf8");
  const vars: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    let val = trimmed.slice(eqIdx + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    vars[trimmed.slice(0, eqIdx)] = val;
  }
  return vars;
}
