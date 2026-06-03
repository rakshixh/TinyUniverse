import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import AdminLoginForm from '@/components/AdminLoginForm/AdminLoginForm';
import AdminDashboard from '@/components/AdminDashboard/AdminDashboard';
import GuestUnlockForm from '@/components/GuestUnlockForm/GuestUnlockForm';
import GuestSystemsHub from '@/components/GuestSystemsHub/GuestSystemsHub';
import GuestSystemCanvas from '@/components/GuestSystemCanvas/GuestSystemCanvas';
import SpaceBackground from '@/components/UI/SpaceBackground';
import { CONTENT } from '@/lib/content';
import { getRawUniverseBySlug } from '@/services/universe.service';
import { checkAdminSession, checkGuestSession } from '@/lib/auth';
import SessionGuard from '@/components/UI/SessionGuard';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: CONTENT.metadata.page.title,
  description: CONTENT.metadata.page.description,
};

interface PageProps {
  searchParams: Promise<{ u?: string; system?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const slug = typeof params.u === 'string' ? params.u.trim() : undefined;
  const systemId = typeof params.system === 'string' ? params.system.trim() : undefined;

  const cookieStore = await cookies();

  // 1. Check Admin Authentication Status (with max 1-day timestamp validation built-in)
  const isUserAdmin = checkAdminSession(cookieStore);

  // 2. Guest Flow (Universe details view requested)
  if (slug) {
    const rawUniverse = await getRawUniverseBySlug(slug);
    
    if (!rawUniverse) {
      return (
        <main className={styles.main}>
          <SpaceBackground />
          <div className={styles.content}>
            <header className={styles.header}>
              <h1 className={styles.title}>{CONTENT.landingPage.notFoundTitle}</h1>
              <p className={styles.subtitle}>{CONTENT.landingPage.notFoundSubtitle}</p>
            </header>
            <Link href="/" style={{ color: '#a855f7', textDecoration: 'none', fontWeight: 500 }}>
              {CONTENT.landingPage.returnToLanding}
            </Link>
          </div>
        </main>
      );
    }

    // Map to a plain IUniverse object
    const universe = {
      _id: rawUniverse._id.toString(),
      title: rawUniverse.title,
      slug: rawUniverse.slug,
      description: rawUniverse.description || '',
      createdAt: rawUniverse.createdAt instanceof Date ? rawUniverse.createdAt.toISOString() : String(rawUniverse.createdAt),
      updatedAt: rawUniverse.updatedAt instanceof Date ? rawUniverse.updatedAt.toISOString() : String(rawUniverse.updatedAt),
    };

    // Validate Guest Authorization (Admin has universal access bypass)
    const isGuestAuthorized = await checkGuestSession(
      cookieStore, 
      universe._id, 
      (rawUniverse.accessCodeHash as string) || ''
    );

    if (!isGuestAuthorized) {
      // Render Guest Unlock Screen
      return (
        <main className={styles.main}>
          <SpaceBackground />
          <div className={styles.nebula} aria-hidden="true" />
          <div className={styles.content}>
            <div className={styles.logo} aria-hidden="true">
              <div className={styles.logoOrbit}>
                <div className={styles.logoPlanet} />
              </div>
              <div className={styles.logoCore}>🔐</div>
            </div>
            <header className={styles.header}>
              <h1 className={styles.title}>
                {CONTENT.guestUnlock.title}
                <span className={styles.titleAccent}>{CONTENT.guestUnlock.titleAccent}</span>
              </h1>
              <p className={styles.subtitle}>
                {CONTENT.guestUnlock.subtitle}
              </p>
            </header>
            <section aria-label="Unlock universe form section" className={styles.formSection}>
              <GuestUnlockForm slug={slug} />
            </section>
            <p className={styles.footer} aria-label={CONTENT.landingPage.footer}>
              {CONTENT.landingPage.footer}
            </p>
          </div>
        </main>
      );
    }

    // Guest is authorized: render Systems Hub or memories canvas
    if (systemId) {
      return (
        <>
          <SessionGuard universeId={universe._id} isAdmin={isUserAdmin} />
          <GuestSystemCanvas
            universe={universe}
            systemId={systemId}
            isAdmin={isUserAdmin}
          />
        </>
      );
    } else {
      return (
        <>
          <SessionGuard universeId={universe._id} isAdmin={isUserAdmin} />
          <GuestSystemsHub
            universe={universe}
            isAdmin={isUserAdmin}
          />
        </>
      );
    }
  }

  // 3. Admin Flow (No universe slug requested)
  if (isUserAdmin) {
    return (
      <>
        <SessionGuard isAdmin={true} />
        <AdminDashboard />
      </>
    );
  }

  // Admin login screen (unauthenticated)
  return (
    <main className={styles.main}>
      <SpaceBackground />
      <div className={styles.nebula} aria-hidden="true" />
      <div className={styles.content}>
        <div className={styles.logo} aria-hidden="true">
          <div className={styles.logoOrbit}>
            <div className={styles.logoPlanet} />
          </div>
          <div className={styles.logoCore}>🌌</div>
        </div>
        <header className={styles.header}>
          <h1 className={styles.title}>
            {CONTENT.admin.login.title}
            <span className={styles.titleAccent}>{CONTENT.admin.login.titleAccent}</span>
          </h1>
          <p className={styles.subtitle}>
            {CONTENT.admin.login.subtitle}
          </p>
        </header>
        <section aria-label="Admin access form section" className={styles.formSection}>
          <AdminLoginForm />
        </section>
        <p className={styles.footer} aria-label={CONTENT.landingPage.footer}>
          {CONTENT.landingPage.footer}
        </p>
      </div>
    </main>
  );
}
