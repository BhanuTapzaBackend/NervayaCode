import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import ConsultationLead from '@/lib/models/consultationLead.model';
import { ValidationError, ConflictError, NotFoundError } from '@/lib/utils/error.util';
import { claimSlot, releaseSlot } from '@/lib/services/consultation-schedule.service';
import { getMeetingProvider } from '@/lib/services/meeting-provider.service';

/**
 * Free consultations are half the length of a paid session.
 *
 * Declared once: the iCal builder hardcoded 30 while the calendar service
 * defaults to 60 for sessions, so passing nothing would have silently created
 * hour-long consultation events.
 */
const CONSULTATION_DURATION_MINS = 30;
import { sendMeetLinkViaWhatsApp } from '@/lib/services/meet-link-whatsapp.service';
import { getSlotInstant } from '@/lib/utils/sessionDateTime.util';
import type { ConsultationFiltersParams } from '@/types/consultation.types';
import type { PaginationMeta } from '@/types/pagination.types';
import nodemailer from 'nodemailer';

/**
 * Generates iCalendar content for an event
 */
function generateICal(event: {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  organizer: string;
  location?: string;
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
    ...(event.location ? [`LOCATION:${event.location}`, `URL:${event.location}`] : []),
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
  meetLink?: string;
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

  // Anchored to IST, NOT parsed as a bare local datetime.
  //
  // `new Date("2026-09-01T17:00:00")` with no offset is interpreted in the
  // SERVER's timezone — UTC on Vercel — and `formatDate` then emits it as a
  // UTC `DTSTART`. A 5:00 PM IST consultation therefore arrived in the invite
  // as 5:00 PM UTC, i.e. 10:30 PM IST: every consultation invite was 5h30m
  // late in production while looking correct on an IST developer's machine.
  // This is the same defect already fixed for therapy sessions.
  const startTime = getSlotInstant(lead.date, lead.time);
  if (!startTime) {
    console.error(`[consultation] unparseable slot "${lead.date} ${lead.time}"; skipping calendar invite`);
    return;
  }
  const endTime = new Date(startTime.getTime() + CONSULTATION_DURATION_MINS * 60000);

  // Defaults to the mailbox that actually sends this message. An ORGANIZER that
  // does not match the From: address is a leading reason Outlook rejects or
  // spam-files an iCal invite — and the previous placeholder meant every
  // phone-only lead had their "confirmation" CC'd to a fake domain.
  const organizerEmail = process.env.CONSULTATION_ORGANIZER_EMAIL?.trim() || process.env.OTP_EMAIL_USER?.trim() || '';

  const joinLine = lead.meetLink ? `\nJoin link: ${lead.meetLink}` : '';

  const icalContent = generateICal({
    title: `Nervaya 1-on-1: ${lead.firstName} ${lead.lastName}`,
    description: `Connection Method: ${lead.connectionType}\nContact: ${lead.email || lead.mobile}${joinLine}\nScheduled via Nervaya Support.`,
    startTime,
    endTime,
    organizer: organizerEmail,
    location: lead.meetLink,
  });

  const fromName = process.env.OTP_EMAIL_FROM_NAME?.trim() || 'Nervaya';
  const recipientEmail = lead.email || organizerEmail;
  // Nothing to send to, and no ops mailbox configured — skip rather than mail
  // a placeholder domain.
  if (!recipientEmail) return;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: recipientEmail,
      // Only CC ops when we actually have an ops address, and never CC the
      // recipient onto their own mail.
      ...(organizerEmail && organizerEmail !== recipientEmail ? { cc: organizerEmail } : {}),
      subject: `Consultation Booked: ${lead.firstName} ${lead.lastName}`,
      text: `Hello ${lead.firstName},\n\nYour consultation has been scheduled for ${lead.date} at ${lead.time} via ${lead.connectionType}.${
        lead.meetLink ? `\n\nJoin your video call at the scheduled time:\n${lead.meetLink}` : ''
      }\n\nA calendar invitation is attached to this email.`,
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
  email?: string;
  mobile?: string;
  date: string;
  time: string;
}) {
  await connectDB();
  const { email, mobile, date, time } = data;

  // The same person must not hold two bookings at one time. The unique indexes on the
  // model are the real guard; this check exists only to give a friendlier message.
  const duplicateQuery: Record<string, string | object> = { date, time, status: { $ne: 'cancelled' } };
  if (email) duplicateQuery.email = email;
  if (mobile) duplicateQuery.mobile = mobile;

  const alreadyBooked = await ConsultationLead.findOne(duplicateQuery);
  if (alreadyBooked) {
    throw new ValidationError('You have already booked a consultation for this time slot.');
  }

  // Mint the id up front so the slot can be claimed for this exact lead. Claiming
  // is a single atomic conditional update: concurrent bookers cannot both win.
  const leadId = new mongoose.Types.ObjectId();

  const claimed = await claimSlot(date, time, leadId);
  if (!claimed) {
    throw new ConflictError('That slot was just booked. Please choose another time.');
  }

  let lead;
  try {
    lead = await ConsultationLead.create({ _id: leadId, ...data });
  } catch (error) {
    // Never leave a slot claimed by a lead that does not exist.
    await releaseSlot(date, time, leadId);
    const mongoError = error as { code?: number };
    if (mongoError?.code === 11000) {
      throw new ValidationError('A booking for this contact at the selected time already exists.');
    }
    throw error;
  }

  // Video consultations go through the SAME provider as therapy sessions.
  // This used to hardcode a Jitsi room URL, so flipping MEETING_PROVIDER=google
  // moved sessions to Meet while consultations silently stayed on Jitsi — no
  // error, just a split estate nobody would notice until a customer asked.
  if (lead.connectionType === 'Video Call') {
    const meeting = await getMeetingProvider().createConsultationMeeting({
      leadId: lead._id.toString(),
      date: lead.date,
      startTime: lead.time,
      durationMins: CONSULTATION_DURATION_MINS,
      leadName: `${lead.firstName} ${lead.lastName}`.trim(),
      leadEmail: lead.email,
    });

    lead.meetLink = meeting.meetLink;
    lead.googleEventId = meeting.externalEventId ?? '';
    lead.meetStatus = meeting.status;
    await lead.save();

    // If the lead also gave a mobile, send the link over WhatsApp (10-digit India numbers → +91).
    if (lead.mobile && lead.meetLink) {
      sendMeetLinkViaWhatsApp({
        toE164: `+91${lead.mobile}`,
        name: lead.firstName,
        date: lead.date,
        time: lead.time,
        meetLink: lead.meetLink,
      }).catch(() => undefined);
    }
  }

  // Fire and forget email invite
  sendCalendarInvite(lead).catch(() => undefined);

  return lead;
}

