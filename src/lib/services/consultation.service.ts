import connectDB from '@/lib/db/mongodb';
import ConsultationLead from '@/lib/models/consultationLead.model';
import { ValidationError } from '@/lib/utils/error.util';
import nodemailer from 'nodemailer';

/**
 * Converts a time string like "10:30 AM" to "10:30" or "02:45 PM" to "14:45"
 */
function convertTo24Hour(timeStr: string) {
  if (!timeStr) return '00:00';
  const parts = timeStr.split(' ');
  if (parts.length < 2) return timeStr; // Already in 24h or invalid

  const [time, modifier] = parts;
  const [hours, minutes] = time.split(':');

  let h = parseInt(hours, 10);
  if (modifier === 'PM' && h < 12) h += 12;
  if (modifier === 'AM' && h === 12) h = 0;

  return `${h.toString().padStart(2, '0')}:${minutes || '00'}`;
}

/**
 * Generates iCalendar content for an event
 */
function generateICal(event: {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  organizer: string;
}) {
  const formatDate = (date: Date) => `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(event.startTime)}`,
    `DTEND:${formatDate(event.endTime)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    `ORGANIZER;CN=Nervaya Support:mailto:${event.organizer}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Sends a calendar invite via email
 */
async function sendCalendarInvite(lead: {
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  connectionType: string;
  email?: string;
  mobile?: string;
}) {
  const user = process.env.OTP_EMAIL_USER;
  const appPassword = process.env.OTP_EMAIL_APP_PASSWORD;

  if (!user?.trim() || !appPassword?.trim()) {
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: user.trim(),
      pass: appPassword.trim(),
    },
  });

  const startTime = new Date(`${lead.date}T${convertTo24Hour(lead.time)}:00`);
  const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutes duration

  const organizerEmail = 'tonystalk@example.com'; // Placeholder as per user request

  const icalContent = generateICal({
    title: `Nervaya 1-on-1: ${lead.firstName} ${lead.lastName}`,
    description: `Connection Method: ${lead.connectionType}\nContact: ${lead.email || lead.mobile}\nScheduled via Nervaya Support.`,
    startTime,
    endTime,
    organizer: organizerEmail,
  });

  const fromName = process.env.OTP_EMAIL_FROM_NAME?.trim() || 'Nervaya';
  const recipientEmail = lead.email || organizerEmail;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: recipientEmail,
      cc: organizerEmail, // Keep user looped in
      subject: `Consultation Booked: ${lead.firstName} ${lead.lastName}`,
      text: `Hello ${lead.firstName},\n\nYour consultation has been scheduled for ${lead.date} at ${lead.time} via ${lead.connectionType}.\n\nA calendar invitation is attached to this email.`,
      alternatives: [
        {
          contentType: 'text/calendar; charset=UTF-8; method=REQUEST',
          content: icalContent,
        },
      ],
    });
  } catch {}
}

export async function createConsultationLead(data: {
  firstName: string;
  lastName: string;
  connectionType: string;
  email: string;
  mobile: string;
  date: string;
  time: string;
}) {
  await connectDB();
  try {
    const { email, mobile, date, time } = data;

    // Check for double booking (handled by unique index but better UX to check first)
    const existingQuery: Record<string, string | object> = { date, time, status: { $ne: 'cancelled' } };
    if (email) existingQuery.email = email;
    if (mobile) existingQuery.mobile = mobile;

    const existingLead = await ConsultationLead.findOne(existingQuery);
    if (existingLead) {
      throw new ValidationError('You have already booked a consultation for this time slot.');
    }

    const lead = await ConsultationLead.create(data);

    // Fire and forget email invite
    sendCalendarInvite(lead).catch(() => undefined);

    return lead;
  } catch (error) {
    const mongoError = error as { code?: number };
    if (mongoError?.code === 11000) {
      throw new ValidationError('A booking for this contact at the selected time already exists.');
    }
    throw error;
  }
}
