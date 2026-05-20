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
  { id: 'introduction', number: '01', title: 'Introduction' },
  { id: 'definitions', number: '02', title: '1. Definitions' },
  { id: 'acceptance', number: '03', title: '2. Acceptance of Terms' },
  { id: 'eligibility', number: '04', title: '3. Eligibility' },
  { id: 'platform-use', number: '05', title: '4. Use of the Platform' },
  { id: 'intellectual-property', number: '06', title: '5. Intellectual Property' },
  { id: 'therapy-services', number: '07', title: '6. Therapy Services' },
  { id: 'product-purchases', number: '08', title: '7. Product Purchases' },
  { id: 'payments', number: '09', title: '8. Payments' },
  { id: 'limitation-liability', number: '10', title: '9. Limitation of Liability' },
  { id: 'third-party-links', number: '11', title: '10. Third-Party Links' },
  { id: 'termination', number: '12', title: '11. Termination' },
  { id: 'governing-law', number: '13', title: '12. Governing Law' },
  { id: 'contact', number: '14', title: '13. Contact Information' },
];

export const termsSections: PolicySection[] = [
  {
    id: 'introduction',
    number: '01',
    title: 'Introduction',
    content: {
      paragraphs: [
        'Welcome to NERVAYA (“we”, “us”, “our”). These Terms & Conditions (“Terms”) govern your access to and use of our website, mobile applications, online therapy services, digital content, supplement products, and any related services (collectively, “Services”).',
        'By accessing or using the Services in any way — including browsing, registering, purchasing products, booking therapy sessions, or interacting with our content — you agree to be legally bound by these Terms. If you do not agree with all parts of these Terms, you must not use the Services.',
      ],
    },
  },
  {
    id: 'definitions',
    number: '02',
    title: 'Definitions',
    content: {
      subsections: [
        {
          title: 'Key Terms',
          listItems: [
            {
              label: 'User/You/Customer:',
              text: 'Any individual who accesses the NERVAYA Services, including browsing the site, creating an account, purchasing supplements, or booking therapy.',
            },
            {
              label: 'Therapy Services:',
              text: 'Any mental health consultation, counselling, coaching, tele-session, or related service provided via the platform.',
            },
            { label: 'Products:', text: 'Physical wellness and dietary supplements offered for sale on the site.' },
            { label: 'Platform:', text: 'NERVAYA’s website and any connected apps, tools, or digital interfaces.' },
          ],
        },
      ],
    },
  },
  {
    id: 'acceptance',
    number: '03',
    title: 'Acceptance of Terms',
    content: {
      paragraphs: [
        'By using the Services you confirm you have read, understood, and agree to be bound by these Terms and any policies referenced herein, including our Privacy Policy and Refund & Cancellation Policy.',
        'We may update these Terms at any time. Continued use after changes constitutes acceptance of the updated Terms.',
      ],
    },
  },
  {
    id: 'eligibility',
    number: '04',
    title: 'Eligibility',
    content: {
      paragraphs: [
        'You must be at least 18 years old and legally able to enter into contracts to use our Services. By using the Services, you represent and warrant that you meet these requirements.',
      ],
    },
  },
  {
    id: 'platform-use',
    number: '05',
    title: 'Use of the Platform',
    content: {
      subsections: [
        {
          title: 'General Use',
          listItems: [
            {
              text: 'You agree to use the Services only for lawful purposes and in compliance with all applicable laws.',
            },
            { text: 'You must not misuse the Platform — including harmful, abusive, fraudulent, or illegal activity.' },
            { text: 'You are responsible for keeping login credentials confidential.' },
          ],
        },
        {
          title: 'Access & Availability',
          paragraph:
            'We do not guarantee uninterrupted service. We may suspend, discontinue, modify, or restrict access at any time without notice.',
        },
      ],
    },
  },
  {
    id: 'intellectual-property',
    number: '06',
    title: 'Intellectual Property',
    content: {
      paragraphs: [
        'All content, branding, text, imagery, software, and materials on the Platform are owned by NERVAYA or our licensors and are protected by intellectual property laws. You may not copy, reproduce, modify, or redistribute any material without our explicit written consent.',
      ],
    },
  },
  {
    id: 'therapy-services',
    number: '07',
    title: 'Therapy Services',
    content: {
      subsections: [
        {
          title: 'Booking & Sessions',
          listItems: [
            {
              text: 'Therapy Services are offered through scheduled sessions with qualified professionals affiliated with NERVAYA.',
            },
            { text: 'Your booking is confirmed only once payment is successfully processed and confirmed.' },
          ],
        },
        {
          title: 'Health Disclaimer',
          listItems: [
            {
              text: 'The Services provided do not replace emergency medical or psychiatric care. If you are in crisis or face any immediate danger, seek emergency services immediately.',
            },
            { text: 'Information on the platform is for general wellness purposes and not medical advice.' },
          ],
        },
        {
          title: 'Payments & Compliance',
          listItems: [
            {
              text: 'You agree to pay all fees specified at the time of booking. Payments must be made via the approved payment gateways on our Platform.',
            },
            {
              text: 'All sessions and services are subject to the pricing and refund/cancellation policies provided separately.',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'product-purchases',
    number: '08',
    title: 'Product Purchases (Supplements)',
    content: {
      subsections: [
        {
          title: 'Ordering',
          listItems: [
            {
              text: 'Product orders are subject to availability. Prices and product descriptions are provided on the Platform.',
            },
            { text: 'You agree that all information provided in placing an order is accurate and complete.' },
          ],
        },
        {
          title: 'Shipping & Delivery',
          paragraph:
            'Shipping timelines, methods, and charges are described at checkout and/or in the Shipping Policy.',
        },
        {
          title: 'Returns & Refunds',
          paragraph: 'Returns and refunds are governed by our Refund & Cancellation Policy linked within the Platform.',
        },
      ],
    },
  },
  {
    id: 'payments',
    number: '09',
    title: 'Payments',
    content: {
      paragraphs: [
        'All payments are processed through secure gateways. You are responsible for any taxes, duties, and applicable fees. Unauthorized transactions, chargebacks, or payment reversals may lead to account suspension or legal action.',
      ],
    },
  },
  {
    id: 'limitation-liability',
    number: '10',
    title: 'Limitation of Liability',
    content: {
      paragraphs: [
        'To the maximum extent permitted by law:',
        'NERVAYA will not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, Therapy Services, Products, or content.',
        'We assume no liability for errors, interruptions, or inaccuracies on the Platform.',
      ],
    },
  },
  {
    id: 'third-party-links',
    number: '11',
    title: 'Third-Party Links',
    content: {
      paragraphs: [
        'The Services may contain links to third-party websites or services. We do not control or endorse third-party content or practices and assume no responsibility for them.',
      ],
    },
  },
  {
    id: 'termination',
    number: '12',
    title: 'Termination',
    content: {
      paragraphs: [
        'We reserve the right to suspend or terminate your access to the Platform or Services at any time if you violate these Terms, engage in harmful activity, or for operational reasons.',
      ],
    },
  },
  {
    id: 'governing-law',
    number: '13',
    title: 'Governing Law & Dispute Resolution',
    content: {
      paragraphs: [
        'These Terms and Conditions shall be governed by and construed in accordance with the laws of India.',
        'The courts located in Bengaluru, Karnataka, India, shall have exclusive jurisdiction over any disputes arising out of or in connection with these Terms, the use of the Platform, Therapy Services, or the purchase of Products.',
      ],
    },
  },
  {
    id: 'contact',
    number: '14',
    title: 'Contact Information',
    content: {
      paragraphs: ['If you have any questions about these Terms or the Services, please contact us at:'],
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