/** Paginated bookings for the admin list. Filters: date range and status. */
export async function listConsultations(
  page: number,
  limit: number,
  filters: ConsultationFiltersParams = {},
): Promise<{ data: unknown[]; meta: PaginationMeta }> {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;
  if (filters.dateFrom || filters.dateTo) {
    const dateQuery: Record<string, string> = {};
    if (filters.dateFrom) dateQuery.$gte = filters.dateFrom;
    if (filters.dateTo) dateQuery.$lte = filters.dateTo;
    query.date = dateQuery;
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    ConsultationLead.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    ConsultationLead.countDocuments(query),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/**
 * Confirms or cancels a booking.
 *
 * Cancelling releases the slot back into the pool — that is why this is not a
 * one-line status write.
 */
export async function updateConsultationStatus(id: string, status: 'confirmed' | 'cancelled') {
  await connectDB();

  const lead = await ConsultationLead.findById(id);
  if (!lead) {
    throw new NotFoundError('Consultation not found');
  }

  if (lead.status === status) {
    return lead;
  }

  // Cancelling gave the slot back, and somebody else may already hold it. Re-confirming
  // would leave this lead "confirmed" while owning no slot — and a later cancel would
  // then try to release a slot that is now someone else's. Cancellation is terminal.
  if (lead.status === 'cancelled') {
    throw new ValidationError('This consultation was cancelled and its slot released. Ask the customer to rebook.');
  }

  lead.status = status;
  await lead.save();

  if (status === 'cancelled') {
    await releaseSlot(lead.date, lead.time, lead._id);

    // Remove the calendar entry too. Without this every cancelled consultation
    // leaves a live event — and a live Meet link — on the ops calendar forever.
    if (lead.googleEventId) {
      await getMeetingProvider().deleteMeeting(lead.googleEventId, { isConsultation: true });
    }
  }

  return lead;
}
