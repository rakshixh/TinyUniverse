'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
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
        toast.error(data.error || 'Invalid passcode');
        setPasscode('');
        setTimeout(() => {
          setHasError(false);
          inputRef.current?.focus();
        }, 600);
        return;
      }

      toast.success('Welcome to your universe ✨');
      router.push('/universe');
    } catch {
      toast.error('Something went wrong. Try again.');
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
          placeholder="Enter passcode..."
          className={styles.input}
          autoComplete="off"
          autoFocus
          aria-label="Universe passcode"
          aria-describedby="passcode-hint"
          disabled={isLoading}
        />
      </div>

      <p id="passcode-hint" className={styles.hint}>
        Enter the secret passcode to unlock your universe
      </p>

      <button
        type="submit"
        className={styles.button}
        disabled={isLoading || !passcode.trim()}
        aria-label={isLoading ? 'Verifying passcode...' : 'Unlock universe'}
        id="unlock-button"
      >
        {isLoading ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            Unlocking...
          </>
        ) : (
          <>
            <span aria-hidden="true">🌌</span>
            Unlock Universe
          </>
        )}
      </button>
    </form>
  );
}
