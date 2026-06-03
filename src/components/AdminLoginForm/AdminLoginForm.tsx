'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Button from '@/components/UI/Button';
import { CONTENT } from '@/lib/content';
import styles from './AdminLoginForm.module.scss';

export default function AdminLoginForm() {
  const [passcode, setPasscode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim() || isLoading) return;

    setIsLoading(true);
    setHasError(false);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setHasError(true);
        toast.error(data.error || CONTENT.admin.login.invalidPasscodeError);
        setPasscode('');
        setTimeout(() => {
          setHasError(false);
          inputRef.current?.focus();
        }, 600);
        return;
      }

      toast.success(CONTENT.admin.login.welcomeToast);
      sessionStorage.setItem('session_active', 'true');
      
      // Refresh to trigger Server Component to render AdminDashboard instead of Login
      router.refresh();
    } catch {
      toast.error(CONTENT.common.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      aria-label="Admin access form"
    >
      <div className={`${styles.inputWrapper} ${hasError ? styles.error : ''}`}>
        <span className={styles.lockIcon} aria-hidden="true">
          🔑
        </span>
        <input
          ref={inputRef}
          id="admin-passcode-input"
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder={CONTENT.admin.login.passcodePlaceholder}
          className={styles.input}
          autoComplete="off"
          autoFocus
          aria-label="Admin passcode"
          disabled={isLoading}
        />
      </div>

      <p className={styles.hint}>
        {CONTENT.admin.login.subtitle}
      </p>

      <Button
        type="submit"
        disabled={isLoading || !passcode.trim()}
        isLoading={isLoading}
        loadingText={CONTENT.admin.login.unlockingBtn}
        id="admin-unlock-button"
        className={styles.submitButton}
      >
        <span aria-hidden="true">🌌</span>
        {CONTENT.admin.login.unlockBtn}
      </Button>
    </form>
  );
}
