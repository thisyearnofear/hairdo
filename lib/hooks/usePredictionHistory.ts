/**
 * Hook for managing prediction history
 * Consolidates history persistence logic
 */

import { useLocalStorage } from './useLocalStorage';

export interface StoredPrediction {
  id: string;
  status: string;
  output?: string;
  sourceImage?: string;
  hairstyle: string;
  shade: string;
  color: string;
  timestamp: number; // milliseconds for sorting
}

const HISTORY_KEY = 'hairdo_prediction_history';
const MAX_HISTORY_ITEMS = 10;

export function usePredictionHistory() {
  const [history, setHistory] = useLocalStorage<StoredPrediction[]>(HISTORY_KEY, [], {
    maxItems: MAX_HISTORY_ITEMS
  });

  const addPrediction = (prediction: StoredPrediction) => {
    setHistory((prev) => [prediction, ...prev].slice(0, MAX_HISTORY_ITEMS));
  };

  const updatePrediction = (id: string, updates: Partial<StoredPrediction>) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removePrediction = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const getSuccessfulPredictions = () => {
    return history.filter((item) => item.status === 'succeeded');
  };

  return {
    history,
    addPrediction,
    updatePrediction,
    removePrediction,
    clearHistory,
    getSuccessfulPredictions
  };
}
