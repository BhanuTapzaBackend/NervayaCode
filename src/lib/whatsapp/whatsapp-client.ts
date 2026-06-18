import axios, { isAxiosError } from 'axios';

/**
 * Thin client over the Meta WhatsApp Cloud API (Graph API).
 * Env is read at call time (not module load) so missing credentials degrade
 * gracefully to the console OTP fallback instead of throwing at import.
 */

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
  templateName: string;
  templateLanguage: string;
}

function readConfig(): WhatsAppConfig | null {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || 'v21.0';
  // Must match the locale the template was APPROVED under (e.g. en_US, en_GB).
  // A mismatched code triggers Graph API error #132001 ("does not exist in the translation").
  const templateLanguage = process.env.WHATSAPP_OTP_TEMPLATE_LANG?.trim() || 'en_US';

  if (!phoneNumberId || !accessToken || !templateName) {
    return null;
  }

  return { phoneNumberId, accessToken, apiVersion, templateName, templateLanguage };
}

export function isWhatsAppConfigured(): boolean {
  return readConfig() !== null;
}

interface WhatsAppBaseConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
}

/** Base creds shared by all message types (template name supplied per-call). */
function readBaseConfig(): WhatsAppBaseConfig | null {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || 'v21.0';

  if (!phoneNumberId || !accessToken) {
    return null;
  }

  return { phoneNumberId, accessToken, apiVersion };
}

export function hasWhatsAppCredentials(): boolean {
  return readBaseConfig() !== null;
}

/**
 * Send a WhatsApp template message whose body has ordered text variables ({{1}}, {{2}}, ...).
 * Generic helper for utility templates such as the session/consultation meeting-link message.
 *
 * @param toE164            recipient in E.164 (leading "+" is stripped here).
 * @param templateName      the APPROVED template name in the WhatsApp Manager.
 * @param templateLanguage  locale the template was approved under (e.g. en_US).
 * @param bodyParams        values for the body variables, in template order.
 */
export async function sendTextTemplate(
  toE164: string,
  templateName: string,
  templateLanguage: string,
  bodyParams: string[],
): Promise<{ messageId: string }> {
  const base = readBaseConfig();
  if (!base) {
    throw new WhatsAppSendError('WhatsApp is not configured');
  }

  const to = toE164.replace(/^\+/, '');
  const url = `https://graph.facebook.com/${base.apiVersion}/${base.phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: templateLanguage },
      components: bodyParams.length
        ? [{ type: 'body', parameters: bodyParams.map((text) => ({ type: 'text', text })) }]
        : [],
    },
  };

  try {
    const { data } = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${base.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    const messageId = data?.messages?.[0]?.id;
    if (!messageId) {
      throw new WhatsAppSendError('WhatsApp API returned no message id');
    }
    return { messageId };
  } catch (error) {
    if (error instanceof WhatsAppSendError) throw error;
    if (isAxiosError(error)) {
      const apiError = error.response?.data?.error;
      throw new WhatsAppSendError(apiError?.message || 'WhatsApp send failed', apiError?.code, apiError?.error_subcode);
    }
    throw new WhatsAppSendError('WhatsApp send failed');
  }
}

export class WhatsAppSendError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly subcode?: number,
  ) {
    super(message);
    this.name = 'WhatsAppSendError';
  }
}

/**
 * Send a WhatsApp authentication-template message carrying a one-time code.
 *
 * Authentication templates require the OTP value to be passed BOTH as the body
 * parameter and as the copy-code button URL parameter, otherwise the Graph API
 * rejects the request.
 *
 * @param toE164  recipient number in E.164 (with leading "+"); stripped here.
 * @param code    the OTP value.
 * @param purpose fills the template's second body variable ("...OTP code for {{2}}").
 * @returns the WhatsApp message id (wamid) for correlation with webhook events.
 */
export async function sendOtpTemplate(toE164: string, code: string, purpose: string): Promise<{ messageId: string }> {
  const config = readConfig();
  if (!config) {
    throw new WhatsAppSendError('WhatsApp is not configured');
  }

  // Graph API expects the recipient without the leading "+".
  const to = toE164.replace(/^\+/, '');
  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: config.templateName,
      language: { code: config.templateLanguage },
      components: [
        {
          type: 'body',
          // Order must match the template: {{1}} = code, {{2}} = purpose.
          parameters: [
            { type: 'text', text: code },
            { type: 'text', text: purpose },
          ],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: code }],
        },
      ],
    },
  };

  try {
    const { data } = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    const messageId = data?.messages?.[0]?.id;
    if (!messageId) {
      throw new WhatsAppSendError('WhatsApp API returned no message id');
    }
    return { messageId };
  } catch (error) {
    if (error instanceof WhatsAppSendError) throw error;
    if (isAxiosError(error)) {
      const apiError = error.response?.data?.error;
      throw new WhatsAppSendError(apiError?.message || 'WhatsApp send failed', apiError?.code, apiError?.error_subcode);
    }
    throw new WhatsAppSendError('WhatsApp send failed');
  }
}
