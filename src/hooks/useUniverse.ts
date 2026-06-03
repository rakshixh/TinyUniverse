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

/** Hook to fetch all universes for Admin Dashboard */
export function useAdminUniverses() {
  const { data, error, isLoading, mutate } = useSWR<{ universes: IUniverse[] }>(
    '/api/admin/universes',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    universes: data?.universes ?? [],
    isLoading,
    error,
    mutate,
  };
}
