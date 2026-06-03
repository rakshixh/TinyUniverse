'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { IMemory } from '@/types/memory';
import type { IUniverse } from '@/types/universe';
import { useMemories } from '@/hooks/useMemories';
import { useSolarSystems } from '@/hooks/useSolarSystems';
import EmptyState from '@/components/EmptyState/EmptyState';
import Loader from '@/components/Loader/Loader';
import MemoryModal from '@/components/MemoryModal/MemoryModal';
import Button from '@/components/UI/Button';
import { CONTENT } from '@/lib/content';
import styles from './GuestSystemCanvas.module.scss';
import SpaceBackground from '@/components/UI/SpaceBackground';

// Lazy load heavy interactive components
const UniverseCanvas = dynamic(
  () => import('@/components/UniverseCanvas/UniverseCanvas'),
  { ssr: false }
);

const AddMemoryModal = dynamic(
  () => import('@/components/AddMemoryModal/AddMemoryModal'),
  { ssr: false }
);

interface GuestSystemCanvasProps {
  universe: IUniverse;
  systemId: string;
  isAdmin: boolean;
}

export default function GuestSystemCanvas({ universe, systemId, isAdmin }: GuestSystemCanvasProps) {
  const { systems, isLoading: isSystemsLoading } = useSolarSystems(universe._id);
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
      {/* Space background */}
      <SpaceBackground />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link
            href={`/?u=${universe.slug}`}
            className={styles.backLink}
            aria-label={CONTENT.systemCanvas.backBtn}
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
              style={{ flexShrink: 0 }}
              aria-hidden="true"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Systems
          </Link>
          <div className={styles.titleArea}>
            <h1 className={styles.systemName}>
              {solarSystem?.title || solarSystem?.name || 'Loading System...'}
            </h1>
            <p className={styles.universeName}>
              {CONTENT.systemCanvas.systemInLabel} {universe.title}
            </p>
          </div>
        </div>

        <div className={styles.headerRight}>
          {!isLoading && (
            <span className={styles.memoryCount} aria-label={CONTENT.systemCanvas.planetCount(memories.length)}>
              {CONTENT.systemCanvas.planetCount(memories.length)}
            </span>
          )}
          {/* Desktop add button */}
          {!isLoading && (
            <Button
              className={`${styles.addButton} ${styles.desktopAdd}`}
              onClick={() => setIsAddModalOpen(true)}
              id="add-memory-header-button"
              aria-label={CONTENT.systemCanvas.addMemoryBtn}
            >
              <span aria-hidden="true">+</span>
              New Memory
            </Button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className={styles.main}>
        {isLoading ? (
          <Loader message={CONTENT.systemCanvas.loader} />
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
        <Button
          className={`${styles.fab} ${styles.mobileFab}`}
          onClick={() => setIsAddModalOpen(true)}
          id="add-memory-fab"
          aria-label={CONTENT.systemCanvas.addMemoryBtn}
        >
          <span aria-hidden="true" className={styles.fabIcon}>+</span>
        </Button>
      )}

      {/* Modals */}
      <MemoryModal
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
        onUpdate={handleMemoryUpdated}
        onDelete={handleMemoryDeleted}
        universeId={universe._id}
        isAdmin={isAdmin}
      />

      <AddMemoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleMemoryCreated}
        systemId={systemId}
        universeId={universe._id}
      />
    </div>
  );
}
