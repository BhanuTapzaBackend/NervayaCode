'use client';

import type { ShippingAddress } from '@/types/supplement.types';
import { Icon } from '@iconify/react';
import { ICON_HOUSE, ICON_PEN } from '@/constants/icons';
import styles from './styles.module.css';

interface AddressCardProps {
  address: ShippingAddress;
  label?: string;
  isDefault?: boolean;
  onEdit: () => void;
}

export function AddressCard({ address, label = 'Home Address', isDefault, onEdit }: AddressCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.icon} aria-hidden>
            <Icon icon={ICON_HOUSE} aria-hidden />
          </span>
          <div>
            <h3 className={styles.label}>{label}</h3>
            {isDefault && <span className={styles.defaultBadge}>Default shipping address</span>}
          </div>
        </div>
        <button type="button" className={styles.editButton} onClick={onEdit} aria-label="Edit address">
          <Icon icon={ICON_PEN} aria-hidden />
        </button>
      </div>
      <div className={styles.body}>
        <p className={styles.name}>{address.name}</p>
        <p className={styles.text}>{address.addressLine1}</p>
        {address.addressLine2 && <p className={styles.text}>{address.addressLine2}</p>}
        <p className={styles.text}>
          {address.city}, {address.state} {address.zipCode}
        </p>
        <p className={styles.text}>{address.phone}</p>
      </div>
    </div>
  );
}
