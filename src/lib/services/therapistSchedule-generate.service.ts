import TherapistSchedule, { ITimeSlot } from '@/lib/models/therapistSchedule.model';
import Therapist from '@/lib/models/therapist.model';
import Session from '@/lib/models/session.model';
import connectDB from '@/lib/db/mongodb';
import { ValidationError } from '@/lib/utils/error.util';
import { formatDate, timeToMinutes, minutesToTime, generateTimeSlotsBetween } from '@/lib/utils/scheduleTime.util';
import { Types } from 'mongoose';
import { SESSION_STATUS } from '@/lib/constants/enums';

export async function generateSlotsFromConsultingHours(
  therapistId: string,
  startDate: Date = new Date(),
  numberOfDays: number = 30,
): Promise<{ insertedCount: number; modifiedCount: number }> {
  await connectDB();
  if (!Types.ObjectId.isValid(therapistId)) {
    throw new ValidationError('Invalid Therapist ID');
  }
  const therapist = await Therapist.findById(therapistId);
  if (!therapist) {
    throw new ValidationError('Therapist not found');
  }
  const consultingHours = therapist.consultingHours || [];
  if (consultingHours.length === 0) {
    return { insertedCount: 0, modifiedCount: 0 };
  }
  const sessionDuration =
    therapist.sessionDurationMins && therapist.sessionDurationMins > 0 ? therapist.sessionDurationMins : 60;
  const schedules: Array<{
    therapistId: Types.ObjectId;
    date: string;
    slots: ITimeSlot[];
  }> = [];

  for (let dayOffset = 0; dayOffset < numberOfDays; dayOffset++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + dayOffset);
    const dayOfWeek = currentDate.getDay();
    const dateString = formatDate(currentDate);
    const dayHours = consultingHours.find((ch) => ch.dayOfWeek === dayOfWeek && ch.isEnabled);

    if (dayHours) {
      const timeSlots = generateTimeSlotsBetween(dayHours.startTime, dayHours.endTime, sessionDuration);
      const slots: ITimeSlot[] = [];
      for (let i = 0; i < timeSlots.length; i++) {
        const startTime = timeSlots[i];
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = startMinutes + sessionDuration;
        const endTime = minutesToTime(endMinutes);
        slots.push({
          startTime,
          endTime,
          isAvailable: true,
          isCustomized: false,
        });
      }
      if (slots.length > 0) {
        schedules.push({
          therapistId: new Types.ObjectId(therapistId),
          date: dateString,
          slots,
        });
      }
    }
  }

  if (schedules.length > 0) {
    const dateStrings = schedules.map((s) => s.date);

    // Find active sessions for these dates to preserve booked slots
    const activeSessions = await Session.find({
      therapistId: new Types.ObjectId(therapistId),
      date: { $in: dateStrings },
      status: { $nin: [SESSION_STATUS.CANCELLED] },
    }).lean();

    const bookedSlotKeys = new Set(activeSessions.map((s) => `${s.date}|${s.startTime}`));

    const bulkOps = schedules.map((schedule) => {
      // Merge new slots with preserved booked slots
      const mergedSlots = schedule.slots.map((slot) => {
        const key = `${schedule.date}|${slot.startTime}`;
        if (bookedSlotKeys.has(key)) {
          return { ...slot, isAvailable: false };
        }
        return slot;
      });

      return {
        updateOne: {
          filter: { therapistId: schedule.therapistId, date: schedule.date },
          update: {
            $set: {
              therapistId: schedule.therapistId,
              date: schedule.date,
              slots: mergedSlots,
            },
          },
          upsert: true,
        },
      };
    });

    if (bulkOps.length > 0) {
      const result = await TherapistSchedule.bulkWrite(bulkOps);
      return {
        insertedCount: result.insertedCount || 0,
        modifiedCount: result.modifiedCount || bulkOps.length,
      };
    }
  }
  return { insertedCount: 0, modifiedCount: 0 };
}
