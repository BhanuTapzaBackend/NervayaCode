export type DriftOffPaymentStatus = 'pending' | 'paid' | 'failed';

export interface IDriftOffOrder {
  _id: string;
  userId: string;
  amount: number;
  paymentStatus: DriftOffPaymentStatus;
  razorpayOrderId?: string;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDriftOffAnswer {
  questionId: string;
  answer: string | string[];
}

export interface IDriftOffResponse {
  _id: string;
  userId: string;
  driftOffOrderId: string;
  answers: IDriftOffAnswer[];
  completedAt: Date | null;
  assignedVideoUrl?: string;
  assignedAt?: Date;
  reSessionRequestedAt?: Date | null;
  reSessionResolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface CreateDriftOffOrderInput {
  amount: number;
}

export interface AssignVideoInput {
  videoUrl: string;
}

export interface SaveDriftOffAnswerInput {
  questionId: string;
  answer: string | string[];
}

export interface SubmitDriftOffAssessmentInput {
  driftOffOrderId: string;
  answers: IDriftOffAnswer[];
}
