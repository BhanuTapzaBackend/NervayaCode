'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { therapistsApi } from '@/lib/api/therapists';
import { GlobalLoader } from '@/components/common';
import AddTherapistForm from '@/components/Admin/AddTherapistForm';
import type { Therapist } from '@/types/therapist.types';

export default function EditTherapistPage() {
  const router = useRouter();
  const params = useParams();
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Therapist | null>(null);
  useEffect(() => {
    const fetchTherapist = async () => {
      if (!params.id) {
        setError('Therapist ID is required');
        setInitialLoading(false);
        return;
      }

      try {
        const result = await therapistsApi.getById(params.id as string);
        if (result.success && result.data) {
          setInitialData(result.data);
        } else {
          setError(result.message || 'Failed to fetch therapist details');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error fetching therapist details';
        setError(errorMessage);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchTherapist();
  }, [params.id]);

  if (initialLoading) {
    return <GlobalLoader label="Loading therapist details..." />;
  }

  if (error || !initialData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-error)', marginBottom: '16px' }}>{error || 'Therapist not found'}</p>
        <button
          onClick={() => router.push('/admin/therapists')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'var(--color-accent)',
            color: 'white',
            border: 'none',
          }}
        >
          Back to Therapists
        </button>
      </div>
    );
  }

  return (
    <AddTherapistForm
      therapistId={params.id as string}
      initialData={initialData}
      title="Edit Therapist"
      subtitle="Update therapist profile information"
      submitLabel="Update Therapist"
    />
  );
}
