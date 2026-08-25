import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IConsultationSlotDoc {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  leadId: mongoose.Types.ObjectId | null;
}

export interface IConsultationSchedule extends Document {
  date: string;
  slots: IConsultationSlotDoc[];
  /** Optimistic-locking version. Every write to `slots` must bump it — see consultation-schedule.service. */
  __v: number;
  createdAt: Date;
  updatedAt: Date;
}

const consultationSlotSchema = new Schema<IConsultationSlotDoc>(
  {
    startTime: { type: String, required: [true, 'Start time is required'] },
    endTime: { type: String, required: [true, 'End time is required'] },
    isAvailable: { type: Boolean, default: true, required: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'ConsultationLead', default: null },
  },
  { _id: false },
);

const consultationScheduleSchema = new Schema<IConsultationSchedule>(
  {
    date: {
      type: String,
      required: [true, 'Date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
      unique: true,
    },
    slots: { type: [consultationSlotSchema], default: [] },
  },
  { timestamps: true },
);

// Force Mongoose to use the updated schema in development. Without this the model
// compiled before a schema change survives hot-reload, and `strict: true` silently
// drops the new field on write — the update succeeds having written nothing.
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.ConsultationSchedule;
}

const ConsultationSchedule: Model<IConsultationSchedule> =
  mongoose.models.ConsultationSchedule ||
  mongoose.model<IConsultationSchedule>('ConsultationSchedule', consultationScheduleSchema);

export default ConsultationSchedule;
