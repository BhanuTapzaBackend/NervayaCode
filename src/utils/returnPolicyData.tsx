import {
  ICON_HANDSHAKE,
  ICON_PILL,
  ICON_CHAT,
  ICON_HEADPHONES,
  ICON_CHART,
  ICON_SHIELD_USER,
  ICON_PHONE,
  ICON_GAVEL,
  ICON_LOCK,
} from '@/constants/icons';

export interface TOCItem {
  id: string;
  number: string;
  title: string;
}

export interface ListItem {
  label?: string;
  text: string;
}

export interface GridItem {
  icon: string;
  title: string;
  text: string;
}

export interface Subsection {
  title: string;
  paragraph?: string;
  listItems?: ListItem[];
  cookieCards?: GridItem[];
}

export interface SectionContent {
  paragraphs?: string[];
  subsections?: Subsection[];
  listItems?: ListItem[];
  gridItems?: GridItem[];
  securityCards?: GridItem[];
  cookieCards?: GridItem[];
  rightsCards?: GridItem[];
  contactItems?: {
    icon: string;
    label: string;
    text: string;
    href?: string;
  }[];
}

export interface ReturnPolicySection {
  id: string;
  number: string;
  title: string;
  content: SectionContent;
}

export const pageTitle = 'Return, Refund & Cancellation Policy';
export const pageSubtitle =
  'At NERVAYA, we strive to offer high-quality wellness supplements, therapy services, and digital wellness content. This policy explains the conditions under which returns, refunds, replacements, and cancellations are allowed. By purchasing any product or service from NERVAYA, you agree to the terms of this policy.';

export const tocItems: TOCItem[] = [
  { id: 'general-principles', number: '01', title: 'General Principles' },
  { id: 'supplements', number: '02', title: 'Supplements' },
  { id: 'therapy', number: '03', title: 'Therapy & Counselling' },
  { id: 'deep-reset', number: '04', title: 'Deep Reset' },
  { id: 'bundled-services', number: '05', title: 'Bundled Services' },
  { id: 'refund-timeline', number: '06', title: 'Refund Timeline' },
  { id: 'abuse-prevention', number: '07', title: 'Abuse Prevention' },
  { id: 'contact-info', number: '08', title: 'Contact Information' },
];

