import TherapistSchedule, { ITimeSlot } from '@/lib/models/therapistSchedule.model';
import connectDB from '@/lib/db/mongodb';
import { ValidationError } from '@/lib/utils/error.util';
import { Types, ClientSession } from 'mongoose';

export async function bookSlot(
  therapistId: string,
  date: string,
  startTime: string,
  sessionId: string,
  mongooseSession?: ClientSession,
) {
  await connectDB();
  if (!Types.ObjectId.isValid(therapistId) || !Types.ObjectId.isValid(sessionId)) {
    throw new ValidationError('Invalid Therapist ID or Session ID');
  }
  const schedule = await TherapistSchedule.findOne({ therapistId, date }).session(mongooseSession || null);
  if (!schedule) {
    throw new ValidationError('Schedule not found for this date');
  }
  const slot = schedule.slots.find((s) => s.startTime === startTime);
  if (!slot) {
    throw new ValidationError('Slot not found');
  }
  if (!slot.isAvailable) {
    throw new ValidationError('Slot is already booked');
  }
  slot.isAvailable = false;
  slot.sessionId = new Types.ObjectId(sessionId);
  schedule.markModified('slots');
  await schedule.save({ session: mongooseSession });
  return slot;
}

export async function releaseSlot(
  therapistId: string,
  date: string,
  startTime: string,
  mongooseSession?: ClientSession,
) {
  await connectDB();
  if (!Types.ObjectId.isValid(therapistId)) {
    throw new ValidationError('Invalid Therapist ID');
  }
  const schedule = await TherapistSchedule.findOne({ therapistId, date }).session(mongooseSession || null);
  if (!schedule) {
    throw new ValidationError('Schedule not found for this date');
  }
  const slot = schedule.slots.find((s) => s.startTime === startTime);
  if (!slot) {
    throw new ValidationError('Slot not found');
  }
  slot.isAvailable = true;
  slot.sessionId = undefined;
  schedule.markModified('slots');
  await schedule.save({ session: mongooseSession });
  return slot;
}

export async function updateSlot(therapistId: string, date: string, startTime: string, updates: Partial<ITimeSlot>) {
  await connectDB();
  if (!Types.ObjectId.isValid(therapistId)) {
    throw new ValidationError('Invalid Therapist ID');
  }
  const schedule = await TherapistSchedule.findOne({ therapistId, date });
  if (!schedule) {
    throw new ValidationError('Schedule not found for this date');
  }
  const slot = schedule.slots.find((s) => s.startTime === startTime);
  if (!slot) {
    throw new ValidationError('Slot not found');
  }
  Object.assign(slot, updates, { isCustomized: true });
  schedule.markModified('slots');
  await schedule.save();
  return slot;
}

export async function createCustomSlot(
  therapistId: string,
  date: string,
  startTime: string,
  endTime: string,
  isAvailable: boolean = true,
) {
  await connectDB();
  if (!Types.ObjectId.isValid(therapistId)) {
    throw new ValidationError('Invalid Therapist ID');
  }
  const schedule = await TherapistSchedule.findOne({ therapistId, date });
  const newSlot: ITimeSlot = {
    startTime,
    endTime,
    isAvailable,
    isCustomized: true,
  };
  if (schedule) {
    const existingSlot = schedule.slots.find((s) => s.startTime === startTime);
    if (existingSlot) {
      throw new ValidationError('Slot already exists for this date and time');
    }
    schedule.slots.push(newSlot);
    schedule.markModified('slots');
    await schedule.save();
    return newSlot;
  }
  const newSchedule = await TherapistSchedule.create({
    therapistId: new Types.ObjectId(therapistId),
    date,
    slots: [newSlot],
  });
  return newSchedule.slots[0];
}

export async function deleteSlot(therapistId: string, date: string, startTime: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(therapistId)) {
    throw new ValidationError('Invalid Therapist ID');
  }
  const schedule = await TherapistSchedule.findOne({ therapistId, date });
  if (!schedule) {
    throw new ValidationError('Schedule not found for this date');
  }
  const slotIndex = schedule.slots.findIndex((s) => s.startTime === startTime);
  if (slotIndex === -1) {
    throw new ValidationError('Slot not found');
  }
  schedule.slots.splice(slotIndex, 1);
  schedule.markModified('slots');
  await schedule.save();
  return { message: 'Slot deleted successfully' };
}
