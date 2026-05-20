import { EMAIL_COLORS, EMAIL_CONFIG } from '../constants';

interface OtpVerificationTemplateProps {
  code: string;
  expiryMinutes?: number;
}

export function getOtpEmailContent({ code, expiryMinutes = 10 }: OtpVerificationTemplateProps) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code - ${EMAIL_CONFIG.appName}</title>
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
          <td align="center" style="padding: 40px;">
            <!-- SECURITY ICON SVG -->
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <div style="background-color: var(--color-accent-surface); border-radius: 50%; padding: 16px; margin-bottom: 24px; display: inline-block;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48">
                      <path transform="translate(9.5 6.5)" d="M28.6876 8.7738e-05V34.9092H23.0626L6.6137 11.1308H6.32393V34.9092H6.65188e-05V8.7738e-05H5.65916L22.091 23.7955H22.3978V8.7738e-05H28.6876Z" fill="${EMAIL_COLORS.accent}"/>
                    </svg>
                  </div>
                </td>
              </tr>
            </table>

            <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 600; color: ${EMAIL_COLORS.textPrimary}; margin: 0 0 16px 0;">
              Your Verification Code
            </h1>
            
            <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; color: ${EMAIL_COLORS.textMuted}; margin: 0 0 32px 0;">
              Please use the verification code below to securely sign in. It will expire in <strong>${expiryMinutes} minutes</strong>.
            </p>
            
            <!-- CODE BLOCK -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center">
                  <div style="background-color: ${EMAIL_COLORS.bodyBg}; border: 2px dashed ${EMAIL_COLORS.accent}; border-radius: 8px; padding: 24px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; color: ${EMAIL_COLORS.textPrimary}; letter-spacing: 8px;">
                      ${code}
                    </span>
                  </div>
                </td>
              </tr>
            </table>

            <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; color: ${EMAIL_COLORS.textMuted}; margin: 32px 0 0 0;">
              If you didn't request this code, you can safely ignore this email.
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
Your Verification Code

Please use the verification code below to securely sign in. It will expire in ${expiryMinutes} minutes.

Code: ${code}

If you didn't request this code, you can safely ignore this email.

© ${new Date().getFullYear()} ${EMAIL_CONFIG.appName}. All rights reserved.
${EMAIL_CONFIG.appUrl}
  `.trim();

  return { html, text };
}
