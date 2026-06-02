import type { Metadata } from 'next';
import PasscodeForm from '@/components/PasscodeForm/PasscodeForm';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Tiny Universe — Enter Your Universe',
  description:
    'Unlock your personal universe where every memory becomes a planet in space.',
};

export default function LandingPage() {
  return (
    <main className={styles.main}>
      {/* Animated star field */}
      <div className="star-field" aria-hidden="true" />

      {/* Background nebula glow */}
      <div className={styles.nebula} aria-hidden="true" />

      <div className={styles.content}>
        {/* Logo / Icon */}
        <div className={styles.logo} aria-hidden="true">
          <div className={styles.logoOrbit}>
            <div className={styles.logoPlanet} />
          </div>
          <div className={styles.logoCore}>🌌</div>
        </div>

        {/* Heading */}
        <header className={styles.header}>
          <h1 className={styles.title}>
            Tiny
            <span className={styles.titleAccent}> Universe</span>
          </h1>
          <p className={styles.subtitle}>
            A cosmos of memories, just for you.
          </p>
        </header>

        {/* Passcode Form */}
        <section aria-label="Universe access" className={styles.formSection}>
          <PasscodeForm />
        </section>

        {/* Footer hint */}
        <p className={styles.footer} aria-label="About the app">
          Every memory becomes a planet in your universe ✦
        </p>
      </div>
    </main>
  );
}
