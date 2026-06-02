'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from './CreateUniverseForm.module.scss';
import { API_PATHS, MAX_UNIVERSE_TITLE_LENGTH, MAX_UNIVERSE_DESC_LENGTH } from '@/lib/constants';

export default function CreateUniverseForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const res = await fetch(API_PATHS.universe, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to create universe');
        return;
      }

      toast.success('Your universe is born! 🌌');
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
      aria-label="Create universe form"
    >
      <div className={styles.field}>
        <label htmlFor="universe-title" className={styles.label}>
          Universe Name <span className={styles.required} aria-hidden="true">*</span>
        </label>
        <input
          id="universe-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Our Little World"
          className={styles.input}
          maxLength={MAX_UNIVERSE_TITLE_LENGTH}
          autoFocus
          disabled={isLoading}
          aria-required="true"
        />
        <span className={styles.charCount}>
          {title.length}/{MAX_UNIVERSE_TITLE_LENGTH}
        </span>
      </div>

      <div className={styles.field}>
        <label htmlFor="universe-description" className={styles.label}>
          Description <span className={styles.optional}>(optional)</span>
        </label>
        <textarea
          id="universe-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A collection of memories we hold dear..."
          className={styles.textarea}
          maxLength={MAX_UNIVERSE_DESC_LENGTH}
          rows={3}
          disabled={isLoading}
        />
        <span className={styles.charCount}>
          {description.length}/{MAX_UNIVERSE_DESC_LENGTH}
        </span>
      </div>

      <button
        type="submit"
        className={styles.button}
        disabled={isLoading || !title.trim()}
        id="create-universe-button"
        aria-label={isLoading ? 'Creating universe...' : 'Create universe'}
      >
        {isLoading ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            Creating...
          </>
        ) : (
          <>
            <span aria-hidden="true">✨</span>
            Create Universe
          </>
        )}
      </button>
    </form>
  );
}
