'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { IMemory } from '@/types/memory';
import { useMemories } from '@/hooks/useMemories';
import { useUniverse } from '@/hooks/useUniverse';
import EmptyState from '@/components/EmptyState/EmptyState';
import Loader from '@/components/Loader/Loader';
import MemoryModal from '@/components/MemoryModal/MemoryModal';
import styles from './universe.module.scss';

// Lazy load heavy components
const UniverseCanvas = dynamic(
  () => import('@/components/UniverseCanvas/UniverseCanvas'),
  { ssr: false }
);

const AddMemoryModal = dynamic(
  () => import('@/components/AddMemoryModal/AddMemoryModal'),
  { ssr: false }
);

export default function UniversePage() {
  const { memories, isLoading, mutate } = useMemories();
  const { universe } = useUniverse();

  const [selectedMemory, setSelectedMemory] = useState<IMemory | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
          data ? { memories: [memory, ...data.memories] } : { memories: [memory] },
        { revalidate: false }
      );
    },
    [mutate]
  );

  return (
    <div className={styles.page}>
      {/* Star background */}
      <div className="star-field" aria-hidden="true" />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logoEmoji} aria-hidden="true">🌌</span>
          <div>
            <h1 className={styles.universeName}>
              {universe?.title ?? 'Tiny Universe'}
            </h1>
            {universe?.description && (
              <p className={styles.universeDesc}>{universe.description}</p>
            )}
          </div>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.memoryCount} aria-label={`${memories.length} memories`}>
            {memories.length} {memories.length === 1 ? 'planet' : 'planets'}
          </span>
          {/* Desktop add button */}
          <button
            className={`${styles.addButton} ${styles.desktopAdd}`}
            onClick={() => setIsAddModalOpen(true)}
            id="add-memory-header-button"
            aria-label="Add new memory"
          >
            <span aria-hidden="true">+</span>
            New Memory
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className={styles.main}>
        {isLoading ? (
          <Loader message="Loading your universe..." />
        ) : memories.length === 0 ? (
          <EmptyState onAddMemory={() => setIsAddModalOpen(true)} />
        ) : (
          <UniverseCanvas
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
      />

      <AddMemoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleMemoryCreated}
      />
    </div>
  );
}
