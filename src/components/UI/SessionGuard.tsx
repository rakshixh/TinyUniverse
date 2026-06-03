'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SessionGuardProps {
  universeId?: string;
  isAdmin?: boolean;
}

/**
 * SessionGuard Component:
 * Synchronizes client sessionStorage state with HTTP-only cookies.
 * If a user opens a new tab or restarts their browser, sessionStorage will be empty.
 * In this case, we call the logout API to clear any dangling cookies, ensuring true session-level lifetime.
 */
export default function SessionGuard({ universeId, isAdmin = false }: SessionGuardProps) {
  const router = useRouter();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // Avoid double-triggering in React StrictMode
    if (hasTriggeredRef.current) return;

    const isSessionActive = sessionStorage.getItem('session_active');

    if (!isSessionActive) {
      hasTriggeredRef.current = true;
      
      const clearDanglingCookies = async () => {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ universeId, isAdmin }),
          });
          
          sessionStorage.setItem('session_active', 'true');
          router.refresh();
        } catch (err) {
          console.error('SessionGuard failed to clear session:', err);
        }
      };

      clearDanglingCookies();
    }
  }, [universeId, isAdmin, router]);

  return null;
}
