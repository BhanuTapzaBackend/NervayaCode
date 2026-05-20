'use client';

import React, { useState } from 'react';
import type { PromoCode } from '@/types/supplement.types';
import StatusState from '@/components/common/StatusState';
import { GlobalLoader } from '@/components/common/GlobalLoader';
import { ConfirmDeleteDialog } from '@/components/Admin/common';
import styles from './styles.module.css';

interface PromoCodeListProps {
  promoCodes: PromoCode[];
  onEdit: (promo: PromoCode) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string) => void;
  loading?: boolean;
}

function getStatus(promo: PromoCode): 'active' | 'expired' | 'exhausted' | 'inactive' {
  if (!promo.isActive) return 'inactive';
  const expiry = new Date(promo.expiryDate);
  if (expiry < new Date()) return 'expired';
  if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) return 'exhausted';
  return 'active';
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const PromoCodeList: React.FC<PromoCodeListProps> = ({
  promoCodes,
  onEdit,
  onDelete,
  onToggleActive,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; code: string } | null>(null);

  const filtered = promoCodes.filter((p) => p.code.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      onDelete(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  if (loading) {
    return <GlobalLoader label="Loading promo codes..." />;
  }

  return (
    <div className={styles.container}>
      <ConfirmDeleteDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title={confirmDelete?.code || ''}
      />

      <div className={styles.filters}>
        <label htmlFor="promo-search" className={styles.visuallyHidden}>
          Search promo codes
        </label>
        <input
          id="promo-search"
          type="text"
          placeholder="Search promo codes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {filtered.length === 0 ? (
        <StatusState
          type="empty"
          message="No promo codes found. Try adjusting your search or add a new promo code."
          variant="minimal"
        />
      ) : (
        <ul className={styles.list} aria-label="Promo code list">
          {filtered.map((promo) => {
            const status = getStatus(promo);
            return (
              <li key={promo._id} className={styles.card}>
                <div className={styles.details}>
                  <div className={styles.codeRow}>
                    <span className={styles.code}>{promo.code}</span>
                    <span
                      className={
                        status === 'active'
                          ? styles.badgeActive
                          : status === 'expired'
                            ? styles.badgeExpired
                            : status === 'exhausted'
                              ? styles.badgeExhausted
                              : styles.badgeInactive
                      }
                    >
                      {status === 'active'
                        ? 'Active'
                        : status === 'expired'
                          ? 'Expired'
                          : status === 'exhausted'
                            ? 'Exhausted'
                            : 'Inactive'}
                    </span>
                  </div>
                  <p className={styles.discount}>
                    {promo.discountType === 'percentage'
                      ? `${promo.discountValue}% off`
                      : `₹${promo.discountValue} off`}
                    {promo.maxDiscount != null && promo.discountType === 'percentage' && (
                      <span className={styles.max}> (max ₹{promo.maxDiscount})</span>
                    )}
                  </p>
                  <p className={styles.meta}>
                    Expires: {formatDate(promo.expiryDate)}
                    {promo.usageLimit != null && (
                      <>
                        {' '}
                        · Used {promo.usedCount}/{promo.usageLimit}
                      </>
                    )}
                  </p>
                  {promo.description && <p className={styles.description}>{promo.description}</p>}
                </div>
                <div className={styles.actions}>
                  {onToggleActive && (
                    <button
                      type="button"
                      onClick={() => onToggleActive(promo._id)}
                      className={styles.toggleBtn}
                      title={promo.isActive ? 'Deactivate' : 'Activate'}
                      aria-label={promo.isActive ? 'Deactivate promo code' : 'Activate promo code'}
                    >
                      {promo.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                  <button type="button" onClick={() => onEdit(promo)} className={styles.editButton}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete({ id: promo._id, code: promo.code })}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default PromoCodeList;
