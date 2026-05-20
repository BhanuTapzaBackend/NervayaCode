import { Icon } from '@iconify/react';
import { ICON_CHAT } from '@/constants/icons';
import Button from '@/components/common/Button';
import styles from './styles.module.css';

const SupportCards = () => {
  return (
    <div className={styles.supportSection}>
      <div className={styles.supportCard}>
        <div className={styles.supportContent}>
          <div className={styles.supportIcon}>
            <Icon icon={ICON_CHAT} width={32} height={32} />
          </div>
          <div className={styles.supportTextContainer}>
            <h3 className={styles.cardHeading}>Not Satisfied with the session?</h3>
            <p className={styles.cardParagraph}>You can request for an additional session free of charge</p>
          </div>
        </div>
        <Button href="/deep-rest/sessions" variant="secondary" size="md" fullWidth={false}>
          Request Re-Session
        </Button>
      </div>

      <div className={styles.supportCard}>
        <div className={styles.supportContent}>
          <div className={styles.supportIcon}>
            <Icon icon={ICON_CHAT} width={32} height={32} />
          </div>
          <div className={styles.supportTextContainer}>
            <h3 className={styles.cardHeading}>Have doubts about Deep Rest Sessions?</h3>
            <p className={styles.cardParagraph}>Our specialists are here to help you get started</p>
          </div>
        </div>
        <Button type="button" variant="secondary" size="md" fullWidth={false}>
          Free 1 on 1 Assistance
        </Button>
      </div>
    </div>
  );
};

export default SupportCards;
