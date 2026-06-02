'use client';

import useSWR from 'swr';
import type { IMemory } from '@/types/memory';
import { API_PATHS } from '@/lib/constants';

interface MemoriesResponse {
  memories: IMemory[];
}

const fetcher = async (url: string): Promise<MemoriesResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch memories');
  }
  return res.json();
};

export function useMemories() {
  const { data, error, isLoading, mutate } = useSWR<MemoriesResponse>(
    API_PATHS.memories,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    memories: data?.memories ?? [],
    isLoading,
    error,
    mutate,
  };
}
