import styles from './EmptyState.module.scss';

interface EmptyStateProps {
  onAddMemory: () => void;
}

export default function EmptyState({ onAddMemory }: EmptyStateProps) {
  return (
    <div className={styles.container} role="main" aria-label="Empty universe">
      <div className={styles.illustration} aria-hidden="true">
        <div className={styles.ring1} />
        <div className={styles.ring2} />
        <div className={styles.ring3} />
        <div className={styles.center}>
          <span className={styles.emoji}>🌑</span>
        </div>
      </div>

      <div className={styles.content}>
        <h2 className={styles.title}>Your universe is empty.</h2>
        <p className={styles.description}>
          Every memory is a planet waiting to be born.
          <br />
          Create your first one and watch your universe come alive.
        </p>
      </div>

      <button
        className={styles.button}
        onClick={onAddMemory}
        id="add-first-memory-button"
        aria-label="Create your first memory"
      >
        <span aria-hidden="true">✦</span>
        Create First Memory
      </button>
    </div>
  );
}
