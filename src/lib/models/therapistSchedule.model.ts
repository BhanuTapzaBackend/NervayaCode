import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ITimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isCustomized: boolean;
  sessionId?: mongoose.Types.ObjectId;
}

export interface ITherapistSchedule extends Document {
  therapistId: mongoose.Types.ObjectId;
  date: string;
  slots: ITimeSlot[];
  createdAt: Date;
  updatedAt: Date;
}

const timeSlotSchema = new Schema<ITimeSlot>(
  {
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
      required: true,
    },
    isCustomized: {
      type: Boolean,
      default: false,
      required: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
  },
  { _id: false },
);

const therapistScheduleSchema = new Schema<ITherapistSchedule>(
  {
    therapistId: {
      type: Schema.Types.ObjectId,
      ref: 'Therapist',
      required: [true, 'Therapist ID is required'],
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
      index: true,
    },
    slots: {
      type: [timeSlotSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

therapistScheduleSchema.index({ therapistId: 1, date: 1 }, { unique: true });

const TherapistSchedule: Model<ITherapistSchedule> =
  mongoose.models.TherapistSchedule || mongoose.model<ITherapistSchedule>('TherapistSchedule', therapistScheduleSchema);

export default TherapistSchedule;
