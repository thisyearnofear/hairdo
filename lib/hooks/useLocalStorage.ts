/**
 * Hook for managing localStorage with type safety
 * Single source of truth for local persistence
 */

import { useState, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    maxItems?: number;
  }
): [T, (value: T | ((val: T) => T)) => void] {
  // Lazy init from localStorage (avoids set-state-in-effect)
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Failed to read from localStorage[${key}]:`, error)
      return initialValue
    }
  });

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
