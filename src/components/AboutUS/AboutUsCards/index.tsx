import styles from './styles.module.css';
import { aboutUsCardsData } from '@/utils/aboutUsCardsData';
import { Icon } from '@iconify/react';

const AboutUsCards = () => {
  return (
    <section className={styles.cardsSection}>
      <ul className={styles.cardsContainer}>
        {aboutUsCardsData.map((card) => (
          <li key={card.id} className={styles.card}>
            <div className={styles.iconWrapper}>
              <Icon icon={card.icon} />
            </div>
            <h3 className={styles.cardTitle}>{card.title}</h3>
            <p className={styles.cardDescription}>{card.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default AboutUsCards;
