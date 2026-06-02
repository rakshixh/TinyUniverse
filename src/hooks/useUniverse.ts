'use client';

import useSWR from 'swr';
import type { IUniverse } from '@/types/universe';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch data');
  }
  return res.json();
};

/** Hook to fetch all universes */
export function useUniverses() {
  const { data, error, isLoading, mutate } = useSWR<{ universes: IUniverse[] }>(
    '/api/universe',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  return {
    universes: data?.universes ?? [],
    isLoading,
    error,
    mutate,
  };
}

/** Hook to fetch detail of a specific universe */
export function useUniverseDetail(universeId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ universe: IUniverse }>(
    universeId ? `/api/universe/${universeId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 15000,
    }
  );

  return {
    universe: data?.universe ?? null,
    isLoading,
    error,
    mutate,
  };
}
