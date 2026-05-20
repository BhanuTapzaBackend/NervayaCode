import { ICON_CHAT, ICON_PHONE } from '@/constants/icons';

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
  gridItems?: GridItem[];
}

export interface SectionContent {
  paragraphs?: string[];
  subsections?: Subsection[];
  gridItems?: GridItem[];
  contactItems?: {
    icon: string;
    label: string;
    text: string;
    href?: string;
  }[];
}

export interface PolicySection {
  id: string;
  number: string;
  title: string;
  content: SectionContent;
}

export const tocItems: TOCItem[] = [
  { id: 'shipping-partners', number: '01', title: 'Shipping Partners' },
  { id: 'serviceable-locations', number: '02', title: 'Serviceable Locations' },
  { id: 'processing-time', number: '03', title: 'Order Processing Time' },
  { id: 'delivery-timeline', number: '04', title: 'Estimated Delivery Timeline' },
  { id: 'shipping-charges', number: '05', title: 'Shipping Charges' },
  { id: 'order-tracking', number: '06', title: 'Order Tracking' },
  { id: 'delivery-attempts', number: '07', title: 'Delivery Attempts' },
  { id: 'damaged-packages', number: '08', title: 'Damaged or Missing' },
  { id: 'address-accuracy', number: '09', title: 'Address Accuracy' },
  { id: 'non-delivery-services', number: '10', title: 'Non-Delivery of Services' },
  { id: 'modify-policy', number: '11', title: 'Right to Modify' },
  { id: 'contact', number: '12', title: 'Contact Information' },
];

export const deliverySections: PolicySection[] = [
  {
    id: 'shipping-partners',
    number: '01',
    title: 'Shipping Partners',
    content: {
      paragraphs: [
        'NERVAYA uses third-party logistics providers, including but not limited to providers like Shiprocket and Delhivery, to ensure reliable and timely delivery of supplement orders across India.',
      ],
    },
  },
  {
    id: 'serviceable-locations',
    number: '02',
    title: 'Serviceable Locations',
    content: {
      subsections: [
        {
          title: 'Coverage',
          listItems: [
            { text: 'We currently deliver only within India.' },
            { text: 'Delivery availability may vary based on the customer’s pin code and courier partner coverage.' },
          ],
        },
      ],
    },
  },
  {
    id: 'processing-time',
    number: '03',
    title: 'Order Processing Time',
    content: {
      subsections: [
        {
          title: 'Handling',
          listItems: [
            {
              text: 'Orders are typically processed within 24–48 business hours after successful payment confirmation.',
            },
            { text: 'Orders placed on weekends or public holidays will be processed on the next business day.' },
          ],
        },
      ],
    },
  },
  {
    id: 'delivery-timeline',
    number: '04',
    title: 'Estimated Delivery Timeline',
    content: {
      subsections: [
        {
          title: 'Timeline by Location',
          listItems: [
            { label: 'Metro Cities:', text: '2–5 business days' },
            { label: 'Non-Metro / Remote Locations:', text: '4–8 business days' },
          ],
        },
        {
          title: 'Potential Delays',
          paragraph: 'Delivery timelines are estimated and may vary due to:',
          listItems: [
            { text: 'Courier partner delays' },
            { text: 'Weather conditions' },
            { text: 'Operational issues' },
            { text: 'Government restrictions or force majeure events' },
          ],
        },
      ],
    },
  },
  {
    id: 'shipping-charges',
    number: '05',
    title: 'Shipping Charges',
    content: {
      subsections: [
        {
          title: 'Costs',
          listItems: [
            { text: 'Shipping charges, if applicable, will be clearly displayed at checkout before payment.' },
            { text: 'Promotional free-shipping offers, if any, will be communicated on the Platform.' },
          ],
        },
      ],
    },
  },
  {
    id: 'order-tracking',
    number: '06',
    title: 'Order Tracking',
    content: {
      subsections: [
        {
          title: 'Notification',
          listItems: [
            { text: 'Once your order is shipped, you will receive a tracking link via email or SMS.' },
            { text: 'Tracking updates are provided directly by our courier partners.' },
          ],
        },
      ],
    },
  },
  {
    id: 'delivery-attempts',
    number: '07',
    title: 'Delivery Attempts & Failed Delivery',
    content: {
      paragraphs: ['Courier partners usually make 2–3 delivery attempts.'],
      subsections: [
        {
          title: 'Failed Delivery Scenarios',
          paragraph: 'If delivery fails due to incorrect address, unavailability, or refusal by the customer:',
          listItems: [
            { text: 'The order may be returned to origin' },
            { text: 'Re-shipping charges may be applicable' },
            { text: 'Refunds (if any) will exclude shipping charges' },
          ],
        },
      ],
    },
  },
  {
    id: 'damaged-packages',
    number: '08',
    title: 'Damaged or Missing Packages',
    content: {
      subsections: [
        {
          title: 'Reporting Issues',
          paragraph: 'If you receive a package that is damaged, leaked, tampered with, or missing items:',
          listItems: [
            { text: 'Please report it to support@nervaya.com within 48 hours of delivery.' },
            { text: 'Include clear photos or videos of the package and product.' },
            { text: 'Claims raised after 48 hours may not be eligible for resolution.' },
          ],
        },
      ],
    },
  },
  {
    id: 'address-accuracy',
    number: '09',
    title: 'Address Accuracy',
    content: {
      paragraphs: [
        'Customers are responsible for providing complete and accurate delivery information. NERVAYA is not responsible for delays or non-delivery caused by incorrect or incomplete address details.',
      ],
    },
  },
  {
    id: 'non-delivery-services',
    number: '10',
    title: 'Non-Delivery of Services',
    content: {
      paragraphs: [
        'Therapy sessions and digital products are delivered electronically and do not involve physical shipping. No shipping charges apply to digital or service-based offerings.',
      ],
    },
  },
  {
    id: 'modify-policy',
    number: '11',
    title: 'Right to Modify Policy',
    content: {
      paragraphs: [
        'NERVAYA reserves the right to modify this Delivery & Shipping Policy at any time. Any changes will be effective immediately upon posting on the Platform.',
      ],
    },
  },
  {
    id: 'contact',
    number: '12',
    title: 'Contact Information',
    content: {
      paragraphs: ['For delivery-related queries, please contact us:'],
      contactItems: [
        {
          icon: ICON_CHAT,
          label: 'Email',
          text: 'info@nervaya.com',
          href: 'mailto:info@nervaya.com',
        },
        {
          icon: ICON_PHONE,
          label: 'Phone / WhatsApp',
          text: '8409179911',
          href: 'tel:+918409179911',
        },
      ],
    },
  },
];
