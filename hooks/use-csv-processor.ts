import { useState, useCallback } from 'react';

interface ProcessingResult {
  success: boolean;
  data: Record<string, any>[];
  skipped: Record<string, any>[];
  errors: Record<string, any>[];
  stats: {
    total: number;
    success: number;
    failed: number;
    skipped: number;
  };
}

export function useCSVProcessor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processRows = useCallback(
    async (rows: Record<string, any>[]): Promise<ProcessingResult | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('http://localhost:3001/api/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rows }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Processing failed');
        }

        const result = await response.json();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { processRows, loading, error };
}
