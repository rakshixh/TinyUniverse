import type { Metadata } from 'next';
import CreateUniverseForm from '@/components/CreateUniverseForm/CreateUniverseForm';
import styles from './setup.module.scss';

export const metadata: Metadata = {
  title: 'Tiny Universe — Create Your Universe',
  description: 'Set up your personal memory universe.',
};

export default function SetupPage() {
  return (
    <main className={styles.main}>
      <div className="star-field" aria-hidden="true" />
      <div className={styles.nebula} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.icon} aria-hidden="true">🌌</div>

        <header className={styles.header}>
          <h1 className={styles.title}>Create Your Universe</h1>
          <p className={styles.subtitle}>
            Give your universe a name. This will be your personal cosmos of memories.
          </p>
        </header>

        <section aria-label="Universe creation form" className={styles.formSection}>
          <CreateUniverseForm />
        </section>
      </div>
    </main>
  );
}
