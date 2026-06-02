'use client';

import useSWR from 'swr';
import type { IUniverse } from '@/types/universe';
import { API_PATHS } from '@/lib/constants';

interface UniverseResponse {
  universe: IUniverse | null;
}

const fetcher = async (url: string): Promise<UniverseResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch universe');
  }
  return res.json();
};

export function useUniverse() {
  const { data, error, isLoading, mutate } = useSWR<UniverseResponse>(
    API_PATHS.universe,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    universe: data?.universe ?? null,
    isLoading,
    error,
    mutate,
  };
}
