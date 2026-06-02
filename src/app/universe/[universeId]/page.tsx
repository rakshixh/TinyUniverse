'use client';

import { useState, FormEvent, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useUniverseDetail } from '@/hooks/useUniverse';
import { useSolarSystems } from '@/hooks/useSolarSystems';
import Loader from '@/components/Loader/Loader';
import styles from './systemsHub.module.scss';
import type { ISolarSystem } from '@/types/solarsystem';

// Available colors for the custom stars
const STAR_COLORS = [
  { name: 'Amber Sun', value: '#FBBF24' },
  { name: 'Sky Giant', value: '#38BDF8' },
  { name: 'Pink Dwarf', value: '#F472B6' },
  { name: 'Crimson Giant', value: '#F87171' },
  { name: 'Emerald Nebula', value: '#34D399' },
  { name: 'Ametrine Star', value: '#8B5CF6' },
];

const STAR_TYPES = [
  { value: 'dwarf', name: 'Yellow Dwarf (Balanced)' },
  { value: 'giant', name: 'Blue Giant (Glows brightly)' },
  { value: 'supergiant', name: 'Red Supergiant (Massive)' },
  { value: 'nebula', name: 'Nebular Core (Mystical clouds)' },
  { value: 'pulsar', name: 'Pulsar Core (Dense and active)' },
];

interface Params {
  params: Promise<{ universeId: string }>;
}

