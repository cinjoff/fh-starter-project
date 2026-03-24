/** Next.js 16 proxy (replaces middleware.ts): refreshes Supabase sessions and applies security headers. */
import type { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

function getConnectSrcOrigins(): string[] {
  const origins: string[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      origins.push(new URL(supabaseUrl).origin);
    } catch {
      // Invalid URL — skip
    }
  }

  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (sentryDsn) {
    try {
      origins.push(new URL(sentryDsn).origin);
    } catch {
      // Invalid DSN — skip
    }
  }

  return origins;
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  const connectSrcOrigins = getConnectSrcOrigins();
  const connectSrc = ["'self'", ...connectSrcOrigins].join(" ");

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'none'",
  ].join("; ");

  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
