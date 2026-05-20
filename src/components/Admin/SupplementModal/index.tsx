'use client';

import React, { useState } from 'react';
import { AdminModal } from '../common';
import { SupplementFormData } from '@/types/supplement.types';
import SupplementForm from '../SupplementForm';
import styles from './styles.module.css';

const DEFAULT_FORM_DATA: SupplementFormData = {
  name: '',
  description: '',
  price: 0,
  originalPrice: 0,
  stock: 0,
  image: '',
  ingredients: [],
  benefits: [],
  isActive: true,
  images: [],
  additionalSections: [],
};

interface SupplementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SupplementFormData) => Promise<void>;
  initialData?: Partial<SupplementFormData>;
  loading?: boolean;
  title: string;
  submitLabel?: string;
}

const SupplementModal: React.FC<SupplementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
  title,
  submitLabel = 'Create Supplement',
}) => {
  const formKey = (initialData as { _id?: string })?._id ?? (isOpen ? 'new' : 'closed');

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="720px">
      <div className={styles.modalContent}>
        <p className={styles.subtitle}>Fill in the details below</p>
        <SupplementFormInner
          key={formKey}
          initialData={initialData}
          onSubmit={onSubmit}
          onClose={onClose}
          loading={loading}
          submitLabel={submitLabel}
        />
      </div>
    </AdminModal>
  );
};

interface SupplementFormInnerProps {
  initialData?: Partial<SupplementFormData>;
  onSubmit: (data: SupplementFormData) => Promise<void>;
  onClose: () => void;
  loading: boolean;
  submitLabel: string;
}

const SupplementFormInner: React.FC<SupplementFormInnerProps> = ({
  initialData,
  onSubmit,
  onClose,
  loading,
  submitLabel,
}) => {
  const [formData, setFormData] = useState<SupplementFormData | null>(
    () => ({ ...DEFAULT_FORM_DATA, ...initialData }) as SupplementFormData,
  );

  const handleSubmit = async () => {
    if (!formData) return;
    try {
      await onSubmit(formData);
      onClose();
    } catch {
      // Error is handled by the parent's toast
    }
  };

  if (!formData) return null;

  return (
    <SupplementForm
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
      submitLabel={submitLabel}
    />
  );
};

export default SupplementModal;
