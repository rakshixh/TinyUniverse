'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useSolarSystems } from '@/hooks/useSolarSystems';
import Loader from '@/components/Loader/Loader';
import Button from '@/components/UI/Button';
import Card from '@/components/UI/Card';
import Modal from '@/components/UI/Modal';
import { CONTENT } from '@/lib/content';
import type { IUniverse } from '@/types/universe';
import type { ISolarSystem } from '@/types/solarsystem';
import SpaceBackground from '@/components/UI/SpaceBackground';
import styles from './GuestSystemsHub.module.scss';

// Star colors and classifications from CONTENT
const STAR_COLORS = CONTENT.systemsHub.starColors;
const STAR_TYPES = CONTENT.systemsHub.starTypes;

const isValidHex = (hex: string) => {
  return /^#[0-9A-Fa-f]{6}$|^#[0-9A-Fa-f]{3}$/.test(hex);
};

const getDisplayColor = (text: string) => {
  if (!text) return '#FBBF24';
  if (text.startsWith('#')) return text;
  if (/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(text)) {
    return `#${text}`;
  }
  return text;
};

interface GuestSystemsHubProps {
  universe: IUniverse;
  isAdmin: boolean;
}

export default function GuestSystemsHub({ universe, isAdmin }: GuestSystemsHubProps) {
  const router = useRouter();
  const { systems, isLoading, mutate } = useSolarSystems(universe._id);

  // Solar system ignite form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [starColor, setStarColor] = useState('#FBBF24');
  const [customColorText, setCustomColorText] = useState('#FBBF24');
  const [starType, setStarType] = useState('dwarf');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Solar System form states
  const [editSystem, setEditSystem] = useState<ISolarSystem | null>(null);
  const [editSystemName, setEditSystemName] = useState('');
  const [editSystemDesc, setEditSystemDesc] = useState('');
  const [editSystemColor, setEditSystemColor] = useState('#FBBF24');
  const [editCustomColorText, setEditCustomColorText] = useState('#FBBF24');
  const [editSystemType, setEditSystemType] = useState('dwarf');
  const [isSubmittingEditSystem, setIsSubmittingEditSystem] = useState(false);

  // Helper change handlers
  const handleCustomColorChange = (val: string) => {
    setCustomColorText(val);
    const checkVal = val.startsWith('#') ? val : `#${val}`;
    if (isValidHex(checkVal)) {
      setStarColor(checkVal);
    }
  };

  const handleCustomColorBlur = () => {
    setCustomColorText(starColor);
  };

  const handleEditCustomColorChange = (val: string) => {
    setEditCustomColorText(val);
    const checkVal = val.startsWith('#') ? val : `#${val}`;
    if (isValidHex(checkVal)) {
      setEditSystemColor(checkVal);
    }
  };

  const handleEditCustomColorBlur = () => {
    setEditCustomColorText(editSystemColor);
  };

  // Delete System Modal States
  const [systemToDelete, setSystemToDelete] = useState<ISolarSystem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Solar System Info popup state
  const [infoSystem, setInfoSystem] = useState<ISolarSystem | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/solar-systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          universeId: universe._id,
          name: name.trim(),
          description: description.trim(),
          starColor,
          starType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || CONTENT.common.genericError);
        return;
      }

      toast.success(CONTENT.systemsHub.igniteModal.successToast);
      mutate({ systems: [...systems, data.system] }, { revalidate: false });
      setName('');
      setDescription('');
      setStarColor('#FBBF24');
      setCustomColorText('#FBBF24');
      setStarType('dwarf');
      setIsModalOpen(false);
    } catch {
      toast.error(CONTENT.common.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSystemSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editSystem || !editSystemName.trim() || isSubmittingEditSystem) return;

    setIsSubmittingEditSystem(true);
    try {
      const res = await fetch(`/api/solar-systems/${editSystem._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editSystemName.trim(),
          description: editSystemDesc.trim(),
          starColor: editSystemColor,
          starType: editSystemType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || CONTENT.common.genericError);
        return;
      }

      toast.success(CONTENT.systemsHub.editModal.successToast);
      mutate(
        {
          systems: systems.map((s) =>
            s._id === editSystem._id ? data.system : s
          ),
        },
        { revalidate: false }
      );
      setEditSystem(null);
    } catch {
      toast.error(CONTENT.common.genericError);
    } finally {
      setIsSubmittingEditSystem(false);
    }
  };

  const handleDeleteSystem = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/solar-systems/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || CONTENT.common.genericError);
        return;
      }

      toast.success(CONTENT.systemsHub.deleteModal.successToast);
      mutate({ systems: systems.filter((s) => s._id !== id) }, { revalidate: false });
      setSystemToDelete(null);
    } catch {
      toast.error(CONTENT.common.genericError);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCardClick = (id: string) => {
    router.push(`/?u=${universe.slug}&system=${id}`);
  };

  return (
    <div className={styles.page}>
      <SpaceBackground />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {isAdmin ? (
            <Link href="/" className={styles.backLink} aria-label="Back to Admin Dashboard">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Dashboard
            </Link>
          ) : (
            <span className={styles.logoEmoji} aria-hidden="true">🌌</span>
          )}
          <h1 className={styles.title}>
            TINY <span className={styles.titleAccent}>UNIVERSE</span>
          </h1>
        </div>
        {!isLoading && (
          <Button
            variant="primary"
            className={styles.igniteBtn}
            onClick={() => setIsModalOpen(true)}
            aria-label={CONTENT.systemsHub.header.igniteBtn}
          >
            {CONTENT.systemsHub.header.igniteBtn}
          </Button>
        )}
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <h2 className={styles.universeSectionTitle}>{universe.title}</h2>
        {isLoading ? (
          <Loader message={CONTENT.systemsHub.loader} />
        ) : systems.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">
              {CONTENT.systemsHub.emptyState.icon}
            </div>
            <h2>{CONTENT.systemsHub.emptyState.title}</h2>
            <p>{CONTENT.systemsHub.emptyState.subtitle}</p>
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="primary"
            >
              {CONTENT.systemsHub.emptyState.cta}
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {/* Create Card */}
            <Card
              onClick={() => setIsModalOpen(true)}
              className={styles.createCard}
              ariaLabel={CONTENT.systemsHub.grid.createCard.title}
            >
              <span className={styles.plusIcon} aria-hidden="true">
                {CONTENT.systemsHub.grid.createCard.plus}
              </span>
              <h3>{CONTENT.systemsHub.grid.createCard.title}</h3>
              <p>{CONTENT.systemsHub.grid.createCard.desc}</p>
            </Card>

            {/* System Cards */}
            {systems.map((system) => (
              <Card
                key={system._id}
                onClick={() => handleCardClick(system._id)}
                className={styles.card}
                ariaLabel={`Enter system ${system.title}`}
              >
                <div
                  className={styles.cardHeaderGlow}
                  style={{
                    background: `radial-gradient(circle, ${system.starColor} 0%, transparent 70%)`,
                  }}
                  aria-hidden="true"
                />
                
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderLeft}>
                      <div
                        className={styles.starPreview}
                        style={{
                          backgroundColor: system.starColor,
                          boxShadow: `0 0 12px ${system.starColor}`,
                        }}
                        aria-hidden="true"
                      />
                      <div>
                        <h3>{system.title}</h3>
                        <span className={styles.starTypeBadge}>{system.starType}</span>
                      </div>
                    </div>
                    {system.description && (
                      <Button
                        variant="icon"
                        className={styles.infoBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoSystem(system);
                        }}
                        title={CONTENT.systemsHub.grid.card.infoTooltip}
                        aria-label={CONTENT.systemsHub.grid.card.infoTooltip}
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
                    {system.description || CONTENT.systemsHub.grid.card.noDesc}
                  </p>

                  <div className={styles.cardFooter}>
                    <span>{CONTENT.systemsHub.grid.card.enterPrompt}</span>
                    
                    {/* Render action buttons for both Admin and Guest (Dissolve disabled for guest) */}
                    <div className={styles.cardActions}>
                      <Button
                        variant="secondary"
                        className={styles.editBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditSystem(system);
                          setEditSystemName(system.title);
                          setEditSystemDesc(system.description || '');
                          setEditSystemColor(system.starColor);
                          setEditCustomColorText(system.starColor);
                          setEditSystemType(system.starType);
                        }}
                        title={`Edit ${system.title}`}
                        aria-label={`Edit ${system.title}`}
                      >
                        {CONTENT.systemsHub.grid.card.editBtn}
                      </Button>
                      <Button
                        variant="danger"
                        className={styles.deleteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSystemToDelete(system);
                        }}
                        disabled={!isAdmin}
                        title={isAdmin ? `Dissolve ${system.title}` : 'Only Admin can dissolve systems'}
                        aria-label={`Dissolve ${system.title}`}
                      >
                        {CONTENT.systemsHub.grid.card.deleteBtn}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Ignite Star System Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={CONTENT.systemsHub.igniteModal.title}
        disabled={isSubmitting}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="system-name">
              {CONTENT.systemsHub.igniteModal.fieldName}
            </label>
            <input
              id="system-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={CONTENT.systemsHub.igniteModal.fieldNamePlaceholder}
              maxLength={100}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="system-desc">
              {CONTENT.systemsHub.igniteModal.fieldDesc}
            </label>
            <textarea
              id="system-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={CONTENT.systemsHub.igniteModal.fieldDescPlaceholder}
              maxLength={500}
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Star Type Selector */}
          <div className={styles.field}>
            <label htmlFor="system-startype">
              {CONTENT.systemsHub.igniteModal.fieldType}
            </label>
            <select
              id="system-startype"
              value={starType}
              onChange={(e) => setStarType(e.target.value)}
              disabled={isSubmitting}
              className={styles.selectInput}
            >
              {STAR_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Star Color Selection */}
          <div className={styles.field}>
            <span className={styles.fieldLabel}>
              {CONTENT.systemsHub.igniteModal.fieldColor}
            </span>
            <div className={styles.colorGrid}>
              {STAR_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`${styles.colorOption} ${starColor === color.value ? styles.selectedColor : ''}`}
                  style={{
                    '--star-color': color.value,
                    boxShadow: starColor === color.value ? `0 0 12px ${color.value}` : 'none',
                  } as React.CSSProperties}
                  onClick={() => {
                    setStarColor(color.value);
                    setCustomColorText(color.value);
                  }}
                  disabled={isSubmitting}
                  title={color.name}
                  aria-label={color.name}
                >
                  <span className={styles.colorDot} style={{ backgroundColor: color.value }} />
                </button>
              ))}
            </div>

            {/* Custom Color Selector */}
            <div className={styles.customColorContainer}>
              <label htmlFor="custom-star-color">{CONTENT.systemsHub.igniteModal.customColorLabel}</label>
              <div className={styles.customColorRow}>
                <div className={styles.colorSlideContainer}>
                  <div 
                    className={styles.colorSlide} 
                    style={{ backgroundColor: getDisplayColor(customColorText) }} 
                  />
                </div>
                <input
                  id="custom-star-color"
                  type="text"
                  value={customColorText}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  onBlur={handleCustomColorBlur}
                  className={styles.hexTextInput}
                  placeholder={CONTENT.systemsHub.igniteModal.customColorPlaceholder}
                  maxLength={7}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText={CONTENT.systemsHub.igniteModal.submitBtnLoading}
          >
            {CONTENT.systemsHub.igniteModal.submitBtn}
          </Button>
        </form>
      </Modal>

      {/* Edit Star System Modal */}
      <Modal
        isOpen={!!editSystem}
        onClose={() => setEditSystem(null)}
        title={CONTENT.systemsHub.editModal.title}
        disabled={isSubmittingEditSystem}
      >
        <form onSubmit={handleEditSystemSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="edit-system-name">
              {CONTENT.systemsHub.editModal.fieldName}
            </label>
            <input
              id="edit-system-name"
              type="text"
              required
              value={editSystemName}
              onChange={(e) => setEditSystemName(e.target.value)}
              placeholder={CONTENT.systemsHub.editModal.fieldNamePlaceholder}
              maxLength={100}
              disabled={isSubmittingEditSystem}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="edit-system-desc">
              {CONTENT.systemsHub.editModal.fieldDesc}
            </label>
            <textarea
              id="edit-system-desc"
              value={editSystemDesc}
              onChange={(e) => setEditSystemDesc(e.target.value)}
              placeholder={CONTENT.systemsHub.editModal.fieldDescPlaceholder}
              maxLength={500}
              rows={3}
              disabled={isSubmittingEditSystem}
            />
          </div>

          {/* Star Type Selector */}
          <div className={styles.field}>
            <label htmlFor="edit-system-startype">
              {CONTENT.systemsHub.editModal.fieldType}
            </label>
            <select
              id="edit-system-startype"
              value={editSystemType}
              onChange={(e) => setEditSystemType(e.target.value)}
              disabled={isSubmittingEditSystem}
              className={styles.selectInput}
            >
              {STAR_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Star Color Selection */}
          <div className={styles.field}>
            <span className={styles.fieldLabel}>
              {CONTENT.systemsHub.editModal.fieldColor}
            </span>
            <div className={styles.colorGrid}>
              {STAR_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`${styles.colorOption} ${editSystemColor === color.value ? styles.selectedColor : ''}`}
                  style={{
                    '--star-color': color.value,
                    boxShadow: editSystemColor === color.value ? `0 0 12px ${color.value}` : 'none',
                  } as React.CSSProperties}
                  onClick={() => {
                    setEditSystemColor(color.value);
                    setEditCustomColorText(color.value);
                  }}
                  disabled={isSubmittingEditSystem}
                  title={color.name}
                  aria-label={color.name}
                >
                  <span className={styles.colorDot} style={{ backgroundColor: color.value }} />
                </button>
              ))}
            </div>

            {/* Custom Color Selector */}
            <div className={styles.customColorContainer}>
              <label htmlFor="edit-custom-star-color">{CONTENT.systemsHub.editModal.customColorLabel}</label>
              <div className={styles.customColorRow}>
                <div className={styles.colorSlideContainer}>
                  <div 
                    className={styles.colorSlide} 
                    style={{ backgroundColor: getDisplayColor(editCustomColorText) }} 
                  />
                </div>
                <input
                  id="edit-custom-star-color"
                  type="text"
                  value={editCustomColorText}
                  onChange={(e) => handleEditCustomColorChange(e.target.value)}
                  onBlur={handleEditCustomColorBlur}
                  className={styles.hexTextInput}
                  placeholder={CONTENT.systemsHub.editModal.customColorPlaceholder}
                  maxLength={7}
                  disabled={isSubmittingEditSystem}
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isSubmittingEditSystem}
            loadingText={CONTENT.systemsHub.editModal.submitBtnLoading}
            disabled={!editSystemName.trim() || isSubmittingEditSystem}
          >
            {CONTENT.systemsHub.editModal.submitBtn}
          </Button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!systemToDelete}
        onClose={() => setSystemToDelete(null)}
        title={CONTENT.systemsHub.deleteModal.title}
        variant="danger"
        disabled={isDeleting}
      >
        <div className={styles.modalBody}>
          <p className={styles.warningMessage}>
            {CONTENT.systemsHub.deleteModal.warningPrefix}
            <strong>{systemToDelete?.title}</strong>
            {CONTENT.systemsHub.deleteModal.warningSuffix}
          </p>
          <p className={styles.warningSubtext}>
            {CONTENT.systemsHub.deleteModal.subtext}
          </p>
        </div>
        <div className={styles.modalActions}>
          <Button
            variant="cancel"
            onClick={() => setSystemToDelete(null)}
            disabled={isDeleting}
          >
            {CONTENT.systemsHub.deleteModal.cancelBtn}
          </Button>
          <Button
            variant="danger"
            onClick={() => systemToDelete && handleDeleteSystem(systemToDelete._id)}
            isLoading={isDeleting}
            loadingText="Dissolving..."
          >
            {CONTENT.systemsHub.deleteModal.confirmBtn}
          </Button>
        </div>
      </Modal>

      {/* Info Popup Modal */}
      <Modal
        isOpen={!!infoSystem}
        onClose={() => setInfoSystem(null)}
        title={infoSystem?.title || ''}
      >
        <div className={styles.infoContent}>
          <span className={styles.starTypeBadge}>
            {infoSystem?.starType} Star System
          </span>
          <p className={styles.fullDesc}>
            {infoSystem?.description || CONTENT.systemsHub.infoModal.noDesc}
          </p>
          <div className={styles.infoFooter}>
            <span>
              {CONTENT.systemsHub.infoModal.created}{' '}
              {infoSystem ? new Date(infoSystem.createdAt).toLocaleDateString() : ''}
            </span>
            <span>
              {CONTENT.systemsHub.infoModal.updated}{' '}
              {infoSystem ? new Date(infoSystem.updatedAt).toLocaleDateString() : ''}
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
