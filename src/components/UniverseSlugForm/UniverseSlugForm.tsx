'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/UI/Button';
import styles from './UniverseSlugForm.module.scss';

export default function UniverseSlugForm() {
  const [slug, setSlug] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim()) return;

    // Convert input to a clean slug format
    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (cleanSlug) {
      router.push(`/u/${cleanSlug}`);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} aria-label="Enter universe name form">
      <div className={styles.inputWrapper}>
        <span className={styles.icon} aria-hidden="true">🌌</span>
        <input
          id="universe-slug-input"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Enter universe slug (e.g., original-universe)..."
          className={styles.input}
          autoComplete="off"
          autoFocus
          aria-label="Universe slug"
        />
      </div>
      <Button
        type="submit"
        disabled={!slug.trim()}
        id="go-to-universe-button"
        className={styles.submitButton}
      >
        Enter Universe
      </Button>
    </form>
  );
}
