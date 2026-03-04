'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Lightweight typewriter effect hook. Replaces the heavy `typewriter-effect` package.
 * Types and deletes strings in a loop with configurable speeds.
 */
export function useTypewriter(
  strings: string[],
  {
    typeSpeed = 50,
    deleteSpeed = 30,
    pauseDuration = 2000,
  }: { typeSpeed?: number; deleteSpeed?: number; pauseDuration?: number } = {},
): string {
  const [text, setText] = useState('');
  const indexRef = useRef(0);
  const deletingRef = useRef(false);
  const pausedRef = useRef(false);

  const tick = useCallback(() => {
    const current = strings[indexRef.current];
    if (!current) return;

    if (pausedRef.current) return;

    if (!deletingRef.current) {
      // Typing forward
      setText((prev) => {
        const next = current.slice(0, prev.length + 1);
        if (next.length === current.length) {
          pausedRef.current = true;
          setTimeout(() => {
            pausedRef.current = false;
            deletingRef.current = true;
          }, pauseDuration);
        }
        return next;
      });
    } else {
      // Deleting backward
      setText((prev) => {
        const next = current.slice(0, prev.length - 1);
        if (next.length === 0) {
          deletingRef.current = false;
          indexRef.current = (indexRef.current + 1) % strings.length;
        }
        return next;
      });
    }
  }, [strings, pauseDuration]);

  useEffect(() => {
    const speed = deletingRef.current ? deleteSpeed : typeSpeed;
    const timer = setInterval(tick, speed);
    return () => clearInterval(timer);
  }, [tick, typeSpeed, deleteSpeed]);

  return text;
}
