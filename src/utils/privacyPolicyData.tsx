import {
  ICON_HANDSHAKE,
  ICON_CHAT,
  ICON_CHART,
  ICON_GAVEL,
  ICON_LOCK,
  ICON_SHIELD_USER,
  ICON_CLIPBOARD,
  ICON_COOKIE,
  ICON_CHART_SIMPLE,
  ICON_SETTINGS,
  ICON_PHONE,
  ICON_BELL,
  ICON_ALERT,
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

export interface PrivacySection {
  id: string;
  number: string;
  title: string;
  content: SectionContent;
}

export const tocItems: TOCItem[] = [
  { id: 'introduction', number: '01', title: 'Introduction' },
  { id: 'information-collect', number: '02', title: 'Information We Collect' },
  { id: 'how-we-use', number: '03', title: 'How We Use Your Data' },
  { id: 'data-sharing', number: '04', title: 'Information Sharing' },
  { id: 'data-protection', number: '05', title: 'Data Protection & Security' },
  { id: 'cookies', number: '06', title: 'Cookies & Tracking' },
  { id: 'data-retention', number: '07', title: 'Data Retention' },
  { id: 'choices-consent', number: '08', title: 'Choices & Consent' },
  { id: 'policy-changes', number: '09', title: 'Changes to Policy' },
  { id: 'contact', number: '10', title: 'Contact Us' },
];

export const privacySections: PrivacySection[] = [
  {
    id: 'introduction',
    number: '01',
    title: 'Introduction',
    content: {
      paragraphs: [
        'Nervaya Private Limited (“Nervaya”) owns following website: https://www.Nervaya.com/',
        'This Privacy Policy applies to the service provided via the aforesaid website and application. This policy describes the personal information we collect from you and how we use and secure it. “Identifiable Personal Information” or “IPI” means information that can be used to identify you personally, such as an email address, a photograph with unique identifying features, etc.',
        'At Nervaya, we are committed to protecting your privacy and adhere with the applicable data protection and privacy laws. Please take some time to read through our privacy policy as this is your sole guide to understand how we aim to use the information we collect from you.',
      ],
    },
  },
  {
    id: 'information-collect',
    number: '02',
    title: 'Information We Collect',
    content: {
      subsections: [
        {
          title: 'Identifiable Personal Information (IPI)',
          paragraph: 'We may collect the following information when you provide it voluntarily:',
          listItems: [
            { label: 'Basic Info:', text: 'User’s name and location/address (optional).' },
            { label: 'Authentication:', text: 'Phone number (required for login, OTP, etc.).' },
            { label: 'Profile Media:', text: 'Photo (optional profile pic), photographs, and videos.' },
            { label: 'Preferences:', text: 'Details of products/services you are looking to buy or avail.' },
            {
              label: 'Social & Activity:',
              text: 'Facebook permissions (if sharing) and user activities (liking policies, interests).',
            },
          ],
        },
        {
          title: 'Non-Personally Identifiable Information',
          paragraph: 'We automatically collect technical data about visitors’ web activity:',
          listItems: [
            { text: 'Operating system and browser type.' },
            { text: 'Date and time of visit and referring URLs.' },
            { text: 'Internet service provider and device identifier.' },
            { text: 'Pages accessed or visited.' },
          ],
        },
      ],
    },
  },
  {
    id: 'how-we-use',
    number: '03',
    title: 'How We Use Your Data',
    content: {
      paragraphs: ['We use the information provided to deliver necessary services and assist you better:'],
      gridItems: [
        {
          icon: ICON_HANDSHAKE,
          title: 'Service Fulfillment',
          text: 'Execute your requests for products and services and process applications.',
        },
        {
          icon: ICON_CHAT,
          title: 'Relationship Building',
          text: 'Interact with you to build a relationship and conduct business.',
        },
        {
          icon: ICON_BELL,
          title: 'Notifications',
          text: 'Contact you regarding events, promotions, new products, and offers.',
        },
        {
          icon: ICON_CHART,
          title: 'Feedback',
          text: 'Attain feedback to improve our services, products, and website effectiveness.',
        },
        {
          icon: ICON_CLIPBOARD,
          title: 'Management',
          text: 'General management, invoicing, account management, and staff recruitment.',
        },
        {
          icon: ICON_GAVEL,
          title: 'Lawful Purposes',
          text: 'All other lawful purposes related to our business and contract fulfillment.',
        },
      ],
    },
  },
  {
    id: 'data-sharing',
    number: '04',
    title: 'Information Sharing',
    content: {
      subsections: [
        {
          title: 'Third-Party Disclosure',
          paragraph: 'We share information with third parties only as described in this policy:',
          listItems: [
            { text: 'With parent companies, subsidiaries, or joint ventures under common control.' },
            { text: 'With authorized service providers for fraud prevention, customer service, and research.' },
            { text: 'These parties are bound to use IPI only for Nervaya-authorized purposes.' },
          ],
        },
        {
          title: 'Mandatory Sharing',
          paragraph: 'Nervaya will disclose information when necessarily required by:',
          listItems: [
            { text: 'Law inquiries or judicial processes.' },
            { text: 'Government inquiries.' },
            { text: 'Suspicion of policy violations or to protect the safety of any person.' },
          ],
        },
      ],
    },
  },
  {
    id: 'data-protection',
    number: '05',
    title: 'Data Protection & Security',
    content: {
      paragraphs: [
        'Nervaya takes adequate steps to protect the information we collect, maintaining administrative, technical, and physical safeguards.',
        'While we follow industry standards and take reasonable measures to minimize risks like hacking, we disclaim liability for errors in transmissions or unauthorized access by third parties.',
      ],
      securityCards: [
        {
          icon: ICON_SHIELD_USER,
          title: 'Access Control',
          text: 'Only authorized personnel are provided access to sensitive info, under strict confidentiality agreements.',
        },
        {
          icon: ICON_LOCK,
          title: 'Encryption',
          text: 'We use accepted standards of technology and operational security to protect data from loss or destruction.',
        },
        {
          icon: ICON_CLIPBOARD,
          title: 'Security Policy',
          text: 'We follow a network-wide security policy to protect the integrity of the personal information we collect.',
        },
        {
          icon: ICON_ALERT,
          title: 'Risk Management',
          text: 'We take reasonable measures to prevent and minimize risks associated with internet-based transmissions.',
        },
      ],
    },
  },
  {
    id: 'cookies',
    number: '06',
    title: 'Cookies & Tracking',
    content: {
      paragraphs: [
        'Cookies are small text files that assist us in providing a customized experience and making navigation easier.',
        'We primarily use cookies to enhance your online experience and facilitate registration, not to track habits unless permitted.',
      ],
      subsections: [
        {
          title: 'Cookie Management',
          cookieCards: [
            {
              icon: ICON_COOKIE,
              title: 'Experience',
              text: 'Help us ensure your information is directed to you and remember you as a prior user.',
            },
            {
              icon: ICON_CHART_SIMPLE,
              title: 'Analysis',
              text: 'Improve customer experience by anonymously logging operational systems and browser types.',
            },
            {
              icon: ICON_SETTINGS,
              title: 'Choice',
              text: 'Most browsers permit you to decline cookies, though some site functionality may be impaired.',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'data-retention',
    number: '07',
    title: 'Data Retention',
    content: {
      paragraphs: [
        'Contact information is kept as long as required for the purposes it was collected, or until a user requests deletion.',
        'Mailing lists and discussion posts are kept for a reasonable period to facilitate requests. Outdated info is destroyed securely.',
        'We may retain copies for internal record-keeping or compliance with applicable laws and professional standards.',
      ],
    },
  },
  {
    id: 'choices-consent',
    number: '08',
    title: 'Choices & Consent',
    content: {
      paragraphs: [
        'Personal information is provided to Nervaya voluntarily. Visitors may subsequently choose to withdraw consent or unsubscribe.',
        'Nervaya will provide instructions on the appropriate website area or in communications regarding how to exercise these choices.',
      ],
    },
  },
  {
    id: 'policy-changes',
    number: '09',
    title: 'Changes to Policy',
    content: {
      paragraphs: [
        'Nervaya reserves the right to make changes to this privacy policy without the need of your consent.',
        'We will post all policy changes on this page and notify through a prominent notice if the changes are significant.',
        'By using our services and website, you agree to abide by our privacy policy.',
      ],
    },
  },
  {
    id: 'contact',
    number: '10',
    title: 'Contact Us',
    content: {
      paragraphs: ['If you have any questions regarding our privacy, feel free to contact us:'],
      contactItems: [
        {
          icon: ICON_CHAT,
          label: 'Email',
          text: 'info@nervaya.com',
          href: 'mailto:info@nervaya.com',
        },
        {
          icon: ICON_PHONE,
          label: 'Phone',
          text: '8409179911',
          href: 'tel:8409179911',
        },
      ],
    },
  },
];
