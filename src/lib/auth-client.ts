import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [
    ...(process.env.NEXT_PUBLIC_ENABLE_ORGANIZATIONS === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_ORGANIZATIONS === "1"
      ? [organizationClient()]
      : []),
  ],
});
