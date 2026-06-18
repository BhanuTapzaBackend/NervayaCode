import { hasWhatsAppCredentials, sendTextTemplate } from '@/lib/whatsapp/whatsapp-client';
import { WHATSAPP_TEMPLATES, type WhatsAppTemplate } from '@/lib/constants/whatsapp-templates';

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
 * (mirrors the email and Zoho integrations). No-ops when WhatsApp creds are absent.
 *
 * Template name + language come from WHATSAPP_TEMPLATES (in code, en_US). Body variables,
 * in order: {{1}} name, {{2}} date, {{3}} time, {{4}} meeting link.
 */
async function sendTemplate(template: WhatsAppTemplate, msg: MeetLinkMessage): Promise<void> {
  if (!msg.toE164 || !msg.meetLink || !hasWhatsAppCredentials()) {
    return;
  }

  try {
    await sendTextTemplate(msg.toE164, template.name, template.language, [
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
  return sendTemplate(WHATSAPP_TEMPLATES.SESSION_LINK, msg);
}

/** ~1 hour-before reminder carrying the meeting link. */
export function sendSessionReminderViaWhatsApp(msg: MeetLinkMessage): Promise<void> {
  return sendTemplate(WHATSAPP_TEMPLATES.SESSION_REMINDER, msg);
}
