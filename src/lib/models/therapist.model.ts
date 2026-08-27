import mongoose, { Schema, Model, Document } from 'mongoose';
import { GENDER, Gender } from '../constants/enums';
import { UNPRIORITIZED } from '../constants/priority.constants';

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
  /** Admin display order — 1 shows first; UNPRIORITIZED means "not numbered". */
  priority: number;
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
    // Load-bearing identity, not a display field: this is the therapist's Google
    // sign-in address, the value that promotes their User to THERAPIST, and the
    // mailbox the Calendar service account impersonates for their sessions.
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S{1,64}@\S{1,255}\.\S{1,63}$/, 'Please enter a valid email'],
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
    priority: {
      type: Number,
      default: UNPRIORITIZED,
      min: 1,
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

therapistSchema.index({ isAvailable: 1, priority: 1, createdAt: -1 });

// A plain unique index, deliberately NOT partial: email is required, so there is
// no legitimate null to exclude. A partial index would silently permit several
// therapists sharing '', breaking the 1:1 email <-> therapist invariant that both
// role resolution and calendar impersonation depend on.
//
// Mongoose cannot apply this to a collection that still holds duplicate ''
// values, and autoIndex failures surface on an event nobody listens to. Run
// `npx tsx --env-file=.env scripts/migrate-therapist-email-index.ts` first.
therapistSchema.index({ email: 1 }, { unique: true, name: 'email_1' });

// Force Mongoose to use the updated schema in development. Without this the
// model compiled before a schema change survives hot-reload, and `strict: true`
// silently drops the new field on write — the update succeeds but nothing saves.
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.Therapist;
}

const Therapist: Model<ITherapist> =
  mongoose.models.Therapist || mongoose.model<ITherapist>('Therapist', therapistSchema);

export default Therapist;
