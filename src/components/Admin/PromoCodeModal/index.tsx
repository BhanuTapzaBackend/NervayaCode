'use client';

import React from 'react';
import { AdminModal } from '../common';
import type { CreatePromoCodeDto, PromoCode } from '@/types/supplement.types';
import PromoCodeForm from '../PromoCodeForm';
import styles from './styles.module.css';

interface PromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePromoCodeDto) => Promise<void>;
  initialData?: PromoCode | null;
  loading?: boolean;
  title: string;
  submitLabel?: string;
}

const PromoCodeModal: React.FC<PromoCodeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
  title,
  submitLabel = 'Create Promo Code',
}) => {
  const handleSubmit = async (data: CreatePromoCodeDto) => {
    try {
      await onSubmit(data);
      onClose();
    } catch {
      // Error is handled by the parent's toast
    }
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="540px">
      <div className={styles.modalContent}>
        <p className={styles.subtitle}>Fill in the details below</p>
        <PromoCodeForm
          key={initialData?._id ?? (isOpen ? 'new' : 'closed')}
          onSubmit={handleSubmit}
          initialData={initialData ?? null}
          loading={loading}
          submitLabel={submitLabel}
        />
      </div>
    </AdminModal>
  );
};

export default PromoCodeModal;
