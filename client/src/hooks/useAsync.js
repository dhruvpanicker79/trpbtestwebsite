import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Run an async loader whenever `deps` change. Ignores stale responses so fast
 * navigation never shows data from the previous page.
 */
export function useAsync(loader, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: undefined, meta: undefined, error: null, loading: enabled });
  const callId = useRef(0);

  const run = useCallback(async () => {
    const id = ++callId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await loader();
      if (id === callId.current) setState({ data: res?.data, meta: res?.meta, error: null, loading: false });
      return res;
    } catch (error) {
      if (id === callId.current && error.name !== 'AbortError') {
        setState((s) => ({ ...s, error, loading: false }));
      }
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (enabled) run();
    else setState((s) => ({ ...s, loading: false }));
  }, [run, enabled]);

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload: run, setData };
}

/**
 * Paginated list with "load more". `fetchPage(page)` must resolve to { data, meta }.
 */
export function usePaged(fetchPage, deps = []) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const callId = useRef(0);

  const load = useCallback(
    async (page) => {
      const id = ++callId.current;
      page === 1 ? setLoading(true) : setLoadingMore(true);
      setError(null);
      try {
        const res = await fetchPage(page);
        if (id !== callId.current) return;
        setItems((prev) => (page === 1 ? res.data : [...prev, ...res.data]));
        setMeta(res.meta);
      } catch (err) {
        if (id === callId.current) setError(err);
      } finally {
        if (id === callId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  useEffect(() => {
    load(1);
  }, [load]);

  return {
    items,
    setItems,
    meta,
    loading,
    loadingMore,
    error,
    hasMore: Boolean(meta?.hasMore),
    loadMore: () => meta && load(meta.page + 1),
    reload: () => load(1),
  };
}
