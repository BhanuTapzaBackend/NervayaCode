'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { ICON_X } from '@/constants/icons';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mountedTimer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(mountedTimer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useModalDismiss(isOpen, modalRef, onClose);
  // `mounted` matters here: the dialog is not in the DOM until it flips, so the
  // trap has nothing to attach to before then. Including it in the condition is
  // what re-runs the effect once the element exists.
  useFocusTrap(isOpen && mounted, modalRef);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className={styles.overlay}>
      {/* tabIndex -1 so the dialog itself can take initial focus. */}
      <div ref={modalRef} className={styles.modal} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            <Icon icon={ICON_X} width={24} height={24} />
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
