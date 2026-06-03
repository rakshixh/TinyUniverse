'use client';

import { useState } from 'react';
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
import styles from './MemoryModal.module.scss';

type ModalMode = 'view' | 'edit' | 'confirm-delete';

interface MemoryModalProps {
  memory: IMemory | null;
  onClose: () => void;
  onUpdate: (memory: IMemory) => void;
  onDelete: (id: string) => void;
  universeId: string;
  isAdmin?: boolean;
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
  isAdmin = false,
}: MemoryModalProps) {
  const [mode, setMode] = useState<ModalMode>('view');
  const [title, setTitle] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [description, setDescription] = useState('');
  const [orbit, setOrbit] = useState(1);
  const [date, setDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prevMemoryId, setPrevMemoryId] = useState<string | null>(null);

  const isLoading = isSubmitting;

  if (memory && memory._id !== prevMemoryId) {
    setPrevMemoryId(memory._id);
    setTitle(memory.title);
    setContributorName(memory.contributorName || '');
    setDescription(memory.description || '');
    setOrbit(memory.orbit || 1);
    setDate(memory.date ? memory.date.substring(0, 10) : '');
    setMode('view');
  }

  const handleUpdate = async () => {
    if (!memory || !title.trim() || !date || contributorName.trim().length < 4) return;

    setIsSubmitting(true);

    // Submit memory update
    try {
      const body = {
        title: title.trim(),
        contributorName: contributorName.trim(),
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
        toast.error(data.error || CONTENT.common.genericError);
        return;
      }

      toast.success(CONTENT.memoryModal.editMode.successToast);
      onUpdate(data.memory);
      setMode('view');
    } catch {
      toast.error(CONTENT.memoryModal.editMode.errorToast);
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
        toast.error(data.error || CONTENT.common.genericError);
        return;
      }

      toast.success(CONTENT.memoryModal.deleteConfirm.successToast);
      onDelete(memory._id);
      onClose();
    } catch {
      toast.error(CONTENT.memoryModal.deleteConfirm.errorToast);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!memory) return null;

  return (
    <>
      {/* View & Edit Modal */}
      <Modal
        isOpen={mode !== 'confirm-delete'}
        onClose={onClose}
        title={mode === 'edit' ? CONTENT.memoryModal.editMode.saveBtn : `${CONTENT.memoryModal.orbitBadgePrefix}${memory.orbit}`}
        disabled={isLoading}
      >
        {/* Header Meta (Only view mode) */}
        {mode === 'view' && (
          <div className={styles.headerMeta}>
            <span className={styles.date}>{formatDate(memory.date)}</span>
            {memory.contributorName && (
              <span className={styles.contributor}>Added by {memory.contributorName}</span>
            )}
          </div>
        )}

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
                <Button
                  variant="secondary"
                  onClick={() => setMode('edit')}
                  className={styles.actionBtn}
                  id="edit-memory-button"
                  aria-label="Edit memory"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setMode('confirm-delete')}
                  className={styles.actionBtn}
                  id="delete-memory-button"
                  disabled={!isAdmin}
                  title={isAdmin ? undefined : 'Only Admin can dissolve memories'}
                  aria-label="Dissolve memory"
                >
                  Dissolve
                </Button>
              </div>
            </div>
          )}

          {/* Edit Mode */}
          {mode === 'edit' && (
            <div className={styles.editContent}>
              <div className={styles.field}>
                <label htmlFor="edit-title" className={styles.label}>
                  {CONTENT.memoryModal.editMode.fieldTitle}
                </label>
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
                <label htmlFor="edit-contributor-name" className={styles.label}>
                  Your Name * (Min 4 characters)
                </label>
                <input
                  id="edit-contributor-name"
                  type="text"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  className={styles.input}
                  maxLength={100}
                  disabled={isLoading}
                  required
                  aria-required="true"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="edit-date" className={styles.label}>
                  {CONTENT.memoryModal.editMode.fieldDate}
                </label>
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
                <label htmlFor="edit-orbit" className={styles.label}>
                  {CONTENT.memoryModal.editMode.fieldOrbit}
                </label>
                <select
                  id="edit-orbit"
                  value={orbit}
                  onChange={(e) => setOrbit(Number(e.target.value))}
                  className={styles.select}
                  disabled={isLoading}
                >
                  {CONTENT.memoryModal.editMode.orbitOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="edit-description" className={styles.label}>
                  {CONTENT.memoryModal.editMode.fieldDesc}
                </label>
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
                <Button
                  variant="cancel"
                  onClick={() => {
                    setTitle(memory.title);
                    setContributorName(memory.contributorName || '');
                    setDescription(memory.description || '');
                    setOrbit(memory.orbit || 1);
                    setDate(memory.date ? memory.date.substring(0, 10) : '');
                    setMode('view');
                  }}
                  disabled={isLoading}
                  aria-label={CONTENT.memoryModal.editMode.cancelBtn}
                >
                  {CONTENT.memoryModal.editMode.cancelBtn}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpdate}
                  disabled={isLoading || !title.trim() || !date || contributorName.trim().length < 4}
                  isLoading={isLoading}
                  loadingText={CONTENT.memoryModal.editMode.saveBtnLoading}
                  id="save-memory-button"
                >
                  {CONTENT.memoryModal.editMode.saveBtn}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={mode === 'confirm-delete'}
        onClose={() => setMode('view')}
        title={CONTENT.memoryModal.deleteConfirm.title}
        variant="danger"
      >
        <div className={styles.deleteConfirm}>
          <div className={styles.deleteIcon} aria-hidden="true">
            {CONTENT.memoryModal.deleteConfirm.icon}
          </div>
          <p className={styles.deleteText}>
            {CONTENT.memoryModal.deleteConfirm.warningPrefix}
            {memory.title}
            {CONTENT.memoryModal.deleteConfirm.warningSuffix}
          </p>
          <div className={styles.deleteActions}>
            <Button
              variant="cancel"
              onClick={() => setMode('view')}
              disabled={isLoading}
            >
              {CONTENT.memoryModal.deleteConfirm.cancelBtn}
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isLoading}
              loadingText={CONTENT.memoryModal.deleteConfirm.confirmBtnLoading}
              id="confirm-delete-button"
            >
              {CONTENT.memoryModal.deleteConfirm.confirmBtn}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
