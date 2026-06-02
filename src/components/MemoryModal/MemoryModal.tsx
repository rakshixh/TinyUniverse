'use client';

import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { IMemory } from '@/types/memory';
import {
  API_PATHS,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from '@/lib/constants';
import styles from './MemoryModal.module.scss';

type ModalMode = 'view' | 'edit' | 'confirm-delete';

interface MemoryModalProps {
  memory: IMemory | null;
  onClose: () => void;
  onUpdate: (memory: IMemory) => void;
  onDelete: (id: string) => void;
  universeId: string;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function MemoryModal({
  memory,
  onClose,
  onUpdate,
  onDelete,
  universeId,
}: MemoryModalProps) {
  const [mode, setMode] = useState<ModalMode>('view');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [orbit, setOrbit] = useState(1);
  const [date, setDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const isLoading = isSubmitting;

  useEffect(() => {
    if (memory) {
      setTitle(memory.title);
      setDescription(memory.description || '');
      setOrbit(memory.orbit || 1);
      setDate(memory.date ? memory.date.substring(0, 10) : '');
      setMode('view');
    }
  }, [memory]);

  // Keyboard navigation
  useEffect(() => {
    if (!memory) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mode === 'edit') setMode('view');
        else if (mode === 'confirm-delete') setMode('view');
        else onClose();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [memory, mode, onClose]);

  // Focus trap
  useEffect(() => {
    if (memory) {
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    }
  }, [memory]);

  // Lock body scroll
  useEffect(() => {
    if (memory) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [memory]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      if (mode === 'view') onClose();
    }
  };

  const handleUpdate = async () => {
    if (!memory || !title.trim() || !date) return;

    setIsSubmitting(true);

    // Submit memory update
    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        orbit,
        date,
        universeId,
      };

      const res = await fetch(API_PATHS.memory(memory._id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to update memory');
        return;
      }

      toast.success('Memory updated ✨');
      onUpdate(data.memory);
      setMode('view');
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!memory) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_PATHS.memory(memory._id)}?universeId=${universeId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete memory');
        return;
      }

      toast.success('Memory released into the void 🌑');
      onDelete(memory._id);
      onClose();
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!memory) return null;

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Memory: ${memory.title}`}
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerMeta}>
            <span className={styles.orbitBadge} aria-label={`Orbit ${memory.orbit}`}>
              Orbit {memory.orbit}
            </span>
            <span className={styles.date}>{formatDate(memory.date)}</span>
          </div>
          <button
            ref={closeButtonRef}
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close memory"
            id="memory-modal-close"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.body}>
          {/* View Mode */}
          {mode === 'view' && (
            <div className={styles.viewContent} role="article">
              <h2 className={styles.title}>{memory.title}</h2>
              {memory.description && (
                <p className={styles.description}>{memory.description}</p>
              )}
              <div className={styles.actions}>
                <button
                  className={styles.editButton}
                  onClick={() => setMode('edit')}
                  id="edit-memory-button"
                  aria-label="Edit this memory"
                >
                  ✏️ Edit
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => setMode('confirm-delete')}
                  id="delete-memory-button"
                  aria-label="Delete this memory"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          )}

          {/* Edit Mode */}
          {mode === 'edit' && (
            <div className={styles.editContent}>
              <div className={styles.field}>
                <label htmlFor="edit-title" className={styles.label}>Title</label>
                <input
                  id="edit-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={styles.input}
                  maxLength={MAX_TITLE_LENGTH}
                  autoFocus
                  disabled={isLoading}
                  aria-required="true"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="edit-date" className={styles.label}>Memory Date</label>
                <input
                  id="edit-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={styles.input}
                  disabled={isLoading}
                  required
                  aria-required="true"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="edit-orbit" className={styles.label}>Orbit Ring</label>
                <select
                  id="edit-orbit"
                  value={orbit}
                  onChange={(e) => setOrbit(Number(e.target.value))}
                  className={styles.select}
                  disabled={isLoading}
                >
                  <option value={1}>Ring 1 (Inner)</option>
                  <option value={2}>Ring 2</option>
                  <option value={3}>Ring 3</option>
                  <option value={4}>Ring 4 (Outer)</option>
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="edit-description" className={styles.label}>Description</label>
                <textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={styles.textarea}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  rows={4}
                  disabled={isLoading}
                />
              </div>

              <div className={styles.editActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setTitle(memory.title);
                    setDescription(memory.description || '');
                    setOrbit(memory.orbit || 1);
                    setDate(memory.date ? memory.date.substring(0, 10) : '');
                    setMode('view');
                  }}
                  disabled={isLoading}
                  aria-label="Cancel editing"
                >
                  Cancel
                </button>
                <button
                  className={styles.saveButton}
                  onClick={handleUpdate}
                  disabled={isLoading || !title.trim()}
                  id="save-memory-button"
                  aria-label={isLoading ? 'Saving...' : 'Save changes'}
                >
                  {isLoading ? (
                    <><span className={styles.spinner} aria-hidden="true" /> Saving...</>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Delete */}
          {mode === 'confirm-delete' && (
            <div className={styles.deleteConfirm} role="alertdialog" aria-label="Confirm delete">
              <div className={styles.deleteIcon} aria-hidden="true">🌑</div>
              <h3 className={styles.deleteTitle}>Release this memory?</h3>
              <p className={styles.deleteText}>
                &ldquo;{memory.title}&rdquo; will drift into the void and cannot be recovered.
              </p>
              <div className={styles.deleteActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => setMode('view')}
                  disabled={isLoading}
                  aria-label="Cancel deletion"
                >
                  Keep it
                </button>
                <button
                  className={styles.confirmDeleteButton}
                  onClick={handleDelete}
                  disabled={isLoading}
                  id="confirm-delete-button"
                  aria-label="Confirm delete memory"
                >
                  {isLoading ? (
                    <><span className={styles.spinner} aria-hidden="true" /> Deleting...</>
                  ) : (
                    'Yes, Release'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
