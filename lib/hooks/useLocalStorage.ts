/**
 * Hook for managing localStorage with type safety
 * Single source of truth for local persistence
 */

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    maxItems?: number;
  }
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const item = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Failed to read from localStorage[${key}]:`, error);
    }
  }, [key]);

  // Update localStorage when value changes
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        // Apply maxItems limit if storing arrays
        if (
          options?.maxItems &&
          Array.isArray(valueToStore) &&
          valueToStore.length > options.maxItems
        ) {
          const trimmed = valueToStore.slice(0, options.maxItems);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(trimmed));
          }
          return;
        }

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Failed to write to localStorage[${key}]:`, error);
      }
    },
    [key, storedValue, options]
  );

  return [storedValue, setValue];
}
