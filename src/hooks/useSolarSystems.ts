'use client';

import useSWR from 'swr';
import type { ISolarSystem } from '@/types/solarsystem';

interface SolarSystemsResponse {
  systems: ISolarSystem[];
}

const fetcher = async (url: string): Promise<SolarSystemsResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch solar systems');
  }
  return res.json();
};

export function useSolarSystems(universeId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<SolarSystemsResponse>(
    universeId ? `/api/universe/${universeId}/systems` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
    }
  );

  return {
    systems: data?.systems ?? [],
    isLoading,
    error,
    mutate,
  };
}
