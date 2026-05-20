import styles from './LoadingScreen.module.css';
import { Icon } from '@iconify/react';
import { ICON_LOADING } from '@/constants/icons';

export default function LoadingScreen() {
  return (
    <div className={styles.loadingContainer}>
      <Icon icon={ICON_LOADING} className={styles.loaderIcon} />
    </div>
  );
}
