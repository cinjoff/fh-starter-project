import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";

  // Prevent open redirect
  if (!next.startsWith("/")) {
    next = "/";
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const redirectBase = forwardedHost ? `https://${forwardedHost}` : origin;

  return NextResponse.redirect(new URL(next, redirectBase));
}
