'use client';

import { useState, useCallback, use } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { IMemory } from '@/types/memory';
import { useMemories } from '@/hooks/useMemories';
import { useSolarSystems } from '@/hooks/useSolarSystems';
import { useUniverseDetail } from '@/hooks/useUniverse';
import EmptyState from '@/components/EmptyState/EmptyState';
import Loader from '@/components/Loader/Loader';
import MemoryModal from '@/components/MemoryModal/MemoryModal';
import styles from './canvasPage.module.scss';

// Lazy load heavy components
const UniverseCanvas = dynamic(
  () => import('@/components/UniverseCanvas/UniverseCanvas'),
  { ssr: false }
);

const AddMemoryModal = dynamic(
  () => import('@/components/AddMemoryModal/AddMemoryModal'),
  { ssr: false }
);

interface Params {
  params: Promise<{ universeId: string; systemId: string }>;
}

export default function SolarSystemCanvasPage({ params }: Params) {
  const { universeId, systemId } = use(params);

  const { universe } = useUniverseDetail(universeId);
  const { systems, isLoading: isSystemsLoading } = useSolarSystems(universeId);
  const { memories, isLoading: isMemoriesLoading, mutate } = useMemories(systemId);

  const [selectedMemory, setSelectedMemory] = useState<IMemory | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const solarSystem = systems.find((s) => s._id === systemId);

  const handlePlanetClick = useCallback((memory: IMemory) => {
    setSelectedMemory(memory);
  }, []);

  const handleMemoryUpdated = useCallback(
    (updated: IMemory) => {
      mutate(
        (data) =>
          data
            ? {
                memories: data.memories.map((m) =>
                  m._id === updated._id ? updated : m
                ),
              }
            : data,
        { revalidate: false }
      );
      setSelectedMemory(updated);
    },
    [mutate]
  );

  const handleMemoryDeleted = useCallback(
    (id: string) => {
      mutate(
        (data) =>
          data
            ? { memories: data.memories.filter((m) => m._id !== id) }
            : data,
        { revalidate: false }
      );
      setSelectedMemory(null);
    },
    [mutate]
  );

  const handleMemoryCreated = useCallback(
    (memory: IMemory) => {
      mutate(
        (data) =>
          data ? { memories: [...data.memories, memory] } : { memories: [memory] },
        { revalidate: false }
      );
    },
    [mutate]
  );

  const isLoading = isSystemsLoading || isMemoriesLoading || !solarSystem;

  return (
    <div className={styles.page}>
      {/* Star background */}
      <div className="star-field" aria-hidden="true" />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link
            href={`/universe/${universeId}`}
            className={styles.backLink}
            aria-label={`Back to ${universe?.title || 'Universe'}`}
          >
            ← {universe?.title || 'Back to Universe'}
          </Link>
          <div className={styles.titleArea}>
            <h1 className={styles.systemName}>
              {solarSystem?.name || 'Loading System...'}
            </h1>
            <p className={styles.universeName}>
              System in {universe?.title || 'Universe'}
            </p>
          </div>
        </div>

        <div className={styles.headerRight}>
          {!isLoading && (
            <span className={styles.memoryCount} aria-label={`${memories.length} memories`}>
              {memories.length} {memories.length === 1 ? 'planet' : 'planets'}
            </span>
          )}
          {/* Desktop add button */}
          {!isLoading && (
            <button
              className={`${styles.addButton} ${styles.desktopAdd}`}
              onClick={() => setIsAddModalOpen(true)}
              id="add-memory-header-button"
              aria-label="Add new memory"
            >
              <span aria-hidden="true">+</span>
              New Memory
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className={styles.main}>
        {isLoading ? (
          <Loader message="Forming orbit projections..." />
        ) : memories.length === 0 ? (
          <EmptyState onAddMemory={() => setIsAddModalOpen(true)} />
        ) : (
          <UniverseCanvas
            solarSystem={solarSystem}
            memories={memories}
            onPlanetClick={handlePlanetClick}
          />
        )}
      </main>

      {/* Mobile FAB */}
      {!isLoading && memories.length > 0 && (
        <button
          className={`${styles.fab} ${styles.mobileFab}`}
          onClick={() => setIsAddModalOpen(true)}
          id="add-memory-fab"
          aria-label="Add new memory"
        >
          <span aria-hidden="true" className={styles.fabIcon}>+</span>
        </button>
      )}

      {/* Modals */}
      <MemoryModal
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
        onUpdate={handleMemoryUpdated}
        onDelete={handleMemoryDeleted}
        universeId={universeId}
      />

      <AddMemoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleMemoryCreated}
        systemId={systemId}
        universeId={universeId}
      />
    </div>
  );
}
