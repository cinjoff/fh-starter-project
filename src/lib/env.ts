/** Type-safe environment variables validated at build time via t3-env + Zod. */
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string().min(32),
    DATABASE_URL: z.string(),
    BETTER_AUTH_URL: z.string().optional().default("http://localhost:3000"),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional().default("FH Starter <noreply@fh-starter.com>"),
    ENABLE_ORGANIZATIONS: z
      .enum(["true", "1"])
      .optional()
      .transform((v) => v === "true" || v === "1"),
    SENTRY_LOCAL: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional().default("http://localhost:3000"),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
    NEXT_PUBLIC_SENTRY_LOCAL: z.string().optional(),
    NEXT_PUBLIC_ENABLE_ORGANIZATIONS: z
      .enum(["true", "1"])
      .optional()
      .transform((v) => v === "true" || v === "1"),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_LOCAL: process.env.NEXT_PUBLIC_SENTRY_LOCAL,
    NEXT_PUBLIC_ENABLE_ORGANIZATIONS: process.env.NEXT_PUBLIC_ENABLE_ORGANIZATIONS,
  },
});
