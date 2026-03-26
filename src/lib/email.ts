import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
      from: "FH Starter <noreply@fh-starter.com>",
      to,
      subject,
      html,
    })
    .then((result) => {
      if (result.error) {
        console.error("[email] Resend error:", result.error);
      }
    })
    .catch((err: unknown) => {
      console.error("[email] Failed to send:", err);
    });
}
