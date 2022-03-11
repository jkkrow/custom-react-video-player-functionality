import { useEffect, useRef } from 'react';

export const useOutsideClickHandler = (
  element: HTMLElement | null,
  callback: () => void
) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!element) return;

    const outsideClickHandler = (event: MouseEvent) => {
      if (!element.contains(event.target as Node)) {
        callbackRef.current();
      }
    };

    document.addEventListener('click', outsideClickHandler);

    return () => {
      document.removeEventListener('click', outsideClickHandler);
    };
  }, [element]);
};