export const returnPolicySections: ReturnPolicySection[] = [
  {
    id: 'general-principles',
    number: '01',
    title: 'General Principles',
    content: {
      listItems: [
        {
          text: 'All requests related to returns, refunds, cancellations, or replacements must be raised by contacting us at [info@nervaya.com], [whatsapp - 8409179911] within the timelines mentioned below.',
        },
        {
          text: 'Refunds, if approved, will be processed to the original mode of payment within 7–10 business days.',
        },
        {
          text: 'NERVAYA reserves the right to verify all claims before approving any refund or replacement.',
        },
      ],
      gridItems: [
        {
          icon: ICON_HANDSHAKE,
          title: 'Fair Review',
          text: 'We verify all claims to ensure fairness for everyone.',
        },
      ],
    },
  },
  {
    id: 'supplements',
    number: '02',
    title: 'Supplements (Physical Products)',
    content: {
      subsections: [
        {
          title: '2.1 Return Policy',
          paragraph:
            'Due to the consumable and hygiene-sensitive nature of wellness supplements: Opened, used, or partially consumed supplements are NOT eligible for return or refund.',
        },
        {
          title: '2.2 Eligible Cases for Return / Replacement',
          paragraph: 'Returns or replacements may be approved only in the following cases:',
          listItems: [
            { text: 'You received a wrong product' },
            { text: 'The product was damaged or leaked at the time of delivery' },
            { text: 'The product was expired upon delivery' },
            {
              text: 'Requests must be raised within 48 hours of delivery, along with clear images or videos of the product and packaging.',
            },
          ],
        },
        {
          title: '2.3 Non-Returnable Cases',
          paragraph: 'No return or refund will be provided for:',
          listItems: [
            { text: 'Opened or unsealed products' },
            { text: 'Change of mind after delivery' },
            { text: 'Incorrect usage or storage by the customer' },
            { text: 'Minor variations in packaging or labeling' },
          ],
        },
      ],
      gridItems: [
        {
          icon: ICON_PILL,
          title: 'Consumables',
          text: 'Hygienic products are handled with care.',
        },
        {
          icon: ICON_GAVEL,
          title: 'Verification',
          text: '48-hour window for claims on physical products.',
        },
      ],
    },
  },
  {
    id: 'therapy',
    number: '03',
    title: 'Therapy & Counselling Sessions',
    content: {
      subsections: [
        {
          title: '3.1 Cancellation Policy',
          paragraph:
            'Therapy sessions must be cancelled at least 48 hours before the scheduled session time to be eligible for a refund or rescheduling. Cancellations made less than 48 hours before the session are non-refundable.',
        },
        {
          title: '3.2 No-Show Policy',
          paragraph:
            'If you fail to attend a scheduled session without prior cancellation, the session will be treated as a no-show and no refund will be issued.',
        },
        {
          title: '3.3 Refunds & Rescheduling',
          paragraph: 'Eligible cancellations (made ≥48 hours in advance) may be:',
          listItems: [
            { text: 'Rescheduled to a later date OR Refunded to the original payment method' },
            { text: 'Once a therapy session has been completed, no refunds will be provided.' },
          ],
        },
      ],
      gridItems: [
        {
          icon: ICON_CHAT,
          title: 'Cancellation',
          text: '48-hour notice required for refunds.',
        },
        {
          icon: ICON_LOCK,
          title: 'Secure Booking',
          text: 'Transparent rescheduling policies.',
        },
      ],
    },
  },
  {
    id: 'deep-reset',
    number: '04',
    title: 'Guided Audio Programs – “Deep Reset”',
    content: {
      subsections: [
        {
          title: '4.1 Nature of Product',
          paragraph:
            '“Deep Reset” is a digital wellness audio program and is considered a non-returnable digital product.',
        },
        {
          title: '4.2 Replacement Policy (One-Time Exception)',
          paragraph:
            'Once purchased, Deep Reset is non-refundable. However, if a user is genuinely dissatisfied, they may contact us within 7 days of purchase. After review, NERVAYA may offer a one-time replacement by providing access to an alternative audio program. This replacement is:',
          listItems: [
            { text: 'Offered only once per user' },
            { text: 'Subject to internal review and approval' },
            { text: 'Not applicable in cases of repeated requests or misuse' },
          ],
        },
        {
          title: '4.3 No Monetary Refunds',
          paragraph: 'No monetary refunds will be issued for:',
          listItems: [
            { text: 'Completed or accessed digital audio content' },
            { text: 'Perceived lack of effectiveness' },
            { text: 'Change of mind after purchase' },
          ],
        },
      ],
      gridItems: [
        {
          icon: ICON_HEADPHONES,
          title: 'Digital Nature',
          text: 'Audio content is non-returnable.',
        },
        {
          icon: ICON_HANDSHAKE,
          title: 'One-Time Exception',
          text: 'Review-based replacement available within 7 days.',
        },
      ],
    },
  },
  {
    id: 'bundled-services',
    number: '05',
    title: 'Combo / Bundled Services',
    content: {
      paragraphs: ['For bundles that include therapy, supplements, or digital content:'],
      listItems: [
        { text: 'Refunds will be calculated only for unused and eligible components' },
        { text: 'Digital content already accessed will not be refunded' },
        { text: 'Therapy sessions already completed or missed will not be refunded' },
      ],
    },
  },
  {
    id: 'refund-timeline',
    number: '06',
    title: 'Mode & Timeline of Refund',
    content: {
      listItems: [
        { text: 'Approved refunds will be processed within 7–10 business days' },
        { text: 'Refunds will be issued to the original payment method only' },
        {
          text: 'Shipping charges (if any) are non-refundable, unless the error occurred from NERVAYA’s side',
        },
      ],
      gridItems: [
        {
          icon: ICON_CHART,
          title: '7-10 Days',
          text: 'Standard processing time for refunds.',
        },
        {
          icon: ICON_HANDSHAKE,
          title: 'Original Mode',
          text: 'Refunded to your initial payment method.',
        },
      ],
    },
  },
  {
    id: 'abuse-prevention',
    number: '07',
    title: 'Abuse Prevention',
    content: {
      paragraphs: ['NERVAYA reserves the right to:'],
      listItems: [
        { text: 'Reject refund or replacement requests that appear fraudulent or abusive' },
        { text: 'Limit replacement benefits to protect the platform from misuse' },
      ],
    },
  },
  {
    id: 'contact-info',
    number: '08',
    title: 'Contact Information',
    content: {
      paragraphs: ['For all refund, return, cancellation, or replacement requests, please contact:'],
      contactItems: [
        {
          icon: ICON_PHONE,
          label: 'Call / WhatsApp',
          text: '8409179911',
        },
        {
          icon: ICON_SHIELD_USER,
          label: 'Support Email',
          text: 'info@nervaya.com',
          href: 'mailto:info@nervaya.com',
        },
      ],
    },
  },
];
