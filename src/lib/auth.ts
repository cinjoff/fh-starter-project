import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { testUtils } from "better-auth/plugins";
import { organization } from "better-auth/plugins/organization";
import { Pool } from "pg";
import { sendEmail } from "./email";
import { renderEmail } from "./email-template";
import { env } from "./env";
import { logger } from "./logger";

function createDatabase(): Pool | { client: "better-sqlite3"; url: string } {
  if (env.DATABASE_URL) {
    const isLocal = /localhost|127\.0\.0\.1/.test(env.DATABASE_URL);
    return new Pool({
      connectionString: env.DATABASE_URL,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });
  }
  // SQLite fallback for zero-config local dev (no orgs support)
  return { client: "better-sqlite3", url: "./local.db" };
}

function createAuth() {
  const database = createDatabase();
  const usePostgres = database instanceof Pool;
  const secret = env.BETTER_AUTH_SECRET;
  const hasResendKey = Boolean(env.RESEND_API_KEY);
  const hasGoogleOAuth = Boolean(env.GOOGLE_CLIENT_ID) && Boolean(env.GOOGLE_CLIENT_SECRET);

  return betterAuth({
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
    ...(usePostgres
      ? {
          databaseHooks: {
            session: {
              create: {
                before: async (session: Record<string, unknown>) => {
                  try {
                    const result = await (database as Pool).query(
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
                  } catch (err) {
                    logger.warn("Failed to set activeOrganizationId on session", {
                      error: err instanceof Error ? err.message : String(err),
                    });
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
        await sendEmail({
          to: user.email,
          subject: "Reset your password",
          html: renderEmail({
            title: "Reset Your Password",
            body: "Click the button below to reset your password.",
            ctaUrl: url,
            ctaText: "Reset Password",
          }),
        });
      },
    },
    emailVerification: {
      sendOnSignUp: hasResendKey,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "Verify your email",
          html: renderEmail({
            title: "Verify Your Email",
            body: "Click the button below to verify your email address.",
            ctaUrl: url,
            ctaText: "Verify Email",
          }),
        });
      },
    },
    plugins: [
      ...(usePostgres
        ? [
            organization({
              allowUserToCreateOrganization: true,
              organizationLimit: 5,
              membershipLimit: 50,
              invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
              sendInvitationEmail: async (data) => {
                await sendEmail({
                  to: data.email,
                  subject: `Join ${data.organization.name}`,
                  html: renderEmail({
                    title: "You're Invited",
                    body: `${data.inviter.user.name} invited you to join ${data.organization.name}.`,
                    ctaUrl: `${env.BETTER_AUTH_URL}/accept-invite/${data.invitation.id}`,
                    ctaText: "Accept Invitation",
                  }),
                });
              },
            }),
          ]
        : []),
      ...(process.env.NODE_ENV === "test" ? [testUtils()] : []),
      nextCookies(), // must be last
    ],
  });
}

export const auth = createAuth();

export type Session = (typeof auth)["$Infer"]["Session"];
