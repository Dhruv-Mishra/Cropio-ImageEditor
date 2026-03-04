'use client';

import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'error' | 'warning';

const DURATIONS: Record<string, number | number[]> = {
    light: 10,
    selection: 15,
    medium: 30,
    heavy: 60,
    success: [20, 100, 30],
    warning: [40, 50, 40],
    error: [40, 50, 40],
};

export function useAppHaptics() {
    const vibrate = useCallback((pattern: HapticPattern | number) => {
        try {
            if (typeof navigator === 'undefined' || !navigator.vibrate) return;
            const duration = typeof pattern === 'number'
                ? pattern
                : DURATIONS[pattern] ?? 50;
            navigator.vibrate(duration);
        } catch {
            // Vibration API not available — silently ignore
        }
    }, []);

    return { vibrate };
}
