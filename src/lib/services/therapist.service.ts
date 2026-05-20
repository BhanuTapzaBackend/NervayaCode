import Therapist, { ITherapist, IConsultingHour } from '@/lib/models/therapist.model';
import { GENDER } from '../constants/enums';
import { generateSlotsFromConsultingHours } from '@/lib/services/therapistSchedule.service';
import connectDB from '@/lib/db/mongodb';
import { ValidationError } from '@/lib/utils/error.util';
import { Types } from 'mongoose';

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

  const therapistData = {
    ...data,
    slug: data.slug || (data.name ? toSlug(data.name) : ''),
    gender: data.gender || GENDER.OTHER,
    consultingHours: data.consultingHours || defaultConsultingHours,
  };

  const therapist = await Therapist.create(therapistData);

  await generateSlotsFromConsultingHours(therapist._id.toString(), new Date(), 90);

  return therapist;
}

export async function getAllTherapists(filter: Record<string, unknown> = {}) {
  await connectDB();
  const therapists = await Therapist.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  return therapists;
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

  const therapist = await Therapist.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!therapist) {
    throw new ValidationError('Therapist not found');
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
