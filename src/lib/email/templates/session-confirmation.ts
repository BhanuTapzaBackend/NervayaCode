import { EMAIL_COLORS, EMAIL_CONFIG } from '../constants';

interface SessionConfirmationTemplateProps {
  name: string;
  therapistName: string;
  date: string;
  startTime: string;
  meetLink: string;
}

export function getSessionConfirmationEmailContent({
  name,
  therapistName,
  date,
  startTime,
  meetLink,
}: SessionConfirmationTemplateProps) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Confirmed - ${EMAIL_CONFIG.appName}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    div[style*="margin: 16px 0;"] { margin: 0 !important; }
  </style>
</head>
<body style="background-color: ${EMAIL_COLORS.bodyBg}; margin: 0 !important; padding: 0 !important;">

<table border="0" cellpadding="0" cellspacing="0" width="100%">
  <!-- HEADER -->
  <tr>
    <td align="center" style="background-color: ${EMAIL_COLORS.headerBg}; padding: 32px 16px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
        <tr>
          <td align="center" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: bold; color: var(--color-background); letter-spacing: 2px;">
            NERVAYA
          </td>
        </tr>
      </table>
    </td>
  </tr>
  
  <!-- ACCENT BAR -->
  <tr>
    <td align="center" style="background-color: ${EMAIL_COLORS.accent}; height: 4px; line-height: 4px; font-size: 4px;">
      &nbsp;
    </td>
  </tr>

  <!-- BODY CONTENT -->
  <tr>
    <td align="center" style="padding: 40px 16px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: ${EMAIL_COLORS.cardBg}; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        <tr>
          <td style="padding: 40px;">
            <div align="center" style="margin-bottom: 24px;">
                <span style="font-size: 48px;">✅</span>
            </div>
            <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 26px; font-weight: 600; color: ${EMAIL_COLORS.textPrimary}; margin: 0 0 16px 0; text-align: center;">
              Session Confirmed!
            </h1>
            
            <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; color: ${EMAIL_COLORS.textMuted}; margin: 0 0 32px 0; text-align: center;">
              Hi ${name}, your therapy session has been successfully scheduled. We're looking forward to supporting you on your journey to wellness.
            </p>

            <!-- SESSION DETAILS CARD -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${EMAIL_COLORS.bodyBg}; border-radius: 8px; margin-bottom: 32px;">
              <tr>
                <td style="padding: 24px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: ${EMAIL_COLORS.textMuted}; padding-bottom: 4px;">Therapist</td>
                        </tr>
                        <tr>
                            <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: ${EMAIL_COLORS.textPrimary}; padding-bottom: 16px;">${therapistName}</td>
                        </tr>
                        <tr>
                            <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: ${EMAIL_COLORS.textMuted}; padding-bottom: 4px;">Date & Time</td>
                        </tr>
                        <tr>
                            <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: ${EMAIL_COLORS.textPrimary};">${date} at ${startTime}</td>
                        </tr>
                    </table>
                </td>
              </tr>
            </table>

            <!-- MEET LINK SECTION -->
            <h2 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600; color: ${EMAIL_COLORS.textPrimary}; margin: 0 0 16px 0; text-align: center;">
              How to Join
            </h2>
            <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 22px; color: ${EMAIL_COLORS.textMuted}; margin: 0 0 24px 0; text-align: center;">
              Click the button below at the scheduled time to join your secure video session.
            </p>
            
            <!-- CTA BUTTON -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center" style="padding-bottom: 40px;">
                  <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" bgcolor="${EMAIL_COLORS.accent}" style="border-radius: 8px;">
                        <a href="${meetLink}" target="_blank" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: var(--color-background); text-decoration: none; border-radius: 8px; padding: 16px 32px; display: inline-block;">
                          Join Session
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- DIVIDER -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="border-top: 1px solid ${EMAIL_COLORS.border}; padding-bottom: 32px;"></td>
              </tr>
            </table>

            <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; color: ${EMAIL_COLORS.textMuted}; text-align: center; margin: 0;">
              If you need to reschedule or cancel, please do so at least 24 hours in advance through your dashboard.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td align="center" style="padding: 0 16px 40px 16px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
        <tr>
          <td align="center" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; line-height: 18px; color: ${EMAIL_COLORS.textMuted};">
            <p style="margin: 0 0 16px 0;">
              Questions? Reach out at <a href="mailto:${EMAIL_CONFIG.supportEmail}" style="color: ${EMAIL_COLORS.accent}; text-decoration: none;">${EMAIL_CONFIG.supportEmail}</a>
            </p>
            <p style="margin: 0 0 8px 0;">
              &copy; ${new Date().getFullYear()} ${EMAIL_CONFIG.appName}. All rights reserved.
            </p>
            <p style="margin: 0;">
              <a href="${EMAIL_CONFIG.appUrl}" style="color: ${EMAIL_COLORS.accent}; text-decoration: none;">nervaya.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

</body>
</html>
  `;

  const text = `
Session Confirmed!

Hi ${name}, your therapy session has been successfully scheduled.

Details:
- Therapist: ${therapistName}
- Date & Time: ${date} at ${startTime}

How to Join:
${meetLink}

If you need to reschedule or cancel, please do so through your dashboard.

Need help? Reach out at ${EMAIL_CONFIG.supportEmail}

© ${new Date().getFullYear()} ${EMAIL_CONFIG.appName}. All rights reserved.
${EMAIL_CONFIG.appUrl}
  `.trim();

  return { html, text };
}
