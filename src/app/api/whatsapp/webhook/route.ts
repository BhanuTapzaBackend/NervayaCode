import { NextRequest, NextResponse } from 'next/server';
import {
  resolveVerificationChallenge,
  verifyWhatsAppSignature,
  parseWhatsAppWebhookEvents,
  persistWhatsAppWebhookEvents,
} from '@/lib/services/whatsapp/whatsapp-webhook.service';

/**
 * GET — Meta webhook verification handshake. Meta calls this once when the
 * webhook URL is registered; we echo back the challenge as raw text.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const challenge = resolveVerificationChallenge(
    params.get('hub.mode'),
    params.get('hub.verify_token'),
    params.get('hub.challenge'),
  );

  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

/**
 * POST — incoming WhatsApp events (delivery statuses + inbound messages).
 * Verifies the HMAC signature, then idempotently persists each event. Always
 * returns 200 once verified so Meta does not retry-storm; persistence failures
 * are logged server-side rather than surfaced.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const signature = verifyWhatsAppSignature(rawBody, request.headers.get('x-hub-signature-256'));
  if (!signature.ok) {
    if (signature.reason === 'missing_secret') {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const events = parseWhatsAppWebhookEvents(body);
    await persistWhatsAppWebhookEvents(events, body);
  } catch (error) {
    // Signature is already verified; swallow persistence errors so Meta gets a
    // 200 and doesn't retry-storm, but log server-side for observability.
    console.error('[WhatsApp Webhook] Failed to persist events:', error);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
