import { z } from "zod";

export const profileSchema = z.object({
	id: z.string().uuid(),
	email: z.string().nullable(),
	full_name: z.string().nullable(),
	avatar_url: z.string().nullable(),
	created_at: z.coerce.date(),
	updated_at: z.coerce.date(),
});

export type Profile = z.infer<typeof profileSchema>;
