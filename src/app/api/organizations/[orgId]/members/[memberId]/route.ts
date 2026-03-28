import { z } from "zod";
import { NotFoundError, ValidationError } from "@/lib/api-errors";
import { auth } from "@/lib/auth";
import { assertNotLastOwner } from "@/lib/queries/members";
import { withOrgAuth } from "@/lib/with-auth";

const updateRoleSchema = z.object({
  role: z.enum(["admin", "member"]),
});

export const PATCH = withOrgAuth("owner", async (req, ctx) => {
  const segments = new URL(req.url).pathname.split("/");
  const memberId = segments[segments.length - 1];

  const body = await req.json();

  const parsed = updateRoleSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    throw new ValidationError("Invalid request body", fieldErrors);
  }

  const { role } = parsed.data;

  await assertNotLastOwner(memberId, ctx.org.id);

  try {
    const response = await auth.api.updateMemberRole({
      body: { memberId, role, organizationId: ctx.org.id },
      headers: req.headers,
    });

    return response;
  } catch (err) {
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      if (msg.includes("not found") || msg.includes("member")) {
        throw new NotFoundError("Member not found");
      }
    }
    throw err;
  }
});

export const DELETE = withOrgAuth("owner", async (req, ctx) => {
  const segments = new URL(req.url).pathname.split("/");
  const memberId = segments[segments.length - 1];

  await assertNotLastOwner(memberId, ctx.org.id);

  try {
    await auth.api.removeMember({
      body: { memberIdOrEmail: memberId, organizationId: ctx.org.id },
      headers: req.headers,
    });

    return { deleted: true };
  } catch (err) {
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      if (msg.includes("not found") || msg.includes("member")) {
        throw new NotFoundError("Member not found");
      }
    }
    throw err;
  }
});
