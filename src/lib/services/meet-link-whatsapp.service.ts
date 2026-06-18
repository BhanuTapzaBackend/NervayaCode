import { hasWhatsAppCredentials, sendTextTemplate } from '@/lib/whatsapp/whatsapp-client';

interface MeetLinkMessage {
  toE164: string;
  name: string;
  date: string;
  time: string;
  meetLink: string;
}

/**
 * Sends a meeting-link WhatsApp message via an approved utility template.
 *
 * Fire-and-forget: never throws, so a WhatsApp/template outage never blocks a booking
 * (mirrors the email and Zoho integrations). No-ops when WhatsApp or the template is unset.
 *
 * Both templates share the same body variables, in this order:
 *   {{1}} name   {{2}} date   {{3}} time   {{4}} meeting link
 */
async function sendTemplate(templateName: string | undefined, msg: MeetLinkMessage): Promise<void> {
  const templateLanguage = process.env.WHATSAPP_SESSION_TEMPLATE_LANG?.trim() || 'en_US';

  if (!msg.toE164 || !msg.meetLink || !templateName?.trim() || !hasWhatsAppCredentials()) {
    return;
  }

  try {
    await sendTextTemplate(msg.toE164, templateName.trim(), templateLanguage, [
      msg.name || 'there',
      msg.date,
      msg.time,
      msg.meetLink,
    ]);
  } catch (error) {
    console.error('Failed to send WhatsApp meeting message:', error);
  }
}

/** At-booking / reschedule confirmation carrying the meeting link. */
export function sendMeetLinkViaWhatsApp(msg: MeetLinkMessage): Promise<void> {
  return sendTemplate(process.env.WHATSAPP_SESSION_TEMPLATE_NAME, msg);
}

/** ~1 hour-before reminder carrying the meeting link. */
export function sendSessionReminderViaWhatsApp(msg: MeetLinkMessage): Promise<void> {
  return sendTemplate(process.env.WHATSAPP_REMINDER_TEMPLATE_NAME, msg);
}
