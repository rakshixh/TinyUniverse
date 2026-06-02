'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useUniverses } from '@/hooks/useUniverse';
import Loader from '@/components/Loader/Loader';
import styles from './universeList.module.scss';
import type { IUniverse } from '@/types/universe';

export default function UniverseDirectoryPage() {
  const { universes, isLoading, mutate } = useUniverses();
  const router = useRouter();

  // Create Universe Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Universe Modal States
  const [editUniverse, setEditUniverse] = useState<IUniverse | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Universe Modal States
  const [universeToDelete, setUniverseToDelete] = useState<IUniverse | null>(null);

  // Info Popup State
  const [infoUniverse, setInfoUniverse] = useState<IUniverse | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/universe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to create universe');
        return;
      }

      toast.success('New universe ignited ✨');
      mutate({ universes: [data.universe, ...universes] }, { revalidate: false });
      setTitle('');
      setDescription('');
      setIsModalOpen(false);
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editUniverse || !editTitle.trim() || isSubmittingEdit) return;

    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/universe/${editUniverse._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDesc.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to update universe');
        return;
      }

      toast.success('Universe details updated ✨');
      mutate(
        {
          universes: universes.map((u) =>
            u._id === editUniverse._id ? data.universe : u
          ),
        },
        { revalidate: false }
      );
      setEditUniverse(null);
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteUniverse = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/universe/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete universe');
        return;
      }

      toast.success('Universe dissolved into stardust 🌑');
      mutate(
        { universes: universes.filter((u) => u._id !== id) },
        { revalidate: false }
      );
      setUniverseToDelete(null);
    } catch {
      toast.error('Something went wrong. Try again.');
    }
  };

  const handleCardClick = (id: string) => {
    router.push(`/universe/${id}`);
  };

  return (
    <div className={styles.page}>
      <div className="star-field" aria-hidden="true" />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logoEmoji} aria-hidden="true">🌌</span>
          <h1 className={styles.title}>
            Tiny <span className={styles.titleAccent}>Universe</span>
          </h1>
        </div>
        <button
          className={styles.igniteButton}
          onClick={() => setIsModalOpen(true)}
          aria-label="Create new universe"
        >
          Ignite Universe
        </button>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {isLoading ? (
          <Loader message="Mapping the cosmos..." />
        ) : universes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">🛸</div>
            <h2>Your cosmos is currently void</h2>
            <p>You haven&apos;t created any universes yet. Ignite the first universe to start recording memories.</p>
            <button
              className={styles.ctaButton}
              onClick={() => setIsModalOpen(true)}
            >
              Ignite Your First Universe
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {/* Create Card */}
            <button
              className={styles.createCard}
              onClick={() => setIsModalOpen(true)}
              aria-label="Ignite new universe"
            >
              <span className={styles.plusIcon} aria-hidden="true">＋</span>
              <h3>Ignite New Universe</h3>
              <p>Create a brand new shared digital universe</p>
            </button>

            {/* Universe Cards */}
            {universes.map((univ) => (
              <div
                key={univ._id}
                className={styles.card}
                onClick={() => handleCardClick(univ._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleCardClick(univ._id);
                  }
                }}
                aria-label={`Enter universe ${univ.title}`}
              >
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderLeft}>
                      <span className={styles.cardIcon} aria-hidden="true">🪐</span>
                      <h3>{univ.title}</h3>
                    </div>
                    {univ.description && (
                      <button
                        type="button"
                        className={styles.infoBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoUniverse(univ);
                        }}
                        title="Show full description"
                        aria-label="Show full description"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={styles.infoSvg}
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4" />
                          <path d="M12 8h.01" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className={styles.cardDesc}>
                    {univ.description || 'No description provided.'}
                  </p>
                  <div className={styles.cardFooter}>
                    <span>Created: {new Date(univ.createdAt).toLocaleDateString()}</span>
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditUniverse(univ);
                          setEditTitle(univ.title);
                          setEditDesc(univ.description || '');
                        }}
                        title="Edit universe details"
                        aria-label={`Edit ${univ.title}`}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setUniverseToDelete(univ);
                        }}
                        title="Dissolve universe"
                        aria-label={`Dissolve ${univ.title}`}
                      >
                        Dissolve
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Ignite Modal */}
      {isModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Ignite new universe"
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Ignite New Universe</h2>
              <button
                className={styles.closeButton}
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="universe-title">Universe Title *</label>
                <input
                  id="universe-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Rakshith's Galaxy, Memory Lane"
                  maxLength={100}
                  disabled={isSubmitting}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="universe-desc">Description (optional)</label>
                <textarea
                  id="universe-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this universe represent?"
                  maxLength={500}
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting || !title.trim()}
              >
                {isSubmitting ? 'Creating Universe...' : 'Ignite Cosmos'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUniverse && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setEditUniverse(null); }}
          role="dialog"
          aria-modal="true"
          aria-label="Edit universe details"
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Edit Universe Details</h2>
              <button
                className={styles.closeButton}
                onClick={() => setEditUniverse(null)}
                disabled={isSubmittingEdit}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="edit-universe-title">Universe Title *</label>
                <input
                  id="edit-universe-title"
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g., Rakshith's Galaxy, Memory Lane"
                  maxLength={100}
                  disabled={isSubmittingEdit}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="edit-universe-desc">Description (optional)</label>
                <textarea
                  id="edit-universe-desc"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="What does this universe represent?"
                  maxLength={500}
                  rows={4}
                  disabled={isSubmittingEdit}
                />
              </div>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmittingEdit || !editTitle.trim()}
              >
                {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {universeToDelete && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setUniverseToDelete(null); }}
          role="dialog"
          aria-modal="true"
          aria-label={`Dissolve ${universeToDelete.title}`}
        >
          <div className={`${styles.modal} ${styles.deleteModal}`}>
            <div className={styles.modalHeader}>
              <h2 className={styles.deleteTitle}>Dissolve Universe</h2>
              <button
                className={styles.closeButton}
                onClick={() => setUniverseToDelete(null)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody} style={{ margin: '16px 0 24px 0' }}>
              <p className={styles.warningMessage} style={{ fontSize: '1rem', color: '#FFFFFF', marginBottom: '12px', lineHeight: '1.5' }}>
                Are you sure you want to dissolve the universe <strong>{universeToDelete.title}</strong>?
              </p>
              <p className={styles.warningSubtext} style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: '1.6' }}>
                This cosmic collapse is irreversible. All star systems, planets, and memories inside this universe will be permanently dissolved into the void.
              </p>
            </div>
            <div className={styles.modalActions} style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setUniverseToDelete(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid #1E293B',
                  color: '#94A3B8',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.875rem'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmDeleteBtn}
                onClick={() => handleDeleteUniverse(universeToDelete._id, universeToDelete.title)}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #EF4444',
                  color: '#FF8A8A',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 0 12px rgba(239, 68, 68, 0.15)'
                }}
              >
                Dissolve Cosmos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Popup Modal */}
      {infoUniverse && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setInfoUniverse(null); }}
          role="dialog"
          aria-modal="true"
          aria-label={`About ${infoUniverse.title}`}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{infoUniverse.title}</h2>
              <button
                className={styles.closeButton}
                onClick={() => setInfoUniverse(null)}
              >
                ✕
              </button>
            </div>
            <div className={styles.infoContent}>
              <p className={styles.fullDesc} style={{ whiteSpace: 'pre-wrap', color: '#E2E8F0', fontSize: '0.95rem', lineHeight: '1.6' }}>
                {infoUniverse.description || 'No description provided.'}
              </p>
              <div className={styles.infoFooter} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginTop: '24px', borderTop: '1px solid rgba(30, 41, 59, 0.5)', paddingTop: '12px' }}>
                <span>Created: {new Date(infoUniverse.createdAt).toLocaleDateString()}</span>
                <span>Last Updated: {new Date(infoUniverse.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
