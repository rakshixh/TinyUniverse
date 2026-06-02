'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { IMemory } from '@/types/memory';
import {
  API_PATHS,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from '@/lib/constants';
import styles from './AddMemoryModal.module.scss';

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (memory: IMemory) => void;
  systemId: string;
  universeId: string;
}

export default function AddMemoryModal({
  isOpen,
  onClose,
  onCreated,
  systemId,
  universeId,
}: AddMemoryModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [orbit, setOrbit] = useState(1);
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const isLoading = isSubmitting;

  // Reset form
  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setOrbit(1);
    setDate(new Date().toISOString().substring(0, 10));
    setIsSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  }, [isLoading, resetForm, onClose]);

  // Focus title on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || isLoading) return;

    // Create memory
    setIsSubmitting(true);
    try {
      const res = await fetch(API_PATHS.memories, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          orbit,
          date,
          systemId,
          universeId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to create memory');
        return;
      }

      toast.success('Memory born into the universe 🪐');
      onCreated(data.memory);
      resetForm();
      onClose();
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Add new memory"
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>New Memory Planet</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close modal"
            disabled={isLoading}
            id="add-memory-close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit} aria-label="Add memory form">
          {/* Title */}
          <div className={styles.field}>
            <label htmlFor="memory-title" className={styles.label}>
              Memory Title <span className={styles.required} aria-hidden="true">*</span>
            </label>
            <input
              ref={titleRef}
              id="memory-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is this memory called?"
              className={styles.input}
              maxLength={MAX_TITLE_LENGTH}
              disabled={isLoading}
              aria-required="true"
            />
            <span className={styles.charCount}>{title.length}/{MAX_TITLE_LENGTH}</span>
          </div>

          {/* Date Selector */}
          <div className={styles.field}>
            <label htmlFor="memory-date" className={styles.label}>
              Memory Date <span className={styles.required} aria-hidden="true">*</span>
            </label>
            <input
              id="memory-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={styles.input}
              disabled={isLoading}
              required
              aria-required="true"
            />
          </div>

          {/* Orbit Selector */}
          <div className={styles.field}>
            <label className={styles.label}>
              Orbit Ring <span className={styles.required} aria-hidden="true">*</span>
            </label>
            <div className={styles.orbitSelector}>
              {[1, 2, 3, 4].map((ring) => (
                <label key={ring} className={`${styles.orbitOption} ${orbit === ring ? styles.selected : ''}`}>
                  <input
                    type="radio"
                    name="orbit-ring"
                    value={ring}
                    checked={orbit === ring}
                    onChange={() => setOrbit(ring)}
                    disabled={isLoading}
                    className={styles.radioInput}
                  />
                  Ring {ring} {ring === 1 && '(Inner)'} {ring === 4 && '(Outer)'}
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className={styles.field}>
            <label htmlFor="memory-description" className={styles.label}>
              Description <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              id="memory-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the story of this memory..."
              className={styles.textarea}
              maxLength={MAX_DESCRIPTION_LENGTH}
              rows={4}
              disabled={isLoading}
            />
            <span className={styles.charCount}>{description.length}/{MAX_DESCRIPTION_LENGTH}</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading || !title.trim()}
            id="submit-memory-button"
            aria-label={isLoading ? 'Creating memory...' : 'Create memory planet'}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                Creating planet...
              </>
            ) : (
              <>
                <span aria-hidden="true">🪐</span>
                Create Planet
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
