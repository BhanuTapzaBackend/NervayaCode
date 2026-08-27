import Therapist, { ITherapist, IConsultingHour } from '@/lib/models/therapist.model';
import { GENDER } from '../constants/enums';
import { generateSlotsFromConsultingHours } from '@/lib/services/therapistSchedule.service';
import connectDB from '@/lib/db/mongodb';
import { ConflictError, ValidationError } from '@/lib/utils/error.util';
import { Types } from 'mongoose';
import { normalizePriority } from '@/lib/constants/priority.constants';
import { prioritySortStages, stripPrioritySortKey } from '@/lib/utils/priority-sort.util';
import { validateEmail } from '@/lib/utils/validation.util';
import { syncTherapistLinkByEmail, demoteTherapistUsers } from '@/lib/services/auth/role-resolution.service';

/**
 * The unique index is the authority on email collisions, not any pre-check —
 * two admins saving the same address concurrently both pass a `findOne` and
 * only the write fails. Translate that failure into a 409 so the admin sees
 * "already assigned" instead of an opaque 500.
 */
function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}

/** Emails are stored lowercase; compare and persist through this to stay consistent. */
function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function assertValidTherapistEmail(email: string): void {
  if (!validateEmail(email)) {
    throw new ValidationError('A valid therapist email is required');
  }
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function createTherapist(data: Partial<ITherapist>) {
  await connectDB();
  const defaultConsultingHours: IConsultingHour[] = [
    {
      dayOfWeek: 0,
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      isEnabled: false,
    },
    {
      dayOfWeek: 1,
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      isEnabled: true,
    },
    {
      dayOfWeek: 2,
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      isEnabled: true,
    },
    {
      dayOfWeek: 3,
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      isEnabled: true,
    },
    {
      dayOfWeek: 4,
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      isEnabled: true,
    },
    {
      dayOfWeek: 5,
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      isEnabled: true,
    },
    {
      dayOfWeek: 6,
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      isEnabled: false,
    },
  ];

  const email = normalizeEmail(data.email);
  assertValidTherapistEmail(email);

  const therapistData = {
    ...data,
    email,
    slug: data.slug || (data.name ? toSlug(data.name) : ''),
    gender: data.gender || GENDER.OTHER,
    consultingHours: data.consultingHours || defaultConsultingHours,
  };

  let therapist;
  try {
    therapist = await Therapist.create(therapistData);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new ConflictError('That email is already assigned to another therapist');
    }
    throw error;
  }

  await generateSlotsFromConsultingHours(therapist._id.toString(), new Date(), 90);

  // Promote a matching account now rather than waiting for their next login.
  await syncTherapistLinkByEmail(therapist._id.toString(), email);

  return therapist;
}

export async function getAllTherapists(filter: Record<string, unknown> = {}) {
  await connectDB();
  // Admin priority first (1 = top); un-numbered therapists fall to the bottom,
  // newest-first. See priority-sort.util.ts for why this is an aggregation.
  const therapists = await Therapist.aggregate([
    { $match: filter },
    ...prioritySortStages(),
    { $limit: 200 },
    stripPrioritySortKey(),
  ]);
  return therapists as ITherapist[];
}

export async function getTherapistById(id: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid Therapist ID');
  }
  const therapist = await Therapist.findById(id).lean();
  if (!therapist) {
    throw new ValidationError('Therapist not found');
  }
  return therapist;
}

export async function updateTherapist(id: string, data: Partial<ITherapist>) {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid Therapist ID');
  }

  const updateData: Partial<ITherapist> = { ...data };
  if (!updateData.slug && updateData.name) {
    updateData.slug = toSlug(updateData.name);
  }

  // Clamp admin input: 0, negatives and junk all mean "not prioritized".
  if ('priority' in data) {
    updateData.priority = normalizePriority(data.priority);
  }

  // Capture the outgoing address before the write: reassigning a therapist's
  // email must demote whoever held the role under the old one, or a stale
  // THERAPIST account keeps access to the therapist area.
  let previousEmail: string | null = null;
  if ('email' in data) {
    const email = normalizeEmail(data.email);
    assertValidTherapistEmail(email);
    updateData.email = email;

    const current = await Therapist.findById(id).select('email').lean();
    previousEmail = current?.email ?? null;
  }

  let therapist;
  try {
    therapist = await Therapist.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new ConflictError('That email is already assigned to another therapist');
    }
    throw error;
  }

  if (!therapist) {
    throw new ValidationError('Therapist not found');
  }

  if (updateData.email) {
    await syncTherapistLinkByEmail(therapist._id.toString(), updateData.email, previousEmail);
  }

  return therapist;
}

export async function deleteTherapist(id: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid Therapist ID');
  }
  const therapist = await Therapist.findByIdAndDelete(id);
  if (!therapist) {
    throw new ValidationError('Therapist not found');
  }

  // Revoke the role. Role resolution only self-heals for a user who signs in,
  // and sessions now last five days with sliding renewal — a deleted therapist
  // could otherwise keep therapist-area access, and their client list, for
  // weeks after the profile is gone.
  await demoteTherapistUsers(therapist._id.toString());

  return { message: 'Therapist deleted successfully' };
}

export async function getConsultingHours(therapistId: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(therapistId)) {
    throw new ValidationError('Invalid Therapist ID');
  }
  const therapist = await Therapist.findById(therapistId);
  if (!therapist) {
    throw new ValidationError('Therapist not found');
  }
  return therapist.consultingHours || [];
}

export async function updateConsultingHours(therapistId: string, consultingHours: IConsultingHour[]) {
  await connectDB();
  if (!Types.ObjectId.isValid(therapistId)) {
    throw new ValidationError('Invalid Therapist ID');
  }

  const therapist = await Therapist.findById(therapistId);
  if (!therapist) {
    throw new ValidationError('Therapist not found');
  }

  for (const hour of consultingHours) {
    if (hour.dayOfWeek < 0 || hour.dayOfWeek > 6) {
      throw new ValidationError('Invalid day of week. Must be 0-6 (Sunday-Saturday)');
    }
    if (hour.isEnabled) {
      if (!hour.startTime || !hour.endTime) {
        throw new ValidationError(`Start time and end time are required for enabled days (Day ${hour.dayOfWeek})`);
      }
      const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
      if (!timeRegex.test(hour.startTime) || !timeRegex.test(hour.endTime)) {
        throw new ValidationError('Time must be in format "HH:MM AM/PM"');
      }
    }
  }

  therapist.consultingHours = consultingHours.map((h) => ({
    dayOfWeek: h.dayOfWeek,
    startTime: h.startTime,
    endTime: h.endTime,
    isEnabled: h.isEnabled,
  }));

  therapist.markModified('consultingHours');
  await therapist.save();

  const saved = await Therapist.findById(therapistId);
  if (!saved) {
    throw new ValidationError('Failed to verify save');
  }

  return saved.consultingHours || [];
}
