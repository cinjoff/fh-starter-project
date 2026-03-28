import { z } from "zod";
import { ValidationError } from "@/lib/api-errors";
import { listOrgMembers } from "@/lib/queries/members";
import { withOrgAuth } from "@/lib/with-auth";

const listParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});

export const GET = withOrgAuth("member", async (req, ctx) => {
  const { searchParams } = new URL(req.url);

  const parsed = listParamsSchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    per_page: searchParams.get("per_page") ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    throw new ValidationError("Invalid query parameters", fieldErrors);
  }

  const { page, per_page: perPage } = parsed.data;
  return listOrgMembers(ctx.org.id, page, perPage);
});
