'use client';

import styles from './styles.module.css';

interface ConfirmDialogProps {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ message, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className={styles.confirmOverlay}>
      <div className={styles.confirmDialog}>
        <h3 className={styles.confirmTitle}>Confirm Action</h3>
        <p className={styles.confirmMessage}>{message}</p>
        <div className={styles.confirmButtons}>
          <button type="button" onClick={onCancel} className={styles.confirmButtonCancel}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={styles.confirmButtonConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
