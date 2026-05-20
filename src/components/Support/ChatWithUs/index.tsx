'use client';

import styles from './styles.module.css';
import { Icon } from '@iconify/react';
import { usePathname } from 'next/navigation';
import { ICON_WHATSAPP_SOLID, ICON_CHAT, ICON_CLOCK, ICON_HEADPHONES, ICON_SHIELD_CHECK } from '@/constants/icons';
import { Button } from '@/components/common';
import { trackWhatsappSupportClicked } from '@/utils/analytics';

const STATS = [
  { icon: ICON_CLOCK, value: '24/7', label: 'Available to message' },
  { icon: ICON_HEADPHONES, value: '< 2 hr', label: 'Typical response time' },
  { icon: ICON_SHIELD_CHECK, value: '100%', label: 'Private & confidential' },
];

const ChatWithUs = () => {
  const pathname = usePathname();

  const handleWhatsAppClick = () => {
    const phoneNumber = '1234567890';
    const message = encodeURIComponent('Hello! I need support with your product.');
    const destination = `https://wa.me/${phoneNumber}?text=${message}`;
    trackWhatsappSupportClicked({
      support_entry_point: 'Support Page Chat Banner',
      page_type: pathname,
    });
    window.open(destination, '_blank');
  };

  return (
    <section className={styles.section} aria-label="Chat with us">
      <span className={styles.eyebrow}>GET IN TOUCH</span>

      <div className={styles.grid}>
        <div className={styles.copy}>
          <div className={styles.titleRow}>
            <Icon icon={ICON_WHATSAPP_SOLID} className={styles.whatsappIcon} aria-hidden />
            <h2 className={styles.title}>Chat with us on WhatsApp</h2>
          </div>
          <p className={styles.desc}>
            Connect directly with our sleep wellness experts. Get personalized guidance, product recommendations, and
            answers to every question on your way to better sleep - no forms, no waiting on hold.
          </p>

          <Button variant="primary" className={styles.cta} onClick={handleWhatsAppClick}>
            <Icon icon={ICON_CHAT} width={20} height={20} className={styles.ctaIcon} aria-hidden />
            <span>Start a WhatsApp chat</span>
          </Button>
          <p className={styles.disclaimer}>
            We typically respond within 2 hours. Your information is always kept confidential.
          </p>
        </div>

        <ul className={styles.statsCol}>
          {STATS.map((stat) => (
            <li key={stat.label} className={styles.statCard}>
              <span className={styles.statIcon}>
                <Icon icon={stat.icon} aria-hidden />
              </span>
              <div className={styles.statText}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default ChatWithUs;
