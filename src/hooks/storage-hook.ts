import { useCallback, useState } from 'react';

export const useLocalStorage = <T = any>(
  key: string,
  initialValue?: T
): [T, (value: any) => void] => {
  const [storedItem, setStoredItem] = useState<T>(() => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue || null;
  });

  const setLocalStorage = useCallback(
    (value: any) => {
      const newItem = value instanceof Function ? value(storedItem) : value;

      setStoredItem(newItem);
      localStorage.setItem(key, JSON.stringify(newItem));
    },
    [key, storedItem]
  );

  return [storedItem, setLocalStorage];
};
