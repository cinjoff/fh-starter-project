import { mkdirSync } from "node:fs";
import path from "node:path";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { testUtils } from "better-auth/plugins";
import { organization } from "better-auth/plugins/organization";
import Database from "better-sqlite3";
import { Pool } from "pg";
import { escapeHtml, sendEmail } from "./email";
import { env } from "./env";

const LOCAL_DEV_SECRET = "local-dev-secret-not-for-production!!";

/** True when using SQLite fallback instead of Postgres. */
export let localAuthMode = false;

function createAuth() {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && (!env.DATABASE_URL || !env.BETTER_AUTH_SECRET)) {
    return null;
  }

  let database: Pool | Database.Database;
  let secret: string;

  if (env.DATABASE_URL && env.BETTER_AUTH_SECRET) {
    database = new Pool({ connectionString: env.DATABASE_URL });
    secret = env.BETTER_AUTH_SECRET;
  } else if (!isProduction) {
    const dataDir = path.join(process.cwd(), ".data");
    mkdirSync(dataDir, { recursive: true });
    database = new Database(path.join(dataDir, "local-auth.db"));
    secret = LOCAL_DEV_SECRET;
    localAuthMode = true;
  } else {
    return null;
  }

  const pool = database instanceof Pool ? database : null;
  const hasResendKey = Boolean(env.RESEND_API_KEY);
  const hasGoogleOAuth = Boolean(env.GOOGLE_CLIENT_ID) && Boolean(env.GOOGLE_CLIENT_SECRET);

  const instance = betterAuth({
    secret,
    baseURL: env.BETTER_AUTH_URL,
    database,
    trustedOrigins: [env.BETTER_AUTH_URL],
    rateLimit: { enabled: true },
    ...(hasGoogleOAuth && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          socialProviders: {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
          },
        }
      : {}),
    ...(env.ENABLE_ORGANIZATIONS && pool
      ? {
          databaseHooks: {
            session: {
              create: {
                before: async (session: Record<string, unknown>) => {
                  try {
                    const result = await pool.query(
                      'SELECT "organizationId" FROM "member" WHERE "userId" = $1 LIMIT 1',
                      [session.userId],
                    );
                    const orgId = result.rows[0]?.organizationId;
                    if (typeof orgId === "string") {
                      return {
                        data: {
                          ...session,
                          activeOrganizationId: orgId,
                        },
                      };
                    }
                  } catch {
                    // member table may not exist if organizations are not set up yet
                  }
                  return { data: session };
                },
              },
            },
          },
        }
      : {}),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: hasResendKey,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        const safeUrl = escapeHtml(url);
        await sendEmail({
          to: user.email,
          subject: "Reset your password",
          html: `<p>Click the link to reset your password:</p><p><a href="${safeUrl}">${safeUrl}</a></p>`,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: hasResendKey,
      sendVerificationEmail: async ({ user, url }) => {
        const safeUrl = escapeHtml(url);
        await sendEmail({
          to: user.email,
          subject: "Verify your email",
          html: `<p>Click the link to verify your email:</p><p><a href="${safeUrl}">${safeUrl}</a></p>`,
        });
      },
    },
    plugins: [
      ...(env.ENABLE_ORGANIZATIONS
        ? [
            organization({
              allowUserToCreateOrganization: true,
              organizationLimit: 1,
              membershipLimit: 50,
              invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
              sendInvitationEmail: async (data) => {
                const safeInviterName = escapeHtml(data.inviter.user.name);
                const safeOrgName = escapeHtml(data.organization.name);
                const safeUrl = escapeHtml(
                  `${env.BETTER_AUTH_URL}/accept-invite/${data.invitation.id}`,
                );
                await sendEmail({
                  to: data.email,
                  subject: `Join ${data.organization.name}`,
                  html: `<p>${safeInviterName} invited you to join ${safeOrgName}.</p><p><a href="${safeUrl}">Accept Invitation</a></p>`,
                });
              },
            }),
          ]
        : []),
      ...(process.env.NODE_ENV === "test" ? [testUtils()] : []),
      nextCookies(), // must be last
    ],
  });

  // Auto-migrate SQLite database in local dev mode
  if (localAuthMode) {
    instance.$context
      .then((ctx) => ctx.runMigrations())
      .catch(() => {
        // Migration may fail on first import during build; tables will be created on next startup
      });
  }

  return instance;
}

export const auth = createAuth();

/** Whether auth is configured and available. */
export const authEnabled = auth !== null;

export type Session = NonNullable<typeof auth> extends { $Infer: { Session: infer S } } ? S : never;
