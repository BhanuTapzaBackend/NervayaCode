import { Gender } from '@/lib/constants/enums';

export interface ConsultingHour {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
}

export interface Therapist {
  _id: string;
  name: string;
  slug?: string;
  email?: string;
  qualifications?: string[];
  experience?: number;
  languages?: string[];
  specializations?: string[];
  gender?: Gender;
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
  consultingHours?: ConsultingHour[];
}
