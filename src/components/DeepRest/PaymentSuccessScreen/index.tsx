'use client';

import { useEffect, useState } from 'react';
import styles from './styles.module.css';

export interface PaymentSuccessDetails {
  paymentId: string;
  razorpayOrderId: string;
  orderId: string;
  amount: number;
  date: Date;
}

interface PaymentSuccessScreenProps extends PaymentSuccessDetails {
  onComplete: () => void;
}

const REDIRECT_DELAY_SECONDS = 4;

export const PaymentSuccessScreen: React.FC<PaymentSuccessScreenProps> = ({
  paymentId,
  razorpayOrderId,
  amount,
  date,
  onComplete,
}) => {
  const [countdown, setCountdown] = useState(REDIRECT_DELAY_SECONDS);

  useEffect(() => {
    if (countdown <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onComplete]);

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.checkmark} aria-hidden="true">
          &#10003;
        </div>
        <h2 className={styles.heading}>Payment Successful!</h2>

        <div className={styles.receiptTable}>
          <div className={styles.receiptRow}>
            <span className={styles.receiptLabel}>Session</span>
            <span className={styles.receiptValue}>Deep Rest Session</span>
          </div>
          <div className={styles.receiptRow}>
            <span className={styles.receiptLabel}>Amount</span>
            <span className={`${styles.receiptValue} ${styles.amountValue}`}>
              &#8377;{amount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className={styles.receiptRow}>
            <span className={styles.receiptLabel}>Date</span>
            <span className={styles.receiptValue}>
              {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className={styles.receiptRow}>
            <span className={styles.receiptLabel}>Payment ID</span>
            <span className={styles.receiptValue}>{paymentId}</span>
          </div>
          <div className={styles.receiptRow}>
            <span className={styles.receiptLabel}>Order ID</span>
            <span className={styles.receiptValue}>{razorpayOrderId}</span>
          </div>
        </div>

        <p className={styles.redirectNote}>
          Redirecting to your questionnaire in
          <span className={styles.countdown}>{countdown}</span>
        </p>
      </div>
    </div>
  );
};
