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
}

function readConfig(): WhatsAppConfig | null {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || 'v21.0';

  if (!phoneNumberId || !accessToken || !templateName) {
    return null;
  }

  return { phoneNumberId, accessToken, apiVersion, templateName };
}

export function isWhatsAppConfigured(): boolean {
  return readConfig() !== null;
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
 * @param toE164 recipient number in E.164 (with leading "+"); stripped here.
 * @param code   the OTP value.
 * @returns the WhatsApp message id (wamid) for correlation with webhook events.
 */
export async function sendOtpTemplate(toE164: string, code: string): Promise<{ messageId: string }> {
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
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: code }],
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
