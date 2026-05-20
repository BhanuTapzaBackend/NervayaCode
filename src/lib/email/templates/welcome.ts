import { EMAIL_COLORS, EMAIL_CONFIG } from '../constants';

interface WelcomeTemplateProps {
  name: string;
}

export function getWelcomeEmailContent({ name }: WelcomeTemplateProps) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${EMAIL_CONFIG.appName}</title>
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

  <!-- HERO IMAGE -->
  <tr>
    <td align="center" style="background-color: ${EMAIL_COLORS.headerBg};">
      <img src="${EMAIL_CONFIG.welcomeHeroImageUrl}" alt="A serene night sky" width="600" style="display: block; width: 100%; max-width: 600px; height: auto;" />
    </td>
  </tr>

  <!-- BODY CONTENT -->
  <tr>
    <td align="center" style="padding: 40px 16px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: ${EMAIL_COLORS.cardBg}; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        <tr>
          <td style="padding: 40px;">
            <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 26px; font-weight: 600; color: ${EMAIL_COLORS.textPrimary}; margin: 0 0 16px 0; text-align: center;">
              Welcome to deeper sleep, ${name}.
            </h1>
            
            <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; color: ${EMAIL_COLORS.textMuted}; margin: 0 0 32px 0; text-align: center;">
              Your account is ready. Discover your natural sleep rhythm, release anxiety, and wake up feeling lighter and more refreshed every single day.
            </p>
            
            <!-- CTA BUTTON -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center" style="padding-bottom: 40px;">
                  <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" bgcolor="${EMAIL_COLORS.accent}" style="border-radius: 8px;">
                        <a href="${EMAIL_CONFIG.appUrl}/sleep-assessment" target="_blank" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: var(--color-background); text-decoration: none; border-radius: 8px; padding: 16px 32px; display: inline-block;">
                          Take Free Sleep Assessment
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

            <h2 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600; color: ${EMAIL_COLORS.textPrimary}; margin: 0 0 24px 0; text-align: center;">
              What's waiting for you
            </h2>

            <!-- FEATURES LIST -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 24px; color: ${EMAIL_COLORS.textMuted};">
              <tr>
                <td align="center" style="padding-bottom: 16px;">
                  <span style="font-size: 20px; vertical-align: middle; margin-right: 8px;">🌙</span> <strong>Deep Rest Sessions</strong> - Deep Rest naturally
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom: 16px;">
                  <span style="font-size: 20px; vertical-align: middle; margin-right: 8px;">🌿</span> <strong>Natural Supplements</strong> - Safe for daily use
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom: 16px;">
                  <span style="font-size: 20px; vertical-align: middle; margin-right: 8px;">💬</span> <strong>Therapy Corner</strong> - Personalized support
                </td>
              </tr>
            </table>
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
              Need help? Reach out to our support team at <a href="mailto:${EMAIL_CONFIG.supportEmail}" style="color: ${EMAIL_COLORS.accent}; text-decoration: none;">${EMAIL_CONFIG.supportEmail}</a>
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
Welcome to deeper sleep, ${name}.

Your account is ready. Discover your natural sleep rhythm, release anxiety, and wake up feeling lighter and more refreshed every single day.

Take your Free Sleep Assessment here:
${EMAIL_CONFIG.appUrl}/sleep-assessment

What's waiting for you:
- Deep Rest Sessions (Deep Rest naturally)
- Natural Supplements (Safe for daily use)
- Therapy Corner (Personalized support)

Need help? Reach out to our support team at ${EMAIL_CONFIG.supportEmail}

© ${new Date().getFullYear()} ${EMAIL_CONFIG.appName}. All rights reserved.
${EMAIL_CONFIG.appUrl}
  `.trim();

  return { html, text };
}
