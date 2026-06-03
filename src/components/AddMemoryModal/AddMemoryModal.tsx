'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { IMemory } from '@/types/memory';
import {
  API_PATHS,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from '@/lib/constants';
import Button from '../UI/Button';
import Modal from '../UI/Modal';
import { CONTENT } from '@/lib/content';
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
        toast.error(data.error || CONTENT.common.genericError);
        return;
      }

      toast.success(CONTENT.addMemoryModal.successToast);
      onCreated(data.memory);
      resetForm();
      onClose();
    } catch {
      toast.error(CONTENT.addMemoryModal.errorToast);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={CONTENT.addMemoryModal.title}
      disabled={isLoading}
    >
      {/* Form */}
      <form className={styles.form} onSubmit={handleSubmit} aria-label="Add memory form">
        {/* Title */}
        <div className={styles.field}>
          <label htmlFor="memory-title" className={styles.label}>
            {CONTENT.addMemoryModal.fieldTitle}
          </label>
          <input
            ref={titleRef}
            id="memory-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={CONTENT.addMemoryModal.fieldTitlePlaceholder}
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
            {CONTENT.addMemoryModal.fieldDate}
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
            {CONTENT.addMemoryModal.fieldOrbit}
          </label>
          <div className={styles.orbitSelector}>
            {CONTENT.addMemoryModal.orbitRings.map((ring) => (
              <label key={ring.value} className={`${styles.orbitOption} ${orbit === ring.value ? styles.selected : ''}`}>
                <input
                  type="radio"
                  name="orbit-ring"
                  value={ring.value}
                  checked={orbit === ring.value}
                  onChange={() => setOrbit(ring.value)}
                  disabled={isLoading}
                  className={styles.radioInput}
                />
                {ring.label}
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className={styles.field}>
          <label htmlFor="memory-description" className={styles.label}>
            {CONTENT.addMemoryModal.fieldDesc}
          </label>
          <textarea
            id="memory-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={CONTENT.addMemoryModal.fieldDescPlaceholder}
            className={styles.textarea}
            maxLength={MAX_DESCRIPTION_LENGTH}
            rows={4}
            disabled={isLoading}
          />
          <span className={styles.charCount}>{description.length}/{MAX_DESCRIPTION_LENGTH}</span>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          isLoading={isLoading}
          loadingText={CONTENT.addMemoryModal.submitBtnLoading}
          disabled={!title.trim()}
          id="submit-memory-button"
        >
          {CONTENT.addMemoryModal.submitBtn}
        </Button>
      </form>
    </Modal>
  );
}
