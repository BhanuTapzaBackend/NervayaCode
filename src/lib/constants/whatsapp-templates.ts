/**
 * Approved WhatsApp message templates for meeting-link delivery.
 *
 * Names and language are fixed in code (not env): create templates with these exact
 * names under language en_US in the WhatsApp Manager. Both use four ordered body
 * variables — {{1}} name, {{2}} date, {{3}} time, {{4}} meeting link.
 *
 * (The OTP template stays env-driven in whatsapp-client.ts; it predates this file.)
 */
export const WHATSAPP_TEMPLATE_LANGUAGE = 'en_US';

export const WHATSAPP_TEMPLATES = {
  /** At-booking / reschedule confirmation carrying the meeting link. */
  SESSION_LINK: { name: 'nervaya_session_link', language: WHATSAPP_TEMPLATE_LANGUAGE },
  /** ~1 hour-before reminder carrying the meeting link.  CURRENTLY NOT USED*/
  SESSION_REMINDER: { name: 'nervaya_session_reminder', language: WHATSAPP_TEMPLATE_LANGUAGE },
} as const;

export type WhatsAppTemplate = (typeof WHATSAPP_TEMPLATES)[keyof typeof WHATSAPP_TEMPLATES];
