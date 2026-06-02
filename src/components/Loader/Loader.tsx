import styles from './Loader.module.scss';

interface LoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export default function Loader({ message = 'Loading...', fullScreen = false }: LoaderProps) {
  return (
    <div
      className={`${styles.loader} ${fullScreen ? styles.fullScreen : ''}`}
      role="status"
      aria-label={message}
    >
      <div className={styles.orbitSystem} aria-hidden="true">
        <div className={styles.sun} />
        <div className={styles.orbit1}>
          <div className={styles.planet} style={{ '--color': '#8B5CF6' } as React.CSSProperties} />
        </div>
        <div className={styles.orbit2}>
          <div className={styles.planet} style={{ '--color': '#38BDF8' } as React.CSSProperties} />
        </div>
      </div>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
