import mongoose, { Schema, Model, Document } from 'mongoose';
import { GENDER, Gender } from '../constants/enums';

export interface IConsultingHour {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
}

export interface ITherapist extends Document {
  name: string;
  slug?: string;
  email?: string;
  qualifications: string[];
  experience: number;
  gender: Gender;
  languages: string[];
  specializations: string[];
  image?: string;
  introVideoUrl?: string;
  introVideoThumbnail?: string;
  galleryImages?: string[];
  bio?: string;
  bioLong?: string;
  quote?: string;
  messageToClient?: string;
  sessionFee?: number;
  sessionDurationMins?: number;
  sessionModes?: string[];
  testimonials?: Array<{
    name: string;
    message: string;
    clientSince?: string;
  }>;
  isAvailable: boolean;
  consultingHours?: IConsultingHour[];
  createdAt: Date;
  updatedAt: Date;
}

const therapistSchema = new Schema<ITherapist>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    qualifications: {
      type: [String],
      required: [true, 'Qualifications are required'],
    },
    experience: {
      type: Number,
      required: [true, 'Experience is required'],
    },
    gender: {
      type: String,
      enum: Object.values(GENDER),
      default: GENDER.OTHER,
      required: [true, 'Gender is required'],
    },
    languages: {
      type: [String],
      required: [true, 'Languages are required'],
    },
    specializations: {
      type: [String],
      required: [true, 'Specializations are required'],
    },
    image: {
      type: String,
      default: '',
    },
    introVideoUrl: {
      type: String,
      default: '',
    },
    introVideoThumbnail: {
      type: String,
      default: '',
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      default: '',
    },
    bioLong: {
      type: String,
      default: '',
    },
    quote: {
      type: String,
      default: '',
    },
    messageToClient: {
      type: String,
      default: '',
    },
    sessionFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    sessionDurationMins: {
      type: Number,
      default: 0,
      min: 0,
    },
    sessionModes: {
      type: [String],
      default: [],
    },
    testimonials: {
      type: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },
          message: {
            type: String,
            required: true,
            trim: true,
          },
          clientSince: {
            type: String,
            default: '',
            trim: true,
          },
        },
      ],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    consultingHours: {
      type: [
        {
          dayOfWeek: {
            type: Number,
            required: true,
            min: 0,
            max: 6,
          },
          startTime: {
            type: String,
            required: true,
          },
          endTime: {
            type: String,
            required: true,
          },
          isEnabled: {
            type: Boolean,
            default: true,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

therapistSchema.index({ isAvailable: 1, createdAt: -1 });

const Therapist: Model<ITherapist> =
  mongoose.models.Therapist || mongoose.model<ITherapist>('Therapist', therapistSchema);

export default Therapist;
