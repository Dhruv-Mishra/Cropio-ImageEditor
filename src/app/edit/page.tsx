'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UploadZone } from '@/components/UploadZone';
import { CropHistory } from '@/components/CropHistory';
import { loadHistory, deleteHistoryEntry, clearHistoryData, loadAllSessions } from '@/lib/db';
import { setPendingUpload } from '@/lib/pendingUpload';
import type { HistoryEntry } from '@/lib/types';
import { useAppHaptics } from '@/lib/haptics';

const ACTIVE_SESSION_KEY = 'cropai_active_session_id';

export default function EditPage() {
  const router = useRouter();
  const { vibrate } = useAppHaptics();
  const [checking, setChecking] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Check for active session on mount — first localStorage, then IndexedDB
  useEffect(() => {
    const restore = async () => {
      // 1. Check localStorage for an active session ID
      try {
        const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
        if (activeId) {
          router.replace('/');
          requestAnimationFrame(() => {
            window.dispatchEvent(
              new CustomEvent('cropai:restore-session', { detail: activeId }),
            );
          });
          return;
        }
      } catch { /* localStorage unavailable */ }

      // 2. No localStorage key — check IndexedDB for the most recent saved session
      try {
        const sessions = await loadAllSessions();
        if (sessions.length > 0) {
          const mostRecent = sessions[0]; // sorted by createdAt desc
          localStorage.setItem(ACTIVE_SESSION_KEY, mostRecent.id);
          try {
            window.dispatchEvent(new CustomEvent('cropai:session-changed'));
          } catch { /* SSR guard */ }
          router.replace('/');
          requestAnimationFrame(() => {
            window.dispatchEvent(
              new CustomEvent('cropai:restore-session', { detail: mostRecent.id }),
            );
          });
          return;
        }
      } catch { /* IndexedDB unavailable */ }

      // 3. No sessions at all — show upload UI + previous exports
      const data = await loadHistory();
      setHistory(data);
      setChecking(false);
    };
    restore();
  }, [router]);

  const handleImageSelected = useCallback(
    (file: File) => {
      vibrate('selection');
      // Store the file in the module-level singleton so page.tsx can pick it up
      setPendingUpload(file);
      router.push('/');
    },
    [router, vibrate],
  );

  const handleLoadFromHistory = useCallback(
    (entry: HistoryEntry) => {
      vibrate('selection');
      router.push(`/?load=${entry.id}`);
    },
    [router, vibrate],
  );

  const handleDeleteEntry = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteHistoryEntry(id);
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const handleClearHistory = useCallback(async () => {
    await clearHistoryData();
    setHistory([]);
  }, []);

  // While checking / redirecting, render nothing to avoid jitter
  if (checking) {
    return null;
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center"
      >
        {/* Heading */}
        <div className="mb-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20"
          >
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
              />
            </svg>
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Start a New Project
          </h1>
          <p className="mx-auto mt-3 max-w-md text-gray-600 dark:text-gray-400">
            Upload a portrait photo to get started, or continue from a previous
            export.
          </p>
        </div>

        {/* Upload Zone */}
        <UploadZone onImageSelected={handleImageSelected} />

        {/* Recent History */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="mt-12 w-full"
          >
            <CropHistory
              entries={history}
              onSelect={handleLoadFromHistory}
              onClear={handleClearHistory}
              onDelete={handleDeleteEntry}
            />
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
