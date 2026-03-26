"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push("/login");
    } catch {
      toast.error("Sign out failed. Please try again.");
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      aria-label="Sign out"
      data-testid="sign-out-button"
    >
      Sign Out
    </Button>
  );
}
