import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  if (!supabase) {
    // No auth gate when Supabase is unconfigured
    return <>{children}</>;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}