export default function SolarSystemsHubPage({ params }: Params) {
  const { universeId } = use(params);
  const router = useRouter();
  
  const { universe, isLoading: isUnivLoading } = useUniverseDetail(universeId);
  const { systems, isLoading: isSystemsLoading, mutate } = useSolarSystems(universeId);

  // Solar system ignite form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [starColor, setStarColor] = useState('#FBBF24');
  const [starType, setStarType] = useState('dwarf');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Solar System form states
  const [editSystem, setEditSystem] = useState<ISolarSystem | null>(null);
  const [editSystemName, setEditSystemName] = useState('');
  const [editSystemDesc, setEditSystemDesc] = useState('');
  const [editSystemColor, setEditSystemColor] = useState('#FBBF24');
  const [editSystemType, setEditSystemType] = useState('dwarf');
  const [isSubmittingEditSystem, setIsSubmittingEditSystem] = useState(false);

  // Delete System Modal States
  const [systemToDelete, setSystemToDelete] = useState<ISolarSystem | null>(null);

  // Solar System Info popup state
  const [infoSystem, setInfoSystem] = useState<ISolarSystem | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/universe/${universeId}/systems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          starColor,
          starType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to create solar system');
        return;
      }

      toast.success('Star ignited and system formed! 🌟');
      mutate({ systems: [...systems, data.system] }, { revalidate: false });
      setName('');
      setDescription('');
      setStarColor('#FBBF24');
      setStarType('dwarf');
      setIsModalOpen(false);
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSystemSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editSystem || !editSystemName.trim() || isSubmittingEditSystem) return;

    setIsSubmittingEditSystem(true);
    try {
      const res = await fetch(`/api/universe/${universeId}/systems?systemId=${editSystem._id}`, {
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
        toast.error(data.error || 'Failed to update star system');
        return;
      }

      toast.success('Star system details updated ✨');
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
      toast.error('Something went wrong. Try again.');
    } finally {
      setIsSubmittingEditSystem(false);
    }
  };

  const handleDeleteSystem = async (id: string, systemName: string) => {
    try {
      const res = await fetch(`/api/universe/${universeId}/systems?systemId=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete system');
        return;
      }

      toast.success('Star system dissolved into stardust 🌑');
      mutate({ systems: systems.filter((s) => s._id !== id) }, { revalidate: false });
      setSystemToDelete(null);
    } catch {
      toast.error('Something went wrong.');
    }
  };

  const handleCardClick = (id: string) => {
    router.push(`/universe/${universeId}/system/${id}`);
  };

  const isLoading = isUnivLoading || isSystemsLoading;

  return (
    <div className={styles.page}>
      <div className="star-field" aria-hidden="true" />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/universe" className={styles.backLink} aria-label="Back to Universes">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
              aria-hidden="true"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Universes
          </Link>
          <div className={styles.titleArea}>
            <h1 className={styles.universeTitle}>{universe?.title || 'Loading Universe...'}</h1>
          </div>
        </div>
        {!isLoading && (
          <button
            className={styles.igniteButton}
            onClick={() => setIsModalOpen(true)}
            aria-label="Ignite new star system"
          >
            Ignite Star System
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {isLoading ? (
          <Loader message="Traversing stellar systems..." />
        ) : systems.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">☀️</div>
            <h2>Universe is cold and silent</h2>
            <p>This universe has no star systems yet. Ignite a custom star system to start mapping your memories in orbits.</p>
            <button
              className={styles.ctaButton}
              onClick={() => setIsModalOpen(true)}
            >
              Ignite Your First Star System
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {/* Create Card */}
            <button
              className={styles.createCard}
              onClick={() => setIsModalOpen(true)}
              aria-label="Ignite new star system"
            >
              <span className={styles.plusIcon} aria-hidden="true">＋</span>
              <h3>Ignite New Star</h3>
              <p>Forge a new star system in this universe</p>
            </button>

            {/* System Cards */}
            {systems.map((system) => (
              <div
                key={system._id}
                className={styles.card}
                onClick={() => handleCardClick(system._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleCardClick(system._id);
                  }
                }}
                aria-label={`Enter system ${system.name}`}
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
                        <h3>{system.name}</h3>
                        <span className={styles.starTypeBadge}>{system.starType}</span>
                      </div>
                    </div>
                    {system.description && (
                      <button
                        type="button"
                        className={styles.infoBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoSystem(system);
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
                    {system.description || 'No description provided.'}
                  </p>

                  <div className={styles.cardFooter}>
                    <span>Click to enter system ➔</span>
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditSystem(system);
                          setEditSystemName(system.name);
                          setEditSystemDesc(system.description || '');
                          setEditSystemColor(system.starColor);
                          setEditSystemType(system.starType);
                        }}
                        title="Edit system details"
                        aria-label={`Edit ${system.name}`}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSystemToDelete(system);
                        }}
                        title="Dissolve star system"
                        aria-label={`Dissolve ${system.name}`}
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

      {/* Ignite Star System Modal */}
      {isModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Ignite new star system"
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Ignite Star System</h2>
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
                <label htmlFor="system-name">System Name *</label>
                <input
                  id="system-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Solar System, Alpha Centauri, Chronos"
                  maxLength={100}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="system-desc">Description (optional)</label>
                <textarea
                  id="system-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What memories reside in this star system?"
                  maxLength={500}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              {/* Star Type Selector */}
              <div className={styles.field}>
                <label htmlFor="system-startype">Star Type</label>
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
                <span className={styles.fieldLabel}>Star Glow Color</span>
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
                      onClick={() => setStarColor(color.value)}
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
                  <label htmlFor="custom-star-color">Or choose custom color:</label>
                  <div className={styles.pickerWrapper}>
                    <input
                      id="custom-star-color"
                      type="color"
                      value={starColor}
                      onChange={(e) => setStarColor(e.target.value)}
                      className={styles.colorPicker}
                    />
                    <span className={styles.colorHex}>{starColor}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting || !name.trim()}
              >
                {isSubmitting ? 'Igniting Star...' : 'Forge Star System'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Star System Modal */}
      {editSystem && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setEditSystem(null); }}
          role="dialog"
          aria-modal="true"
          aria-label="Edit star system details"
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Edit Star System</h2>
              <button
                className={styles.closeButton}
                onClick={() => setEditSystem(null)}
                disabled={isSubmittingEditSystem}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSystemSubmit} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="edit-system-name">System Name *</label>
                <input
                  id="edit-system-name"
                  type="text"
                  required
                  value={editSystemName}
                  onChange={(e) => setEditSystemName(e.target.value)}
                  placeholder="e.g., Solar System, Alpha Centauri, Chronos"
                  maxLength={100}
                  disabled={isSubmittingEditSystem}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="edit-system-desc">Description (optional)</label>
                <textarea
                  id="edit-system-desc"
                  value={editSystemDesc}
                  onChange={(e) => setEditSystemDesc(e.target.value)}
                  placeholder="What memories reside in this star system?"
                  maxLength={500}
                  rows={3}
                  disabled={isSubmittingEditSystem}
                />
              </div>

              {/* Star Type Selector */}
              <div className={styles.field}>
                <label htmlFor="edit-system-startype">Star Type</label>
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
                <span className={styles.fieldLabel}>Star Glow Color</span>
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
                      onClick={() => setEditSystemColor(color.value)}
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
                  <label htmlFor="edit-custom-star-color">Or choose custom color:</label>
                  <div className={styles.pickerWrapper}>
                    <input
                      id="edit-custom-star-color"
                      type="color"
                      value={editSystemColor}
                      onChange={(e) => setEditSystemColor(e.target.value)}
                      className={styles.colorPicker}
                    />
                    <span className={styles.colorHex}>{editSystemColor}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmittingEditSystem || !editSystemName.trim()}
              >
                {isSubmittingEditSystem ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {systemToDelete && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setSystemToDelete(null); }}
          role="dialog"
          aria-modal="true"
          aria-label={`Dissolve ${systemToDelete.name}`}
        >
          <div className={`${styles.modal} ${styles.deleteModal}`}>
            <div className={styles.modalHeader}>
              <h2 className={styles.deleteTitle} style={{ color: '#EF4444' }}>Dissolve Star System</h2>
              <button
                className={styles.closeButton}
                onClick={() => setSystemToDelete(null)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody} style={{ margin: '16px 0 24px 0' }}>
              <p className={styles.warningMessage} style={{ fontSize: '1rem', color: '#FFFFFF', marginBottom: '12px', lineHeight: '1.5' }}>
                Are you sure you want to dissolve the star system <strong>{systemToDelete.name}</strong>?
              </p>
              <p className={styles.warningSubtext} style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: '1.6' }}>
                All orbit rings, planets, and memories mapped within its orbits will be permanently dissolved into stardust.
              </p>
            </div>
            <div className={styles.modalActions} style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setSystemToDelete(null)}
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
                onClick={() => handleDeleteSystem(systemToDelete._id, systemToDelete.name)}
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
                Dissolve Star
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Popup Modal */}
      {infoSystem && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setInfoSystem(null); }}
          role="dialog"
          aria-modal="true"
          aria-label={`About ${infoSystem.name}`}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: infoSystem.starColor,
                    boxShadow: `0 0 10px ${infoSystem.starColor}`,
                  }}
                />
                <h2>{infoSystem.name}</h2>
              </div>
              <button
                className={styles.closeButton}
                onClick={() => setInfoSystem(null)}
              >
                ✕
              </button>
            </div>
            <div className={styles.infoContent}>
              <span className={styles.starTypeBadge} style={{ display: 'inline-block', marginBottom: '16px' }}>
                {infoSystem.starType} Star System
              </span>
              <p className={styles.fullDesc} style={{ whiteSpace: 'pre-wrap', color: '#E2E8F0', fontSize: '0.95rem', lineHeight: '1.6' }}>
                {infoSystem.description || 'No description provided.'}
              </p>
              <div className={styles.infoFooter} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginTop: '24px', borderTop: '1px solid rgba(30, 41, 59, 0.5)', paddingTop: '12px' }}>
                <span>Created: {new Date(infoSystem.createdAt).toLocaleDateString()}</span>
                <span>Last Updated: {new Date(infoSystem.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
