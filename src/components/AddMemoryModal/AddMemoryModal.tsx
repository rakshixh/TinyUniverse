'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import type { IMemory } from '@/types/memory';
import {
  API_PATHS,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from '@/lib/constants';
import styles from './AddMemoryModal.module.scss';

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (memory: IMemory) => void;
}

export default function AddMemoryModal({
  isOpen,
  onClose,
  onCreated,
}: AddMemoryModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const overlayRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = isUploading || isSubmitting;

  // Reset form
  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setImageFile(null);
    setImagePreview(null);
    setIsDragging(false);
    setIsUploading(false);
    setIsSubmitting(false);
    setUploadProgress(0);
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

  const handleImageFile = (file: File) => {
    // Validate
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
      toast.error('Please use JPG, PNG or WebP images');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error('Image must be under 5MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isLoading) return;

    let imageUrl = '';

    // Upload image first if selected
    if (imageFile) {
      setIsUploading(true);
      setUploadProgress(30);

      try {
        const formData = new FormData();
        formData.append('file', imageFile);

        const uploadRes = await fetch(API_PATHS.upload, {
          method: 'POST',
          body: formData,
        });

        setUploadProgress(80);
        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          toast.error(uploadData.error || 'Image upload failed');
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }

        imageUrl = uploadData.url;
        setUploadProgress(100);
      } catch {
        toast.error('Image upload failed. Try again.');
        setIsUploading(false);
        setUploadProgress(0);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    // Create memory
    setIsSubmitting(true);
    try {
      const res = await fetch(API_PATHS.memories, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          imageUrl,
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
          <h2 className={styles.title}>New Memory</h2>
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

          {/* Image Upload */}
          <div className={styles.field}>
            <span className={styles.label}>
              Image <span className={styles.optional}>(optional · JPG, PNG, WebP · max 5MB)</span>
            </span>

            {imagePreview ? (
              <div className={styles.imagePreview}>
                <Image
                  src={imagePreview}
                  alt="Memory image preview"
                  fill
                  className={styles.previewImg}
                  sizes="400px"
                />
                <button
                  type="button"
                  className={styles.removeImage}
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  disabled={isLoading}
                  aria-label="Remove selected image"
                >
                  ✕
                </button>
                {isUploading && (
                  <div className={styles.uploadOverlay}>
                    <div
                      className={styles.progressBar}
                      style={{ width: `${uploadProgress}%` }}
                      role="progressbar"
                      aria-valuenow={uploadProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                    <span className={styles.uploadText}>Uploading...</span>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                aria-label="Upload image — click or drag and drop"
              >
                <span className={styles.dropIcon} aria-hidden="true">🌠</span>
                <span className={styles.dropText}>
                  {isDragging ? 'Drop it here!' : 'Click or drag image here'}
                </span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className={styles.hiddenInput}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFile(file);
                e.target.value = '';
              }}
              aria-hidden="true"
              tabIndex={-1}
            />
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
                {isUploading ? 'Uploading image...' : 'Creating planet...'}
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
