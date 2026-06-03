'use client';

import React from 'react';
import styles from './Card.module.scss';

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  hoverable?: boolean;
  ariaLabel?: string;
}

export default function Card({
  children,
  onClick,
  className = '',
  hoverable = true,
  ariaLabel,
}: CardProps) {
  const isClickable = !!onClick;
  const isHoverable = hoverable && (isClickable || hoverable);

  const classes = `${styles.card} ${isHoverable ? styles.hoverable : ''} ${
    isClickable ? styles.clickable : ''
  } ${className}`;

  if (isClickable) {
    return (
      <div
        className={classes}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick();
          }
        }}
        aria-label={ariaLabel}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={classes} aria-label={ariaLabel}>
      {children}
    </div>
  );
}
