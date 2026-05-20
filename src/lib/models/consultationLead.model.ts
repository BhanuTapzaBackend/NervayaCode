import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IConsultationLead extends Document {
  firstName: string;
  lastName: string;
  connectionType: 'Google Meet' | 'Phone Call';
  email?: string;
  mobile?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const consultationLeadSchema = new Schema<IConsultationLead>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
    },
    connectionType: {
      type: String,
      enum: ['Google Meet', 'Phone Call'],
      required: [true, 'Connection type is required'],
    },
    email: {
      type: String,
      match: [/^\S{1,64}@\S{1,255}\.\S{1,63}$/, 'Please enter a valid email address'],
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      match: [/^\d{10}$/, 'Mobile number must be exactly 10 digits'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);

// Prevent double booking: Same person (email or mobile) cannot book the same time slot
consultationLeadSchema.index(
  { email: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { email: { $exists: true, $ne: null }, status: { $ne: 'cancelled' } } },
);

consultationLeadSchema.index(
  { mobile: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { mobile: { $exists: true, $ne: null }, status: { $ne: 'cancelled' } } },
);

// Also prevent anyone from booking the exact same slot if we want to limit "one consultation at a time"
// but usually these are one-on-one with many staff, or maybe the user meant "same person shouldn't double book themselves"
// "single time slot should be double booked by same person adn same time OK"
// Actually user said: "single time slot should be double booked by same person adn same time OK"
// Wait, "should be" or "should NOT be"?
// "also the date adn day Scheduling be insuch a way that single time slot should be double booked by same person adn same time OK"
// Contextually usually people mean "should NOT be". I will assume "should NOT be" double booked by same person.

const ConsultationLead: Model<IConsultationLead> =
  mongoose.models.ConsultationLead || mongoose.model<IConsultationLead>('ConsultationLead', consultationLeadSchema);

export default ConsultationLead;
