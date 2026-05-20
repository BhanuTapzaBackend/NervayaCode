import React from 'react';
import Image from 'next/image';
import { IMAGES } from '@/utils/imageConstants';
import styles from './styles.module.css';

interface StatusStateProps {
  type: 'empty' | 'error';
  title?: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: 'card' | 'minimal';
}

const CONFIG = {
  empty: {
    image: IMAGES.NO_DATA_FOUND,
    defaultTitle: 'No Data Found',
    defaultMessage: 'There are no items to display at the moment.',
  },
  error: {
    image: IMAGES.API_ERROR,
    defaultTitle: 'Something Went Wrong',
    defaultMessage: 'We encountered an error while fetching the data. Please try again later.',
  },
};

const StatusState: React.FC<StatusStateProps> = ({
  type,
  title,
  message,
  action,
  className = '',
  variant = 'minimal',
}) => {
  const config = CONFIG[type];
  const isMinimal = variant === 'minimal';

  return (
    <div className={`${styles.container} ${isMinimal ? styles.minimal : ''} ${className}`}>
      <div className={`${styles.imageWrapper} ${isMinimal ? styles.imageWrapperLarge : ''}`}>
        <Image
          src={config.image}
          alt={title || config.defaultTitle}
          width={isMinimal ? 400 : 250}
          height={isMinimal ? 400 : 250}
          className={styles.image}
          priority
        />
      </div>
      <h3 className={styles.title}>{title || config.defaultTitle}</h3>
      <p className={styles.message}>{message || config.defaultMessage}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
};

export default StatusState;
