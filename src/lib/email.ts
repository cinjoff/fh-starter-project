import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";
import { env } from "./env";
import { logger } from "./logger";

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
    logger.info("Email sent (dev mode)", { to, subject });
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
        logger.error("Email Resend error", { to, subject });
        Sentry.captureException(result.error);
      }
    })
    .catch((err: unknown) => {
      logger.error("Email send failed", { to, subject });
      Sentry.captureException(err);
    });
}
