'use client';

import { useEffect, useState } from 'react';

type HealthcheckState = {
  data: string | null;
  error: string | null;
  isLoading: boolean;
};

export function useHealthcheck(): HealthcheckState {
  const [state, setState] = useState<HealthcheckState>({
    data: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    const controller = new AbortController();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

    fetch(`${apiUrl}/healthcheck`, { signal: controller.signal })
      .then(async (response) => {
        const text = await response.text();

        if (!response.ok) {
          throw new Error(text || `API returned ${response.status}`);
        }

        setState({ data: text, error: null, isLoading: false });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          data: null,
          error: error instanceof Error ? error.message : 'Unable to reach API',
          isLoading: false,
        });
      });

    return () => controller.abort();
  }, []);

  return state;
}
