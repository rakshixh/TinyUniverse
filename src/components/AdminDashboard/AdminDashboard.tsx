'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAdminUniverses } from '@/hooks/useUniverse';
import Loader from '@/components/Loader/Loader';
import Button from '@/components/UI/Button';
import Card from '@/components/UI/Card';
import Modal from '@/components/UI/Modal';
import { CONTENT } from '@/lib/content';
import type { IUniverse } from '@/types/universe';
import styles from './AdminDashboard.module.scss';

export default function AdminDashboard() {
  const { universes, isLoading, mutate } = useAdminUniverses();
  const router = useRouter();

  // Create Universe Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Universe Modal States
  const [editUniverse, setEditUniverse] = useState<IUniverse | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAccessCode, setEditAccessCode] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Universe Modal States
  const [universeToDelete, setUniverseToDelete] = useState<IUniverse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto slug preview helper
  const getSlugPreview = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      if (res.ok) {
        toast.success(CONTENT.admin.dashboard.logoutSuccess);
        sessionStorage.removeItem('session_active');
        router.refresh();
      } else {
        toast.error(CONTENT.admin.dashboard.logoutFailed);
      }
    } catch {
      toast.error(CONTENT.common.genericError);
    }
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !accessCode.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/universes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          accessCode: accessCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || CONTENT.common.genericError);
        return;
      }

      toast.success(CONTENT.admin.createModal.successToast);
      mutate({ universes: [data.universe, ...universes] }, { revalidate: false });
      setTitle('');
      setDescription('');
      setAccessCode('');
      setIsCreateOpen(false);
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
      const res = await fetch(`/api/admin/universes/${editUniverse._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDesc.trim(),
          accessCode: editAccessCode.trim() || undefined, // Send only if not empty
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || CONTENT.common.genericError);
        return;
      }

      toast.success(CONTENT.admin.editModal.successToast);
      mutate(
        {
          universes: universes.map((u) =>
            u._id === editUniverse._id ? { ...data.universe, solarSystemCount: u.solarSystemCount, memoryCount: u.memoryCount } : u
          ),
        },
        { revalidate: false }
      );
      setEditUniverse(null);
      setEditAccessCode('');
    } catch {
      toast.error(CONTENT.common.genericError);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteUniverse = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/universes/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || CONTENT.common.genericError);
        return;
      }

      toast.success(CONTENT.admin.deleteModal.successToast);
      mutate(
        { universes: universes.filter((u) => u._id !== id) },
        { revalidate: false }
      );
      setUniverseToDelete(null);
    } catch {
      toast.error(CONTENT.common.genericError);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyUniverseLink = (slug: string) => {
    const origin = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const link = `${origin}/?u=${slug}`;
    navigator.clipboard.writeText(link);
    toast.success(CONTENT.admin.dashboard.cards.linkCopiedToast);
  };

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logoEmoji} aria-hidden="true">🌌</span>
          <h1 className={styles.title}>
            TINY <span className={styles.titleAccent}>UNIVERSE</span>
          </h1>
        </div>
        <div className={styles.headerRight}>
          <Button variant="secondary" onClick={handleLogout} className={styles.logoutBtn}>
            <span className={styles.desktopText}>{CONTENT.admin.dashboard.logoutBtn}</span>
            <span className={styles.mobileText}>{CONTENT.admin.dashboard.logoutBtnMobile}</span>
          </Button>
          <Button variant="primary" onClick={() => setIsCreateOpen(true)} className={styles.igniteBtn}>
            <span className={styles.desktopText}>{CONTENT.admin.dashboard.createBtn}</span>
            <span className={styles.mobileText}>{CONTENT.admin.dashboard.createBtnMobile}</span>
          </Button>
        </div>
      </header>

      {/* Main Stats / List */}
      <main className={styles.main}>
        <h2 className={styles.adminSectionTitle}>{CONTENT.admin.dashboard.sectionTitle}</h2>
        {isLoading ? (
          <Loader message={CONTENT.universeList.loader} />
        ) : universes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">
              {CONTENT.admin.dashboard.emptyState.icon}
            </div>
            <h2>{CONTENT.admin.dashboard.emptyState.title}</h2>
            <p>{CONTENT.admin.dashboard.emptyState.subtitle}</p>
            <Button onClick={() => setIsCreateOpen(true)} variant="primary">
              {CONTENT.admin.dashboard.emptyState.cta}
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {/* Create Card */}
            <Card
              onClick={() => setIsCreateOpen(true)}
              className={styles.createCard}
              ariaLabel={CONTENT.admin.dashboard.emptyState.cta}
            >
              <span className={styles.plusIcon} aria-hidden="true">＋</span>
              <h3>{CONTENT.admin.dashboard.emptyState.cta}</h3>
              <p>{CONTENT.admin.dashboard.createCardDesc}</p>
            </Card>

            {/* Universe Cards */}
            {universes.map((univ) => (
              <Card key={univ._id} className={styles.card} hoverable={false}>
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderLeft}>
                      <span className={styles.cardIcon} aria-hidden="true">🪐</span>
                      <h3>{univ.title}</h3>
                    </div>
                  </div>

                  <p className={styles.cardSlug}>
                    <strong>{CONTENT.admin.dashboard.slugLabel}</strong> <code>{univ.slug}</code>
                  </p>

                  <p className={styles.cardDesc}>
                    {univ.description || CONTENT.universeList.grid.card.noDesc}
                  </p>

                  <div className={styles.cardStats}>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>{CONTENT.admin.dashboard.solarSystemsLabel}</span>
                      <span className={styles.statValue}>{univ.solarSystemCount ?? 0}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>{CONTENT.admin.dashboard.memoriesLabel}</span>
                      <span className={styles.statValue}>{univ.memoryCount ?? 0}</span>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <span className={styles.cardDate}>
                      {new Date(univ.createdAt).toLocaleDateString()}
                    </span>
                    <div className={styles.cardActions}>
                      <Button
                        variant="primary"
                        className={styles.actionBtn}
                        onClick={() => router.push(`/?u=${univ.slug}`)}
                      >
                        {CONTENT.admin.dashboard.cards.openBtn}
                      </Button>
                      <Button
                        variant="secondary"
                        className={styles.actionBtn}
                        onClick={() => copyUniverseLink(univ.slug)}
                      >
                        {CONTENT.admin.dashboard.cards.copyLinkBtn}
                      </Button>
                      <Button
                        variant="secondary"
                        className={styles.actionBtn}
                        onClick={() => {
                          setEditUniverse(univ);
                          setEditTitle(univ.title);
                          setEditDesc(univ.description || '');
                          setEditAccessCode('');
                        }}
                      >
                        {CONTENT.admin.dashboard.cards.editBtn}
                      </Button>
                      <Button
                        variant="danger"
                        className={styles.actionBtn}
                        onClick={() => setUniverseToDelete(univ)}
                      >
                        {CONTENT.admin.dashboard.cards.deleteBtn}
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
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={CONTENT.admin.createModal.title}
        disabled={isSubmitting}
      >
        <form onSubmit={handleCreateSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="univ-title">{CONTENT.admin.createModal.fieldName}</label>
            <input
              id="univ-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={CONTENT.admin.createModal.fieldNamePlaceholder}
              maxLength={100}
              disabled={isSubmitting}
            />
            {title && (
              <span className={styles.slugPreview}>
                {CONTENT.admin.createModal.slugPreview} <code>{getSlugPreview(title)}</code>
              </span>
            )}
          </div>
          <div className={styles.field}>
            <label htmlFor="univ-desc">{CONTENT.admin.createModal.fieldDesc}</label>
            <textarea
              id="univ-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={CONTENT.admin.createModal.fieldDescPlaceholder}
              maxLength={500}
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="univ-code">{CONTENT.admin.createModal.fieldCode}</label>
            <input
              id="univ-code"
              type="text"
              required
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder={CONTENT.admin.createModal.fieldCodePlaceholder}
              disabled={isSubmitting}
            />
          </div>
          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText={CONTENT.admin.createModal.submitBtnLoading}
            disabled={!title.trim() || !accessCode.trim()}
          >
            {CONTENT.admin.createModal.submitBtn}
          </Button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editUniverse}
        onClose={() => setEditUniverse(null)}
        title={CONTENT.admin.editModal.title}
        disabled={isSubmittingEdit}
      >
        <form onSubmit={handleEditSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="edit-univ-title">{CONTENT.admin.editModal.fieldName}</label>
            <input
              id="edit-univ-title"
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder={CONTENT.admin.editModal.fieldNamePlaceholder}
              maxLength={100}
              disabled={isSubmittingEdit}
            />
            {editTitle && (
              <span className={styles.slugPreview}>
                {CONTENT.admin.editModal.slugPreview} <code>{getSlugPreview(editTitle)}</code>
              </span>
            )}
          </div>
          <div className={styles.field}>
            <label htmlFor="edit-univ-desc">{CONTENT.admin.editModal.fieldDesc}</label>
            <textarea
              id="edit-univ-desc"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder={CONTENT.admin.editModal.fieldDescPlaceholder}
              maxLength={500}
              rows={3}
              disabled={isSubmittingEdit}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="edit-univ-code">{CONTENT.admin.editModal.fieldCode}</label>
            <input
              id="edit-univ-code"
              type="text"
              value={editAccessCode}
              onChange={(e) => setEditAccessCode(e.target.value)}
              placeholder={CONTENT.admin.editModal.fieldCodePlaceholder}
              disabled={isSubmittingEdit}
            />
          </div>
          <Button
            type="submit"
            isLoading={isSubmittingEdit}
            loadingText={CONTENT.admin.editModal.submitBtnLoading}
            disabled={!editTitle.trim()}
          >
            {CONTENT.admin.editModal.submitBtn}
          </Button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!universeToDelete}
        onClose={() => setUniverseToDelete(null)}
        title={CONTENT.admin.deleteModal.title}
        variant="danger"
        disabled={isDeleting}
      >
        <div className={styles.modalBody}>
          <p className={styles.warningMessage}>
            {CONTENT.admin.deleteModal.warningPrefix}
            <strong>{universeToDelete?.title}</strong>
            {CONTENT.admin.deleteModal.warningSuffix}
          </p>
          <p className={styles.warningSubtext}>
            {CONTENT.admin.deleteModal.subtext}
          </p>
        </div>
        <div className={styles.modalActions}>
          <Button variant="cancel" onClick={() => setUniverseToDelete(null)} disabled={isDeleting}>
            {CONTENT.admin.deleteModal.cancelBtn}
          </Button>
          <Button variant="danger" onClick={() => universeToDelete && handleDeleteUniverse(universeToDelete._id)} isLoading={isDeleting} loadingText={CONTENT.admin.deleteModal.confirmBtnLoading}>
            {CONTENT.admin.deleteModal.confirmBtn}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
