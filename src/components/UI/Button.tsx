'use client';

import React from 'react';
import styles from './Button.module.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'cancel' | 'icon' | 'create';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

export default function Button({
  children,
  variant = 'primary',
  isLoading = false,
  loadingText,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`${styles.button} ${styles[variant]} ${isLoading ? styles.loading : ''} ${className}`}
      disabled={isDisabled}
      type={props.type || 'button'}
      {...props}
    >
      {isLoading ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          {loadingText ? <span>{loadingText}</span> : children}
        </>
      ) : (
        <>
          {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
