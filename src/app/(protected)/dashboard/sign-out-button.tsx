"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    if (!supabase) return;

    await supabase.auth.signOut();
    router.push("/login");
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
