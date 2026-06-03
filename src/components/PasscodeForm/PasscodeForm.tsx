'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Button from '@/components/UI/Button';
import { CONTENT } from '@/lib/content';
import styles from './PasscodeForm.module.scss';

export default function PasscodeForm() {
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
      const res = await fetch('/api/auth/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setHasError(true);
        toast.error(data.error || CONTENT.landingPage.invalidPasscodeError);
        setPasscode('');
        setTimeout(() => {
          setHasError(false);
          inputRef.current?.focus();
        }, 600);
        return;
      }

      toast.success(CONTENT.landingPage.welcomeToast);
      router.push('/universe');
    } catch {
      toast.error(CONTENT.landingPage.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      aria-label="Universe access form"
    >
      <div className={`${styles.inputWrapper} ${hasError ? styles.error : ''}`}>
        <span className={styles.lockIcon} aria-hidden="true">
          🔐
        </span>
        <input
          ref={inputRef}
          id="passcode-input"
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder={CONTENT.landingPage.passcodePlaceholder}
          className={styles.input}
          autoComplete="off"
          autoFocus
          aria-label="Universe passcode"
          aria-describedby="passcode-hint"
          disabled={isLoading}
        />
      </div>

      <p id="passcode-hint" className={styles.hint}>
        {CONTENT.landingPage.passcodeHint}
      </p>

      <Button
        type="submit"
        disabled={isLoading || !passcode.trim()}
        isLoading={isLoading}
        loadingText={CONTENT.landingPage.unlockingBtn}
        id="unlock-button"
        aria-label={isLoading ? CONTENT.landingPage.unlockingAriaLabel : CONTENT.landingPage.unlockAriaLabel}
        className={styles.submitButton}
      >
        <span aria-hidden="true">🌌</span>
        {CONTENT.landingPage.unlockBtn}
      </Button>
    </form>
  );
}
