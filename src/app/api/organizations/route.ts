import { z } from "zod";
import { ConflictError, ValidationError } from "@/lib/api-errors";
import { auth } from "@/lib/auth";
import { getOrganizationBySlug, listUserOrganizations, slugify } from "@/lib/queries/organizations";
import { withAuth } from "@/lib/with-auth";

const listParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});

const createBodySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export const GET = withAuth(async (req, ctx) => {
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
  return listUserOrganizations(ctx.user.id, page, perPage);
});

export const POST = withAuth(async (req, _ctx) => {
  const body = await req.json();

  const parsed = createBodySchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    throw new ValidationError("Invalid request body", fieldErrors);
  }

  const { name } = parsed.data;
  const slug = parsed.data.slug ?? slugify(name);

  const existing = await getOrganizationBySlug(slug);
  if (existing) {
    throw new ConflictError(`Organization with slug "${slug}" already exists`);
  }

  try {
    const response = await auth.api.createOrganization({
      body: { name, slug },
      headers: req.headers,
    });

    return response;
  } catch (err) {
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      if (msg.includes("slug") && (msg.includes("duplicate") || msg.includes("unique"))) {
        throw new ConflictError(`Organization with slug "${slug}" already exists`);
      }
      if (msg.includes("limit") || msg.includes("maximum")) {
        throw new ConflictError("Organization limit reached");
      }
    }
    throw err;
  }
});
