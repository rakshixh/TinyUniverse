'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Button from '@/components/UI/Button';
import { CONTENT } from '@/lib/content';
import styles from './GuestUnlockForm.module.scss';

interface GuestUnlockFormProps {
  slug: string;
}

export default function GuestUnlockForm({ slug }: GuestUnlockFormProps) {
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
      const res = await fetch('/api/universe/verify-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, passcode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setHasError(true);
        toast.error(data.error || CONTENT.guestUnlock.invalidPasscodeError);
        setPasscode('');
        setTimeout(() => {
          setHasError(false);
          inputRef.current?.focus();
        }, 600);
        return;
      }

      toast.success(CONTENT.guestUnlock.welcomeToast);
      sessionStorage.setItem('session_active', 'true');
      
      // Refresh Server Component to render the systems dashboard instead of the unlock screen
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
      aria-label="Universe passcode form"
    >
      <div className={`${styles.inputWrapper} ${hasError ? styles.error : ''}`}>
        <span className={styles.lockIcon} aria-hidden="true">
          🔐
        </span>
        <input
          ref={inputRef}
          id="guest-passcode-input"
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder={CONTENT.guestUnlock.passcodePlaceholder}
          className={styles.input}
          autoComplete="off"
          autoFocus
          aria-label="Guest access code"
          disabled={isLoading}
        />
      </div>

      <p className={styles.hint}>
        {CONTENT.guestUnlock.subtitle}
      </p>

      <Button
        type="submit"
        disabled={isLoading || !passcode.trim()}
        isLoading={isLoading}
        loadingText={CONTENT.guestUnlock.unlockingBtn}
        id="guest-unlock-button"
        className={styles.submitButton}
      >
        <span aria-hidden="true">🌌</span>
        {CONTENT.guestUnlock.unlockBtn}
      </Button>
    </form>
  );
}
