'use client';

import React from 'react';
import { Button } from '@/components/common';
import { Icon } from '@iconify/react';
import { ICON_SAVE_FANCY, ICON_INFO_FANCY } from '@/constants/icons';
import { SupplementFormData } from '@/types/supplement.types';
import styles from './styles.module.css';

interface ConfirmSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: SupplementFormData;
  loading: boolean;
}

const ConfirmSaveModal: React.FC<ConfirmSaveModalProps> = ({ isOpen, onClose, onConfirm, data, loading }) => {
  if (!isOpen) return null;

  const changedFields = [
    { label: 'Name', value: data.name },
    { label: 'Price', value: `₹${data.price}` },
    { label: 'Stock', value: data.stock },
    { label: 'Short Description', value: data.shortDescription },
    { label: 'Additional Sections', value: data.additionalSections?.length || 0 },
  ].filter((f) => f.value !== undefined && f.value !== '');

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.iconCircle}>
            <Icon icon={ICON_SAVE_FANCY} width={24} height={24} />
          </div>
          <div>
            <h2 className={styles.title}>Confirm Product Changes</h2>
            <p className={styles.subtitle}>Review your updates before saving</p>
          </div>
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryLabel}>
            <Icon icon={ICON_INFO_FANCY} />
            Overview of updates:
          </div>
          <ul className={styles.changeList}>
            {changedFields.map((field) => (
              <li key={field.label} className={styles.changeItem}>
                <span className={styles.fieldName}>{field.label}:</span>
                <span className={styles.fieldValue}>{field.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Continue Editing
          </Button>
          <Button variant="primary" onClick={onConfirm} loading={loading}>
            Save Changes Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmSaveModal;
