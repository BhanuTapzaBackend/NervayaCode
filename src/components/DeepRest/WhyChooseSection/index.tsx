'use client';

import { Icon } from '@iconify/react';
import styles from './styles.module.css';

const BENEFITS = [
  {
    id: 'neuroplasticity',
    title: 'Neuroplasticity',
    text: 'Harness the power of your brain to rewire sleep patterns.',
    icon: 'tabler:brain',
  },
  {
    id: 'better-sleep',
    title: 'Better Sleep',
    text: 'Fall asleep faster and enjoy deeper, more restful nights.',
    icon: 'solar:moon-sleep-bold-duotone',
  },
  {
    id: 'personalized',
    title: 'Personalized',
    text: 'Custom sessions tailored to your unique needs.',
    icon: 'solar:stars-bold-duotone',
  },
  {
    id: 'expert-guided',
    title: 'Expert-Guided',
    text: 'Created by certified sleep and wellness specialists.',
    icon: 'solar:shield-user-bold-duotone',
  },
] as const;

const WhyChooseSection = () => {
  return (
    <ul className={styles.whyChooseGrid} aria-label="Why choose Deep Rest Sessions">
      {BENEFITS.map((item) => {
        return (
          <li key={item.id} className={styles.whyChooseCard}>
            <div className={styles.whyChooseIcon} aria-hidden>
              <Icon icon={item.icon} />
            </div>
            <h3 className={styles.whyChooseTitle}>{item.title}</h3>
            <p className={styles.whyChooseText}>{item.text}</p>
          </li>
        );
      })}
    </ul>
  );
};

export default WhyChooseSection;
