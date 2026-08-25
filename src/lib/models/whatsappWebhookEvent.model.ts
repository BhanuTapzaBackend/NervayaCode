import mongoose, { Schema, Model, Document } from 'mongoose';
import { WHATSAPP_EVENT_TYPE, WHATSAPP_EVENT_TYPE_VALUES, WhatsAppEventType } from '@/lib/constants/enums';

export interface IWhatsAppWebhookEvent extends Document {
  /** 'status' (delivery receipt) or 'inbound_message' (user-sent message). */
  eventType: WhatsAppEventType;
  /** WhatsApp message id (wamid) — unique, used for idempotent persistence. */
  messageId: string;
  /** Delivery status for status events: sent | delivered | read | failed. */
  status?: string;
  /** E.164 of the message sender (inbound) or recipient (status). */
  from?: string;
  /** Event timestamp reported by WhatsApp. */
  timestamp?: Date;
  /** Full raw Meta payload, retained for audit/debugging. */
  rawPayload: unknown;
  /** Set true once downstream processing has consumed this event. */
  processed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const whatsappWebhookEventSchema = new Schema<IWhatsAppWebhookEvent>(
  {
    eventType: {
      type: String,
      enum: WHATSAPP_EVENT_TYPE_VALUES,
      required: true,
      default: WHATSAPP_EVENT_TYPE.STATUS,
    },
    messageId: {
      type: String,
      required: true,
      unique: true,
    },
    status: { type: String },
    from: { type: String },
    timestamp: { type: Date },
    rawPayload: { type: Schema.Types.Mixed },
    processed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

whatsappWebhookEventSchema.index({ eventType: 1 });
whatsappWebhookEventSchema.index({ status: 1 });

// Force Mongoose to use the updated schema in development. Without this the model
// compiled before a schema change survives hot-reload, and `strict: true` silently
// drops the new field on write — the update succeeds having written nothing.
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.WhatsAppWebhookEvent;
}

const WhatsAppWebhookEvent: Model<IWhatsAppWebhookEvent> =
  mongoose.models.WhatsAppWebhookEvent ||
  mongoose.model<IWhatsAppWebhookEvent>('WhatsAppWebhookEvent', whatsappWebhookEventSchema);

export default WhatsAppWebhookEvent;
