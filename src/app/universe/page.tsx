'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useUniverses } from '@/hooks/useUniverse';
import Loader from '@/components/Loader/Loader';
import Button from '@/components/UI/Button';
import Card from '@/components/UI/Card';
import Modal from '@/components/UI/Modal';
import { CONTENT } from '@/lib/content';
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
        toast.error(data.error || CONTENT.common.genericError);
        return;
      }

      toast.success(CONTENT.universeList.igniteModal.successToast);
      mutate({ universes: [data.universe, ...universes] }, { revalidate: false });
      setTitle('');
      setDescription('');
      setIsModalOpen(false);
    } catch {
      toast.error(CONTENT.common.genericError);
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
        toast.error(data.error || CONTENT.common.genericError);
        return;
      }

      toast.success(CONTENT.universeList.editModal.successToast);
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
      toast.error(CONTENT.common.genericError);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteUniverse = async (id: string) => {
    try {
      const res = await fetch(`/api/universe/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || CONTENT.common.genericError);
        return;
      }

      toast.success(CONTENT.universeList.deleteModal.successToast);
      mutate(
        { universes: universes.filter((u) => u._id !== id) },
        { revalidate: false }
      );
      setUniverseToDelete(null);
    } catch {
      toast.error(CONTENT.common.genericError);
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
            {CONTENT.universeList.header.title}{' '}
            <span className={styles.titleAccent}>{CONTENT.universeList.header.titleAccent}</span>
          </h1>
        </div>
        <Button
          variant="primary"
          className={styles.igniteBtn}
          onClick={() => setIsModalOpen(true)}
          aria-label={CONTENT.universeList.header.igniteBtn}
        >
          {CONTENT.universeList.header.igniteBtn}
        </Button>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {isLoading ? (
          <Loader message={CONTENT.universeList.loader} />
        ) : universes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">
              {CONTENT.universeList.emptyState.icon}
            </div>
            <h2>{CONTENT.universeList.emptyState.title}</h2>
            <p>{CONTENT.universeList.emptyState.subtitle}</p>
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="primary"
            >
              {CONTENT.universeList.emptyState.cta}
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {/* Create Card */}
            <Card
              onClick={() => setIsModalOpen(true)}
              className={styles.createCard}
              ariaLabel={CONTENT.universeList.grid.createCard.title}
            >
              <span className={styles.plusIcon} aria-hidden="true">
                {CONTENT.universeList.grid.createCard.plus}
              </span>
              <h3>{CONTENT.universeList.grid.createCard.title}</h3>
              <p>{CONTENT.universeList.grid.createCard.desc}</p>
            </Card>

            {/* Universe Cards */}
            {universes.map((univ) => (
              <Card
                key={univ._id}
                onClick={() => handleCardClick(univ._id)}
                className={styles.card}
                ariaLabel={`Enter universe ${univ.title}`}
              >
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderLeft}>
                      <span className={styles.cardIcon} aria-hidden="true">
                        {CONTENT.universeList.grid.card.icon}
                      </span>
                      <h3>{univ.title}</h3>
                    </div>
                    {univ.description && (
                      <Button
                        variant="icon"
                        className={styles.infoBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoUniverse(univ);
                        }}
                        title={CONTENT.universeList.grid.card.infoTooltip}
                        aria-label={CONTENT.universeList.grid.card.infoTooltip}
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
                      </Button>
                    )}
                  </div>
                  <p className={styles.cardDesc}>
                    {univ.description || CONTENT.universeList.grid.card.noDesc}
                  </p>
                  <div className={styles.cardFooter}>
                    <span>
                      {CONTENT.universeList.grid.card.created}{' '}
                      {new Date(univ.createdAt).toLocaleDateString()}
                    </span>
                    <div className={styles.cardActions}>
                      <Button
                        variant="secondary"
                        className={styles.editBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditUniverse(univ);
                          setEditTitle(univ.title);
                          setEditDesc(univ.description || '');
                        }}
                        title={`Edit ${univ.title}`}
                        aria-label={`Edit ${univ.title}`}
                      >
                        {CONTENT.universeList.grid.card.editBtn}
                      </Button>
                      <Button
                        variant="danger"
                        className={styles.deleteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setUniverseToDelete(univ);
                        }}
                        title={`Dissolve ${univ.title}`}
                        aria-label={`Dissolve ${univ.title}`}
                      >
                        {CONTENT.universeList.grid.card.deleteBtn}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Ignite Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={CONTENT.universeList.igniteModal.title}
        disabled={isSubmitting}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="universe-title">
              {CONTENT.universeList.igniteModal.fieldTitle}
            </label>
            <input
              id="universe-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={CONTENT.universeList.igniteModal.fieldTitlePlaceholder}
              maxLength={100}
              disabled={isSubmitting}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="universe-desc">
              {CONTENT.universeList.igniteModal.fieldDesc}
            </label>
            <textarea
              id="universe-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={CONTENT.universeList.igniteModal.fieldDescPlaceholder}
              maxLength={500}
              rows={4}
              disabled={isSubmitting}
            />
          </div>
          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText={CONTENT.universeList.igniteModal.submitBtnLoading}
          >
            {CONTENT.universeList.igniteModal.submitBtn}
          </Button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editUniverse}
        onClose={() => setEditUniverse(null)}
        title={CONTENT.universeList.editModal.title}
        disabled={isSubmittingEdit}
      >
        <form onSubmit={handleEditSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="edit-universe-title">
              {CONTENT.universeList.editModal.fieldTitle}
            </label>
            <input
              id="edit-universe-title"
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder={CONTENT.universeList.editModal.fieldTitlePlaceholder}
              maxLength={100}
              disabled={isSubmittingEdit}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="edit-universe-desc">
              {CONTENT.universeList.editModal.fieldDesc}
            </label>
            <textarea
              id="edit-universe-desc"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder={CONTENT.universeList.editModal.fieldDescPlaceholder}
              maxLength={500}
              rows={4}
              disabled={isSubmittingEdit}
            />
          </div>
          <Button
            type="submit"
            isLoading={isSubmittingEdit}
            loadingText={CONTENT.universeList.editModal.submitBtnLoading}
          >
            {CONTENT.universeList.editModal.submitBtn}
          </Button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!universeToDelete}
        onClose={() => setUniverseToDelete(null)}
        title={CONTENT.universeList.deleteModal.title}
        variant="danger"
      >
        <div className={styles.modalBody}>
          <p className={styles.warningMessage}>
            {CONTENT.universeList.deleteModal.warningPrefix}
            <strong>{universeToDelete?.title}</strong>
            {CONTENT.universeList.deleteModal.warningSuffix}
          </p>
          <p className={styles.warningSubtext}>
            {CONTENT.universeList.deleteModal.subtext}
          </p>
        </div>
        <div className={styles.modalActions}>
          <Button
            variant="cancel"
            onClick={() => setUniverseToDelete(null)}
          >
            {CONTENT.universeList.deleteModal.cancelBtn}
          </Button>
          <Button
            variant="danger"
            onClick={() => universeToDelete && handleDeleteUniverse(universeToDelete._id)}
          >
            {CONTENT.universeList.deleteModal.confirmBtn}
          </Button>
        </div>
      </Modal>

      {/* Info Popup Modal */}
      <Modal
        isOpen={!!infoUniverse}
        onClose={() => setInfoUniverse(null)}
        title={infoUniverse ? `${CONTENT.universeList.infoModal.titlePrefix}${infoUniverse.title}` : ''}
      >
        <div className={styles.infoContent}>
          <p className={styles.fullDesc}>
            {infoUniverse?.description || CONTENT.universeList.infoModal.noDesc}
          </p>
          <div className={styles.infoFooter}>
            <span>
              {CONTENT.universeList.infoModal.created}{' '}
              {infoUniverse ? new Date(infoUniverse.createdAt).toLocaleDateString() : ''}
            </span>
            <span>
              {CONTENT.universeList.infoModal.updated}{' '}
              {infoUniverse ? new Date(infoUniverse.updatedAt).toLocaleDateString() : ''}
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
