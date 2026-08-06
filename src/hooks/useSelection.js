import { useCallback, useMemo, useState } from 'react';

/**
 * Multi-select for tables. Kept as a Set of ids rather than a flag on each row
 * so selection survives pagination and re-sorting.
 */
export function useSelection() {
  const [selected, setSelected] = useState(() => new Set());

  const toggle = useCallback((id) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleMany = useCallback((ids, checked) => {
    setSelected((current) => {
      const next = new Set(current);
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback((id) => selected.has(id), [selected]);

  return useMemo(
    () => ({
      selected,
      ids: [...selected],
      count: selected.size,
      toggle,
      toggleMany,
      clear,
      isSelected,
    }),
    [selected, toggle, toggleMany, clear, isSelected],
  );
}

export default useSelection;
