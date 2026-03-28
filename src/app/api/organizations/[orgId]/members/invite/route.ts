import { z } from "zod";
import { ConflictError, TooManyRequestsError, ValidationError } from "@/lib/api-errors";
import { auth } from "@/lib/auth";
import { createRateLimiter } from "@/lib/rate-limit";
import { withOrgAuth } from "@/lib/with-auth";

const inviteLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });

const inviteBodySchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

export const POST = withOrgAuth("admin", async (req, ctx) => {
  const limit = inviteLimiter.check(ctx.user.id);
  if (!limit.allowed) {
    throw new TooManyRequestsError();
  }

  const body = await req.json();

  const parsed = inviteBodySchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    throw new ValidationError("Invalid request body", fieldErrors);
  }

  const { email, role } = parsed.data;

  if (ctx.user.email === email) {
    throw new ConflictError("Cannot invite yourself");
  }

  try {
    const response = await auth.api.createInvitation({
      body: { email, role, organizationId: ctx.org.id },
      headers: req.headers,
    });

    return response;
  } catch (err) {
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      if (msg.includes("already a member") || msg.includes("already exists")) {
        throw new ConflictError("User is already a member of this organization");
      }
    }
    throw err;
  }
});
