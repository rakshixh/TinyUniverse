import type { Metadata } from 'next';
import PasscodeForm from '@/components/PasscodeForm/PasscodeForm';
import { CONTENT } from '@/lib/content';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: `${CONTENT.universeList.header.title}${CONTENT.universeList.header.titleAccent} — Enter Your Universe`,
  description: CONTENT.landingPage.footer,
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
            {CONTENT.landingPage.title}
            <span className={styles.titleAccent}>{CONTENT.landingPage.titleAccent}</span>
          </h1>
          <p className={styles.subtitle}>
            {CONTENT.landingPage.subtitle}
          </p>
        </header>

        {/* Passcode Form */}
        <section aria-label={CONTENT.landingPage.accessLabel} className={styles.formSection}>
          <PasscodeForm />
        </section>

        {/* Footer hint */}
        <p className={styles.footer} aria-label={CONTENT.landingPage.footer}>
          {CONTENT.landingPage.footer}
        </p>
      </div>
    </main>
  );
}
