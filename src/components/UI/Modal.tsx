'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import styles from './Modal.module.scss';
import Button from './Button';
import { CONTENT } from '@/lib/content';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  variant?: 'standard' | 'danger';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  disabled = false,
  className = '',
  ariaLabel,
  variant = 'standard',
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Esc key logic
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disabled) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, disabled]);

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current && !disabled) {
        onClose();
      }
    },
    [onClose, disabled]
  );

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title}
    >
      <div className={`${styles.modal} ${variant === 'danger' ? styles.dangerModal : ''} ${className}`}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={`${styles.title} ${variant === 'danger' ? styles.dangerTitle : ''}`}>
            {title}
          </h2>
          <Button
            variant="icon"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={CONTENT.common.closeBtn}
            disabled={disabled}
          >
            {CONTENT.common.closeBtn}
          </Button>
        </div>

        {/* Body / Content */}
        <div className={styles.body}>
          {children}
        </div>
      </div>
    </div>
  );
}
