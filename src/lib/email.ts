import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";
import { env } from "./env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/** Escape HTML special characters to prevent XSS in email templates. */
export function escapeHtml(str: string): string {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Fire-and-forget email send. Logs to console in development when no RESEND_API_KEY. */
export function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!resend) {
    console.log("[email] (dev mode — no RESEND_API_KEY)");
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${html}`);
    return Promise.resolve();
  }

  return resend.emails
    .send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    })
    .then((result) => {
      if (result.error) {
        console.error("[email] Resend error:", result.error);
        Sentry.captureException(result.error);
      }
    })
    .catch((err: unknown) => {
      console.error("[email] Failed to send:", err);
      Sentry.captureException(err);
    });
}
