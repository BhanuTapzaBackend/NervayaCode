import { NextResponse } from 'next/server';

import User from '@/lib/models/user.model';
import connectDB from '@/lib/db/mongodb';
import { errorResponse } from '@/lib/utils/response.util';

/**
 * HTTP 428 Precondition Required — "you must supply something before this will
 * work". Verified unused elsewhere in this app, so the client can treat it as
 * unambiguously meaning "collect a phone number and retry".
 *
 * Signalled by STATUS CODE, deliberately not by a body field: `errorResponse`
 * discards its second argument and always returns `data: null`, so any flag put
 * there would never reach the client.
 */
export const PHONE_REQUIRED_STATUS = 428;

const PHONE_REQUIRED_MESSAGE = 'A verified WhatsApp number is required to continue';

/**
 * Blocks an action until the account has a phone number.
 *
 * Signup no longer collects one, so this is what actually enforces it where it
 * matters — booking a session and placing an order, both of which depend on
 * WhatsApp for links and delivery updates. The modal in the UI is convenience;
 * THIS is the enforcement. A client that skips the modal still gets a 428.
 *
 * Returns null when the user may proceed, or a 428 response to return as-is.
 */
export async function requirePhone(userId: string): Promise<NextResponse | null> {
  await connectDB();

  const user = await User.findById(userId).select('phone phoneVerified mergedIntoUserId').lean();

  // An absorbed account has surrendered its number, so it fails the `!phone`
  // check below anyway — but check explicitly so the intent survives any future
  // change to that condition. This blocks orders and session bookings from a
  // token issued before the merge.
  if (user?.mergedIntoUserId || !user?.phone) {
    return NextResponse.json(errorResponse(PHONE_REQUIRED_MESSAGE, null, PHONE_REQUIRED_STATUS), {
      status: PHONE_REQUIRED_STATUS,
    });
  }

  return null;
}
