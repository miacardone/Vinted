import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async loader and tracks status. Every page uses this rather than
 * hand-rolling three useStates, so loading and error states are consistent.
 *
 * The `alive` guard stops a slow response from a previous dependency value
 * overwriting a newer one — the classic stale-response race in a filtered list.
 */
export function useAsync(loader, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(immediate ? 'loading' : 'idle');
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const run = useCallback(async (...args) => {
    const id = ++requestId.current;
    setStatus('loading');
    setError(null);
    try {
      const result = await loader(...args);
      if (id === requestId.current) {
        setData(result);
        setStatus('success');
      }
      return result;
    } catch (err) {
      if (id === requestId.current) {
        setError(err);
        setStatus('error');
      }
      throw err;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, deps);

  useEffect(() => {
    if (!immediate) return undefined;
    let alive = true;
    (async () => {
      try {
        await run();
      } catch {
        if (alive) {
          /* status already set */
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, immediate]);

  return { data, status, error, run, setData, isLoading: status === 'loading' };
}

export default useAsync;
