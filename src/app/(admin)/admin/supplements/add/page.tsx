'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { SupplementFormData } from '@/types/supplement.types';
import SupplementForm from '@/components/Admin/SupplementForm';
import AdminLiveEditor from '@/components/Admin/LiveEditor/AdminLiveEditor';
import ConfirmSaveModal from '@/components/Admin/ConfirmSaveModal';
import PageHeader from '@/components/PageHeader/PageHeader';
import { Button } from '@/components/common';
import api from '@/lib/axios';
import { toast } from 'sonner';
import styles from './styles.module.css';

export default function AddSupplementPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editMode, setEditMode] = useState<'form' | 'live'>('live');

  const [formData, setFormData] = useState<SupplementFormData | null>({
    name: '',
    description: '',
    price: 0,
    image: '',
    stock: 0,
    ingredients: [],
    benefits: [],
    isActive: true,
    originalPrice: 0,
    shortDescription: '',
    suggestedUse: '',
    images: [],
    additionalSections: [],
  });

  const handleOpenConfirm = () => {
    if (!formData) return;
    setIsConfirmModalOpen(true);
  };

  const handleFinalSave = async () => {
    if (!formData) return;
    try {
      setIsSaving(true);
      setError(null);
      const response = (await api.post('/supplements', formData)) as { success: boolean };
      if (response.success) {
        toast.success('Supplement created successfully');
        router.push('/admin/supplements');
      } else {
        setError('Failed to create supplement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create supplement');
    } finally {
      setIsSaving(false);
      setIsConfirmModalOpen(false);
    }
  };
  const headerActions = (
    <div className={styles.headerActions}>
      <Button
        variant={editMode === 'live' ? 'secondary' : 'primary'}
        onClick={() => setEditMode(editMode === 'live' ? 'form' : 'live')}
        className={styles.toggleButton}
      >
        <Icon icon={editMode === 'live' ? 'solar:settings-bold' : 'solar:eye-bold'} />
        {editMode === 'live' ? 'Switch to Standard Form' : 'Switch to Live Editor'}
      </Button>
    </div>
  );

  if (!formData) return null;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Add New Supplement"
        subtitle="Create a new supplement entry for your store"
        actions={headerActions}
      />

      {error && <div className={styles.error}>{error}</div>}

      {editMode === 'form' ? (
        <SupplementForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={async () => handleOpenConfirm()}
          submitLabel="Create Supplement"
          loading={isSaving}
        />
      ) : (
        <AdminLiveEditor
          formData={formData}
          setFormData={setFormData}
          onSave={() => handleOpenConfirm()}
          loading={isSaving}
        />
      )}

      {isConfirmModalOpen && (
        <ConfirmSaveModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleFinalSave}
          data={formData}
          loading={isSaving}
        />
      )}
    </div>
  );
}
