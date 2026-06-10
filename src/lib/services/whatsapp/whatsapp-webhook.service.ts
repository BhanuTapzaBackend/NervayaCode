import crypto from 'crypto';
import connectDB from '@/lib/db/mongodb';
import WhatsAppWebhookEvent from '@/lib/models/whatsappWebhookEvent.model';
import { WHATSAPP_EVENT_TYPE, WhatsAppEventType } from '@/lib/constants/enums';

export interface ParsedWhatsAppEvent {
  eventType: WhatsAppEventType;
  messageId: string;
  status?: string;
  from?: string;
  timestamp?: Date;
}

export type SignatureCheck = { ok: true } | { ok: false; reason: 'missing_secret' | 'missing_signature' | 'invalid' };

/**
 * Verify the X-Hub-Signature-256 HMAC Meta sends with each webhook POST.
 * The signature is computed over the RAW request body, so callers must pass the
 * unparsed text (not a re-serialized object).
 */
export function verifyWhatsAppSignature(rawBody: string, signatureHeader: string | null): SignatureCheck {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    return { ok: false, reason: 'missing_secret' };
  }
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return { ok: false, reason: 'missing_signature' };
  }

  const providedBuf = Buffer.from(signatureHeader.slice('sha256='.length), 'hex');
  const expectedBuf = Buffer.from(crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex'), 'hex');

  if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return { ok: false, reason: 'invalid' };
  }
  return { ok: true };
}

/** Answer Meta's GET verification handshake. Returns the challenge to echo, or null to reject. */
export function resolveVerificationChallenge(
  mode: string | null,
  token: string | null,
  challenge: string | null,
): string | null {
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === 'subscribe' && expectedToken && token === expectedToken && challenge) {
    return challenge;
  }
  return null;
}

/** Flatten a Meta webhook payload into the status + inbound-message events we persist. */
export function parseWhatsAppWebhookEvents(body: unknown): ParsedWhatsAppEvent[] {
  const events: ParsedWhatsAppEvent[] = [];

  if (typeof body !== 'object' || body === null) {
    return events;
  }
  const entries = (body as { entry?: unknown[] }).entry;
  if (!Array.isArray(entries)) {
    return events;
  }

  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] }).changes;
    if (!Array.isArray(changes)) {
      continue;
    }

    for (const change of changes) {
      const value = (change as { value?: Record<string, unknown> }).value;
      if (!value) {
        continue;
      }
      collectStatusEvents(value.statuses, events);
      collectInboundEvents(value.messages, events);
    }
  }

  return events;
}

/**
 * Idempotently persist parsed events. Upsert on the unique messageId means a
 * replayed Meta delivery is a no-op rather than a duplicate row.
 */
export async function persistWhatsAppWebhookEvents(events: ParsedWhatsAppEvent[], rawPayload: unknown): Promise<void> {
  if (events.length === 0) {
    return;
  }
  await connectDB();
  await Promise.all(
    events.map((event) =>
      WhatsAppWebhookEvent.findOneAndUpdate(
        { messageId: event.messageId },
        { $setOnInsert: { ...event, rawPayload, processed: false } },
        { upsert: true },
      ),
    ),
  );
}

function collectStatusEvents(statuses: unknown, events: ParsedWhatsAppEvent[]): void {
  if (!Array.isArray(statuses)) {
    return;
  }
  for (const status of statuses as Array<Record<string, unknown>>) {
    if (typeof status.id !== 'string') {
      continue;
    }
    events.push({
      eventType: WHATSAPP_EVENT_TYPE.STATUS,
      messageId: status.id,
      status: typeof status.status === 'string' ? status.status : undefined,
      from: typeof status.recipient_id === 'string' ? status.recipient_id : undefined,
      timestamp: toDate(status.timestamp),
    });
  }
}

function collectInboundEvents(messages: unknown, events: ParsedWhatsAppEvent[]): void {
  if (!Array.isArray(messages)) {
    return;
  }
  for (const msg of messages as Array<Record<string, unknown>>) {
    if (typeof msg.id !== 'string') {
      continue;
    }
    events.push({
      eventType: WHATSAPP_EVENT_TYPE.INBOUND_MESSAGE,
      messageId: msg.id,
      from: typeof msg.from === 'string' ? msg.from : undefined,
      timestamp: toDate(msg.timestamp),
    });
  }
}

/** WhatsApp sends timestamps as unix-second strings. */
function toDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }
  const seconds = Number(value);
  return Number.isFinite(seconds) ? new Date(seconds * 1000) : undefined;
}
