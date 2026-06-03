import { CONTENT } from '@/lib/content';
import styles from './EmptyState.module.scss';

interface EmptyStateProps {
  onAddMemory: () => void;
}

export default function EmptyState({ onAddMemory }: EmptyStateProps) {
  return (
    <div className={styles.container} role="main" aria-label={CONTENT.emptyState.ariaLabel}>
      <div className={styles.illustration} aria-hidden="true">
        <div className={styles.ring1} />
        <div className={styles.ring2} />
        <div className={styles.ring3} />
        <div className={styles.center}>
          <span className={styles.emoji}>🌑</span>
        </div>
      </div>

      <div className={styles.content}>
        <h2 className={styles.title}>{CONTENT.emptyState.title}</h2>
        <p className={styles.description}>
          {CONTENT.emptyState.descriptionLine1}
          <br />
          {CONTENT.emptyState.descriptionLine2}
        </p>
      </div>

      <button
        className={styles.button}
        onClick={onAddMemory}
        id="add-first-memory-button"
        aria-label={CONTENT.emptyState.ariaLabelCta}
      >
        <span aria-hidden="true">✦</span>
        {CONTENT.emptyState.cta}
      </button>
    </div>
  );
}
