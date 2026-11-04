import { useCallback, useEffect, useRef, useState } from 'react';
import { friendlyApiError } from '../api/client';

const INITIAL_STATE = { data: null, error: null, loading: true };

export function useAsyncData(load, dependencies = [], enabled = true) {
  const [state, setState] = useState(INITIAL_STATE);
  const requestIdRef = useRef(0);
  const controllerRef = useRef(null);

  const reload = useCallback(async () => {
    controllerRef.current?.abort();
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const data = await load(controller.signal);
      if (requestId === requestIdRef.current) {
        setState({ data, error: null, loading: false });
      }
    } catch (error) {
      const message = friendlyApiError(error);
      if (message && requestId === requestIdRef.current) {
        setState((current) => ({ ...current, error: message, loading: false }));
      }
    }

  }, [load]);

  useEffect(() => {
    if (!enabled) return undefined;
    reload();
    return () => {
      requestIdRef.current += 1;
      controllerRef.current?.abort();
    };
  // Callers supply primitive/memoized dependencies so unrelated renders do not refetch.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, enabled, ...dependencies]);

  return { ...state, reload };
}
