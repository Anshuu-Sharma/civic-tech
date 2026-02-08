'use client';

import { useSession } from 'next-auth/react';
import { useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export function useAdminFetch() {
  const { data: session } = useSession();

  const adminFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      if (!session?.accessToken) {
        throw new Error('Not authenticated');
      }

      const url = path.startsWith('http') ? path : `${API_URL}${path}`;
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
          ...options.headers,
        },
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || `Request failed: ${res.status}`);
      }

      return res.json();
    },
    [session?.accessToken]
  );

  return adminFetch;
}
