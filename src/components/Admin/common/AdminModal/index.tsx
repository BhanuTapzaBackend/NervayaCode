'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { ICON_X } from '@/constants/icons';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import styles from './AdminModal.module.css';

let openModalCount = 0;

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

export default function AdminModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '500px',
  className = '',
}: AdminModalProps) {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    if (isOpen) {
      openModalCount++;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      clearTimeout(id);
      if (isOpen) {
        openModalCount--;
        if (openModalCount === 0) {
          document.body.style.overflow = '';
        }
      }
    };
  }, [isOpen]);

  useModalDismiss(isOpen, modalRef, onClose);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className={styles.overlay}>
      <div
        ref={modalRef}
        className={`${styles.modal} ${className}`}
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            <Icon icon={ICON_X} width={24} height={24} />
          </button>
        </div>
        <div className={styles.content}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
