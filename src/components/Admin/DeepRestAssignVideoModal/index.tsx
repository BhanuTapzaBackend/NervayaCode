'use client';

import { useState, useEffect } from 'react';
import { AdminModal } from '../common';
import { toast } from 'sonner';
import styles from './styles.module.css';

interface DeepRestAssignVideoModalProps {
  responseId: string;
  userId: string;
  existingVideoUrl?: string;
  hasPendingReSessionRequest?: boolean;
  onClose: () => void;
  onAssign: (responseId: string, videoUrl: string) => Promise<void>;
}

const DeepRestAssignVideoModal = ({
  responseId,
  userId,
  existingVideoUrl = '',
  hasPendingReSessionRequest = false,
  onClose,
  onAssign,
}: DeepRestAssignVideoModalProps) => {
  const [videoUrl, setVideoUrl] = useState(existingVideoUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setVideoUrl(existingVideoUrl || '');
  }, [existingVideoUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = videoUrl.trim();
    if (!trimmed) {
      setError('Please provide a video URL');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onAssign(responseId, trimmed);
      toast.success('Video assigned successfully');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to assign video';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={true}
      onClose={onClose}
      title={hasPendingReSessionRequest ? 'Assign Replacement Session' : 'Assign Video'}
      maxWidth="480px"
    >
      <div className={styles.modalContent}>
        <p className={styles.modalSubtitle}>
          User ID: <code className={styles.userId}>{userId}</code>
        </p>
        {hasPendingReSessionRequest && (
          <p className={styles.requestHint}>
            This user requested a re-session. Assigning a new video will mark that request as completed.
          </p>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="video-url" className={styles.label}>
            Session URL (Google Drive, YouTube, Vimeo, or direct link)
          </label>
          <input
            id="video-url"
            type="url"
            className={styles.input}
            placeholder="https://drive.google.com/file/d/... or YouTube link"
            value={videoUrl ?? ''}
            onChange={(e) => setVideoUrl(e.target.value ?? '')}
            required
          />

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Assigning…' : hasPendingReSessionRequest ? 'Assign Replacement' : 'Assign Video'}
            </button>
          </div>
        </form>
      </div>
    </AdminModal>
  );
};

export default DeepRestAssignVideoModal;
