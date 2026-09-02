export interface FooterLink {
  text: string;
  href: string;
  isHeading?: boolean;
}

export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

export const FOOTER_LINK_GROUPS: FooterLinkGroup[] = [
  {
    title: 'Products',
    links: [
      { text: 'Therapy Corner', href: '/therapy-corner' },
      { text: 'Deep Rest', href: '/deep-rest' },
      { text: 'Sleep Supplements', href: '/sleep-supplements' },
    ],
  },
  {
    title: 'Company',
    links: [
      { text: 'About Us', href: '/about-us', isHeading: true },
      { text: 'Delivery Policy', href: '/delivery-policy' },
      { text: 'Privacy Policy', href: '/privacy-policy' },
      { text: 'T & C', href: '/terms-and-conditions' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { text: 'Sleep Assessment', href: '/sleep-assessment' },
      { text: 'Support', href: '/support' },
      { text: 'The Sleep Blog', href: '/sleep-blog' },
      { text: 'Product FAQs', href: '/support#faqs' },
      { text: 'Sleep FAQs', href: '/sleep-blog#faqs' },
    ],
  },
];

export const SOCIAL_LINKS = [
  {
    name: 'linkedin',
    icon: '/icons/linked_in.svg',
    alt: 'LinkedIn',
    href: 'https://www.linkedin.com/company/nervayaa/',
  },
  { name: 'facebook', icon: '/icons/facebook.svg', alt: 'Facebook', href: 'https://facebook.com/61568062491083' },
  {
    name: 'instagram',
    icon: '/icons/instagram.svg',
    alt: 'Instagram',
    href: 'https://www.instagram.com/_u/nervayaofficial?fbclid=IwY2xjawScjwxleHRuA2FlbQIxMQBicmlkETFLVlNYUzJkaEh3eUR0UVdac3J0YwZhcHBfaWQBMAABHt3M-VcNsePs4nkk5PKOGgW16YuAjkWSXIf7iaHIdXoVbrKxSEidOvcpk3Mm_aem_B9SKSl0F9xLmw2Jgn3faGw',
  },
] as const;
