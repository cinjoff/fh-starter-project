import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

function notConfigured() {
  return new Response("Auth not configured", { status: 404 });
}

export const GET = auth ? toNextJsHandler(auth).GET : notConfigured;
export const POST = auth ? toNextJsHandler(auth).POST : notConfigured;
