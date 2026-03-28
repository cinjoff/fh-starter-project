import { NextResponse } from "next/server";
import { ForbiddenError, isApiError } from "@/lib/api-errors";
import { apiError, ok } from "@/lib/api-response";
import type { Session } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { MemberContext } from "@/lib/roles";
import { buildMemberContext, requireRole } from "@/lib/roles";
import { getTraceId, withTrace } from "@/lib/trace";
import type { MemberRole } from "@/lib/types";

export type AuthContext = {
  user: { id: string; email: string; name: string };
  session: Session;
  traceId: string;
};

export type OrgAuthContext = AuthContext & {
  org: { id: string };
  member: MemberContext;
};

/**
 * Higher-order function that wraps a route handler with auth validation.
 * Injects AuthContext (user, session, traceId) into the handler.
 * Returns ApiResponse<T> envelope or appropriate error response.
 */
export function withAuth<T>(
  handler: (req: Request, ctx: AuthContext) => Promise<T>,
): (req: Request) => Promise<NextResponse> {
  return async (req: Request): Promise<NextResponse> => {
    return withTrace(async () => {
      const traceId = getTraceId();
      const method = req.method;
      const path = new URL(req.url).pathname;
      let status = 200;

      const session = await auth.api.getSession({ headers: req.headers });

      if (!session) {
        status = 401;
        logger.info("API request", { method, path, status });
        return NextResponse.json(apiError("UNAUTHORIZED", "Unauthorized", { traceId }), {
          status: 401,
        });
      }

      const ctx: AuthContext = {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        },
        session: session as unknown as Session,
        traceId,
      };

      try {
        const result = await handler(req, ctx);
        const response = ok(result, { traceId });
        logger.info("API request", { method, path, status });
        return NextResponse.json(response);
      } catch (err) {
        if (isApiError(err)) {
          status = err.status;
          logger.info("API request", { method, path, status });
          return NextResponse.json(
            apiError(err.code, err.message, { traceId, details: err.details }),
            { status: err.status },
          );
        }
        // Non-ApiError: log and rethrow
        logger.error("Unhandled API error", {
          method,
          path,
          userId: ctx.user.id,
          traceId,
        });
        throw err;
      }
    });
  };
}

/**
 * Higher-order function that wraps a route handler with org auth validation.
 * Checks auth session, then validates org membership and role.
 * Injects OrgAuthContext (user, session, traceId, org, member) into the handler.
 */
export function withOrgAuth<T>(
  minRole: MemberRole,
  handler: (req: Request, ctx: OrgAuthContext) => Promise<T>,
): (req: Request, context: { params: Promise<{ orgId: string }> }) => Promise<NextResponse> {
  return async (
    req: Request,
    context: { params: Promise<{ orgId: string }> },
  ): Promise<NextResponse> => {
    return withTrace(async () => {
      const traceId = getTraceId();
      const method = req.method;
      const path = new URL(req.url).pathname;
      let status = 200;

      const session = await auth.api.getSession({ headers: req.headers });

      if (!session) {
        status = 401;
        logger.info("API request", { method, path, status });
        return NextResponse.json(apiError("UNAUTHORIZED", "Unauthorized", { traceId }), {
          status: 401,
        });
      }

      const pool = getPool();

      const userCtx: AuthContext = {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        },
        session: session as unknown as Session,
        traceId,
      };

      try {
        const { orgId } = await context.params;
        const result = await pool.query(
          'SELECT role, "userId", "organizationId" FROM member WHERE "userId" = $1 AND "organizationId" = $2',
          [userCtx.user.id, orgId],
        );

        if (result.rows.length === 0) {
          throw new ForbiddenError("Not a member of this organization");
        }

        const member = buildMemberContext(result.rows[0]);
        requireRole(member, minRole);

        const ctx: OrgAuthContext = {
          ...userCtx,
          org: { id: orgId },
          member,
        };

        const data = await handler(req, ctx);
        const response = ok(data, { traceId });
        logger.info("API request", { method, path, status });
        return NextResponse.json(response);
      } catch (err) {
        if (isApiError(err)) {
          status = err.status;
          logger.info("API request", { method, path, status });
          return NextResponse.json(
            apiError(err.code, err.message, { traceId, details: err.details }),
            { status: err.status },
          );
        }
        logger.error("Unhandled API error", {
          method,
          path,
          userId: userCtx.user.id,
          traceId,
        });
        throw err;
      }
    });
  };
}
