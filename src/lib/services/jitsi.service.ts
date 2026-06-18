// Import from jose subpaths (not the barrel) to keep the bundle lean, mirroring jwt.util.ts.
import { SignJWT } from 'jose/jwt/sign';
import { importPKCS8 } from 'jose/key/import';

// JaaS (Jitsi as a Service) credentials — generated in the 8x8 JaaS console.
const JAAS_APP_ID = process.env.JAAS_APP_ID;
const JAAS_KID = process.env.JAAS_KID;
const JAAS_PRIVATE_KEY = process.env.JAAS_PRIVATE_KEY;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nervaya.com';

/** Deterministic room identifier derived from the session id. Single source of truth. */
export function getRoomName(sessionId: string): string {
  return `nervaya-${sessionId}`;
}

/** Absolute URL to the embedded in-app meeting page (used by Join buttons and emails). */
export function getRoomUrl(sessionId: string): string {
  return `${APP_URL}/session/${sessionId}/room`;
}

/** Room identifier for an (anonymous) free 1-on-1 consultation lead. */
export function getConsultationRoomName(leadId: string): string {
  return `nervaya-consult-${leadId}`;
}

/** Absolute URL to the public consultation meeting page (emailed to the lead). */
export function getConsultationRoomUrl(leadId: string): string {
  return `${APP_URL}/consultation/${leadId}/room`;
}

export interface JaasTokenUser {
  id: string;
  name: string;
  email?: string;
  isModerator: boolean;
}

/**
 * Mints a short-lived JaaS JWT (RS256) scoped to a single room.
 * Returns null when JaaS is not configured, mirroring the prior Google Meet fallback
 * so booking flows never break in environments without video credentials.
 */
export async function mintJaasToken(roomName: string, user: JaasTokenUser): Promise<string | null> {
  if (!JAAS_APP_ID || !JAAS_KID || !JAAS_PRIVATE_KEY) {
    console.warn('JaaS configuration missing. Video token generation skipped.');
    return null;
  }

  try {
    // Env-stored PEM keys often arrive with escaped newlines; normalise them.
    const privateKey = await importPKCS8(JAAS_PRIVATE_KEY.replace(/\\n/g, '\n'), 'RS256');

    return await new SignJWT({
      aud: 'jitsi',
      iss: 'chat',
      sub: JAAS_APP_ID,
      room: roomName,
      context: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          moderator: user.isModerator,
        },
        features: {
          livestreaming: false,
          recording: false,
          transcription: false,
          'outbound-call': false,
        },
      },
    })
      .setProtectedHeader({ alg: 'RS256', kid: JAAS_KID, typ: 'JWT' })
      .setIssuedAt()
      .setNotBefore('-10s')
      .setExpirationTime('2h')
      .sign(privateKey);
  } catch (error) {
    console.error('Error generating JaaS token:', error);
    return null;
  }
}
