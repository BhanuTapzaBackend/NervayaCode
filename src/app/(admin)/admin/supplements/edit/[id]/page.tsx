'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Supplement, SupplementFormData } from '@/types/supplement.types';
import SupplementForm from '@/components/Admin/SupplementForm';
import AdminLiveEditor from '@/components/Admin/LiveEditor/AdminLiveEditor';
import ConfirmSaveModal from '@/components/Admin/ConfirmSaveModal';
import PageHeader from '@/components/PageHeader/PageHeader';
import { GlobalLoader, StatusState, Button } from '@/components/common';
import api from '@/lib/axios';
import { toast } from 'sonner';
import styles from './styles.module.css';

export default function EditSupplementPage() {
  const params = useParams();
  const router = useRouter();
  const [supplement, setSupplement] = useState<Supplement | null>(null);
  const [formData, setFormData] = useState<SupplementFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'form' | 'live'>('live');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSupplement = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = (await api.get(`/supplements/${params.id}`)) as {
          success: boolean;
          data: Supplement;
        };
        if (response.success && response.data) {
          setSupplement(response.data);
          setFormData({
            name: response.data.name,
            description: response.data.description,
            price: response.data.price,
            image: response.data.image,
            stock: response.data.stock,
            ingredients: response.data.ingredients,
            benefits: response.data.benefits,
            isActive: response.data.isActive,
            originalPrice: response.data.originalPrice,
            shortDescription: response.data.shortDescription,
            suggestedUse: response.data.suggestedUse,
            images: response.data.images,
            additionalSections: response.data.additionalSections || [],
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load supplement');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSupplement();
    }
  }, [params.id]);

  const handleOpenConfirm = (data?: SupplementFormData) => {
    if (data) setFormData(data);
    setIsConfirmModalOpen(true);
  };

  const handleFinalSave = async () => {
    if (!formData) return;
    try {
      setIsSaving(true);
      setSaveError(null);
      const response = (await api.put(`/supplements/${params.id}`, formData)) as { success: boolean };
      if (response.success) {
        toast.success('Supplement updated successfully');
        router.push('/admin/supplements');
      } else {
        setSaveError('Failed to update supplement');
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update supplement');
    } finally {
      setIsSaving(false);
      setIsConfirmModalOpen(false);
    }
  };
  const backAction = (
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

  if (loading) {
    return (
      <div className={styles.container}>
        <PageHeader title="Edit Supplement" subtitle="Update supplement information" actions={backAction} />
        <GlobalLoader label="Loading supplement details..." />
      </div>
    );
  }

  if (error || !supplement || !formData) {
    return (
      <div className={styles.container}>
        <PageHeader title="Edit Supplement" subtitle="Update supplement information" actions={backAction} />
        <StatusState
          type="error"
          title={error ? 'Error' : 'Not Found'}
          message={error || 'Supplement not found'}
          action={
            <button onClick={() => router.push('/admin/supplements')} className={styles.backButton}>
              Back to Supplements
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader title="Edit Supplement" subtitle="Update supplement information" actions={backAction} />
      {saveError && <div className={styles.error}>{saveError}</div>}
      {editMode === 'form' ? (
        <SupplementForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={async () => handleOpenConfirm()}
          initialData={supplement}
          submitLabel="Update Supplement"
          loading={isSaving}
        />
      ) : (
        <AdminLiveEditor
          formData={formData}
          setFormData={setFormData}
          onSave={async () => handleOpenConfirm()}
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
