import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { testUtils } from "better-auth/plugins";
import { organization } from "better-auth/plugins/organization";
import { Pool } from "pg";
import { sendEmail } from "./email";
import { env } from "./env";

const pool = new Pool({ connectionString: env.DATABASE_URL });

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: pool,
  trustedOrigins: [env.BETTER_AUTH_URL],
  rateLimit: { enabled: true },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const result = await pool.query(
            'SELECT "organizationId" FROM "member" WHERE "userId" = $1 LIMIT 1',
            [session.userId],
          );
          if (result.rows.length > 0) {
            return {
              data: {
                ...session,
                activeOrganizationId: (result.rows[0] as { organizationId: string }).organizationId,
              },
            };
          }
          return { data: session };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `<p>Click the link to reset your password:</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Verify your email",
        html: `<p>Click the link to verify your email:</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 1,
      membershipLimit: 50,
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
      sendInvitationEmail: async (data) => {
        void sendEmail({
          to: data.email,
          subject: `Join ${data.organization.name}`,
          html: `<p>${data.inviter.user.name} invited you to join ${data.organization.name}.</p><p><a href="${env.BETTER_AUTH_URL}/accept-invite/${data.invitation.id}">Accept Invitation</a></p>`,
        });
      },
    }),
    ...(process.env.NODE_ENV !== "production" ? [testUtils()] : []),
    nextCookies(), // must be last
  ],
});

export type Session = typeof auth.$Infer.Session;
