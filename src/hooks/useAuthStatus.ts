import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch auth status');
  }
  return res.json();
};

export function useAuthStatus() {
  const { data, error, isLoading, mutate } = useSWR<{
    isAdmin: boolean;
    unlockedUniverses: string[];
  }>('/api/auth/status', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  });

  return {
    isAdmin: data?.isAdmin ?? false,
    unlockedUniverses: data?.unlockedUniverses ?? [],
    isLoading,
    error,
    mutate,
  };
}
