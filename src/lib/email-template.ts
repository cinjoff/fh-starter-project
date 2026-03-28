import { escapeHtml } from "@/lib/email";

export const APP_NAME = "fh-starter";

export type EmailTemplateProps = {
  title: string;
  body: string;
  ctaUrl?: string;
  ctaText?: string;
  footerText?: string;
};

export function renderEmail(props: EmailTemplateProps): string {
  const { title, body, ctaUrl, ctaText, footerText } = props;

  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body);
  const safeFooter = escapeHtml(
    footerText ?? `Sent by ${APP_NAME}. If you did not request this, you can ignore this email.`,
  );

  const ctaSection =
    ctaUrl && ctaText
      ? `
        <tr>
          <td align="center" style="padding: 24px 40px 32px;">
            <a href="${escapeHtml(ctaUrl)}"
               style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
              ${escapeHtml(ctaText)}
            </a>
          </td>
        </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:#f0f0f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#f8f9fa;padding:24px 40px;border-bottom:1px solid #e9ecef;">
              <span style="font-size:18px;font-weight:700;color:#171717;">${APP_NAME}</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px 16px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#171717;">${safeTitle}</h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#444444;">${safeBody}</p>
            </td>
          </tr>

          <!-- CTA -->
          ${ctaSection}

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e9ecef;background:#f8f9fa;">
              <p id="footer" style="margin:0;font-size:12px;color:#888888;line-height:1.5;">${safeFooter}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
