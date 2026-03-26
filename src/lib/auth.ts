import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { testUtils } from "better-auth/plugins";
import { organization } from "better-auth/plugins/organization";
import { Pool } from "pg";
import { escapeHtml, sendEmail } from "./email";
import { env } from "./env";

const pool = new Pool({ connectionString: env.DATABASE_URL });

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: pool,
  trustedOrigins: [env.BETTER_AUTH_URL],
  rateLimit: { enabled: true },
  ...(env.ENABLE_ORGANIZATIONS
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
    requireEmailVerification: true,
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
    sendOnSignUp: true,
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

export type Session = typeof auth.$Infer.Session;
