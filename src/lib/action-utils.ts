import type { ZodType } from "zod";

export type ActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

export function actionSuccess(message: string): ActionState {
  return { status: "success", message };
}

export function actionError(message: string, fieldErrors?: Record<string, string[]>): ActionState {
  return {
    status: "error",
    message,
    ...(fieldErrors !== undefined && { fieldErrors }),
  };
}

export function parseFormData<T>(
  schema: ZodType<T>,
  formData: FormData,
): { success: true; data: T } | { success: false; state: ActionState } {
  const result = schema.safeParse(Object.fromEntries(formData));

  if (result.success) {
    return { success: true, data: result.data };
  }

  const fieldErrors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? "_");
    if (!fieldErrors[field]) {
      fieldErrors[field] = [];
    }
    fieldErrors[field].push(issue.message);
  }

  return { success: false, state: actionError("Validation failed", fieldErrors) };
}
