'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CropHistory } from '@/components/CropHistory';
import { loadHistory, clearHistoryData, deleteHistoryEntry, loadAllSessions, clearSession } from '@/lib/db';
import type { HistoryEntry, SessionData } from '@/lib/types';
import { useAppHaptics } from '@/lib/haptics';

/* ------------------------------------------------------------------ */
/*  FilterDropdown — reusable glass-morphism dropdown                  */
/* ------------------------------------------------------------------ */

interface FilterOption {
    value: string;
    label: string;
}

interface FilterDropdownProps {
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
}

function FilterDropdown({ label, options, value, onChange }: FilterDropdownProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const { vibrate } = useAppHaptics();

    const selectedLabel = options.find((o) => o.value === value)?.label ?? label;
    const selectedIndex = options.findIndex((o) => o.value === value);

    // Close on click outside
    useEffect(() => {
        if (!open) return;
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    // Close on Escape, arrow-key navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false);
                triggerRef.current?.focus();
                return;
            }
            if (!open) {
                if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setOpen(true);
                    // Focus the selected option after opening
                    requestAnimationFrame(() => {
                        const idx = Math.max(selectedIndex, 0);
                        optionRefs.current[idx]?.focus();
                    });
                }
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const focused = document.activeElement;
                const idx = optionRefs.current.findIndex((el) => el === focused);
                const next = Math.min(idx + 1, options.length - 1);
                optionRefs.current[next]?.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const focused = document.activeElement;
                const idx = optionRefs.current.findIndex((el) => el === focused);
                const prev = Math.max(idx - 1, 0);
                optionRefs.current[prev]?.focus();
            } else if (e.key === 'Home') {
                e.preventDefault();
                optionRefs.current[0]?.focus();
            } else if (e.key === 'End') {
                e.preventDefault();
                optionRefs.current[options.length - 1]?.focus();
            }
        },
        [open, options.length, selectedIndex]
    );

    const handleSelect = useCallback(
        (val: string) => {
            vibrate('light');
            onChange(val);
            setOpen(false);
            triggerRef.current?.focus();
        },
        [onChange, vibrate]
    );

    return (
        <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
            {/* Trigger button */}
            <button
                ref={triggerRef}
                type="button"
                role="combobox"
                aria-expanded={open}
                aria-controls={`${label.toLowerCase().replace(/\s+/g, '-')}-listbox`}
                aria-haspopup="listbox"
                aria-label={label}
                onClick={() => {
                    vibrate('light');
                    setOpen((prev) => !prev);
                    if (!open) {
                        requestAnimationFrame(() => {
                            const idx = Math.max(selectedIndex, 0);
                            optionRefs.current[idx]?.focus();
                        });
                    }
                }}
                className="group flex items-center gap-2 rounded-xl bg-white/60 px-4 py-2.5 text-sm font-medium
                           text-gray-700 shadow-sm backdrop-blur-md transition-all
                           border border-white/30 dark:border-white/10
                           hover:bg-white/80 hover:shadow-md
                           focus:outline-none focus:ring-2 focus:ring-blue-500/60
                           dark:bg-gray-900/60 dark:text-gray-200 dark:hover:bg-gray-800/80
                           cursor-pointer select-none"
            >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mr-0.5">
                    {label}
                </span>
                <span className="truncate max-w-[7rem]">{selectedLabel}</span>
                <motion.svg
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </motion.svg>
            </button>

            {/* Dropdown panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                        role="listbox"
                        id={`${label.toLowerCase().replace(/\s+/g, '-')}-listbox`}
                        aria-label={label}
                        className="absolute left-0 z-50 mt-2 min-w-[11rem] origin-top
                                   rounded-xl border border-white/20 bg-white/80 p-1
                                   shadow-2xl shadow-black/10 backdrop-blur-xl
                                   dark:border-white/10 dark:bg-gray-900/80 dark:shadow-black/40"
                    >
                        {options.map((opt, i) => {
                            const isSelected = opt.value === value;
                            return (
                                <button
                                    key={opt.value}
                                    ref={(el) => { optionRefs.current[i] = el; }}
                                    role="option"
                                    aria-selected={isSelected}
                                    type="button"
                                    onClick={() => handleSelect(opt.value)}
                                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm
                                               transition-colors cursor-pointer
                                               focus:outline-none focus:bg-blue-50/80 dark:focus:bg-blue-900/30
                                               ${
                                                   isSelected
                                                       ? 'bg-blue-50/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold'
                                                       : 'text-gray-700 hover:bg-gray-100/80 dark:text-gray-300 dark:hover:bg-gray-800/60'
                                               }`}
                                >
                                    {/* Checkmark */}
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                                        {isSelected && (
                                            <motion.svg
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="h-4 w-4 text-blue-600 dark:text-blue-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2.5}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </motion.svg>
                                        )}
                                    </span>
                                    <span className="truncate">{opt.label}</span>
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Filter option definitions                                          */
/* ------------------------------------------------------------------ */

const ASPECT_OPTIONS: FilterOption[] = [
    { value: 'all', label: 'All Shapes' },
    { value: 'square', label: 'Square' },
    { value: 'portrait', label: 'Portrait' },
    { value: 'landscape', label: 'Landscape' },
];

const SORT_OPTIONS: FilterOption[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'hr', label: 'Highest Resolution' },
];

const FORMAT_OPTIONS: FilterOption[] = [
    { value: 'all', label: 'All Formats' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'png', label: 'PNG' },
    { value: 'webp', label: 'WebP' },
];

const SIZE_OPTIONS: FilterOption[] = [
    { value: 'all', label: 'Any Size' },
    { value: 'small', label: '< 500 KB' },
    { value: 'medium', label: '500 KB – 2 MB' },
    { value: 'large', label: '> 2 MB' },
];

const DATE_OPTIONS: FilterOption[] = [
    { value: 'all', label: 'Any Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'older', label: 'Older' },
];

/* ------------------------------------------------------------------ */
/*  Date-range helper                                                  */
/* ------------------------------------------------------------------ */

function matchesDateFilter(timestamp: number, filter: string): boolean {
    if (filter === 'all') return true;
    const now = Date.now();
    const msInDay = 86_400_000;
    const age = now - timestamp;
    switch (filter) {
        case 'today':
            return age < msInDay;
        case 'week':
            return age < msInDay * 7;
        case 'month':
            return age < msInDay * 30;
        case 'older':
            return age >= msInDay * 30;
        default:
            return true;
    }
}

/* ------------------------------------------------------------------ */
/*  Archive page                                                       */
/* ------------------------------------------------------------------ */

export default function ArchivePage() {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [sessions, setSessions] = useState<SessionData[]>([]);

    // Filter & sort state
    const [filterAspect, setFilterAspect] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [filterFormat, setFilterFormat] = useState('all');
    const [filterSize, setFilterSize] = useState('all');
    const [filterDate, setFilterDate] = useState('all');

    const router = useRouter();
    const { vibrate } = useAppHaptics();

    useEffect(() => {
        Promise.all([loadHistory(), loadAllSessions()]).then(([histData, sessData]) => {
            if (histData) setHistory(histData);
            setSessions(sessData);
        });
    }, []);

    const handleClearHistory = useCallback(async () => {
        vibrate('heavy');
        await clearHistoryData();
        setHistory([]);
    }, [vibrate]);

    const handleSelect = useCallback(
        (entry: HistoryEntry) => {
            vibrate(50);
            router.push(`/edit?load=${entry.id}`);
        },
        [router, vibrate]
    );

    const handleDelete = useCallback(
        async (id: string, e: React.MouseEvent) => {
            e.stopPropagation();
            vibrate('light');
            await deleteHistoryEntry(id);
            setHistory((prev) => prev.filter((item) => item.id !== id));
        },
        [vibrate]
    );

    const handleContinueSession = useCallback(
        (session: SessionData) => {
            vibrate('selection');
            try {
                localStorage.setItem('cropai_active_session_id', session.id);
                window.dispatchEvent(new CustomEvent('cropai:session-changed'));
            } catch { /* ignore */ }
            // Navigate to home, then dispatch restore event so the page picks up the session
            // even if it's already mounted (client-side nav won't remount)
            router.push('/edit');
        },
        [router, vibrate],
    );

    const handleDeleteSession = useCallback(
        async (id: string) => {
            vibrate('light');
            await clearSession(id);
            setSessions((prev) => prev.filter((s) => s.id !== id));
        },
        [vibrate],
    );

    /* ---- build filtered + sorted list ---- */
    const filteredHistory = useMemo(() => {
        let result = [...history];

        // Aspect ratio
        if (filterAspect !== 'all') {
            result = result.filter((item) => {
                const ratio = item.dimensions.width / item.dimensions.height;
                if (filterAspect === 'square') return ratio > 0.9 && ratio < 1.1;
                if (filterAspect === 'portrait') return ratio <= 0.9;
                if (filterAspect === 'landscape') return ratio >= 1.1;
                return true;
            });
        }

        // Format (mime type)
        if (filterFormat !== 'all') {
            result = result.filter((item) => {
                const mime = item.blob?.type?.toLowerCase() ?? '';
                if (filterFormat === 'jpeg') return mime.includes('jpeg') || mime.includes('jpg');
                if (filterFormat === 'png') return mime.includes('png');
                if (filterFormat === 'webp') return mime.includes('webp');
                return true;
            });
        }

        // File size
        if (filterSize !== 'all') {
            result = result.filter((item) => {
                const bytes = item.blob?.size ?? 0;
                const KB = 1024;
                const MB = 1024 * KB;
                if (filterSize === 'small') return bytes < 500 * KB;
                if (filterSize === 'medium') return bytes >= 500 * KB && bytes <= 2 * MB;
                if (filterSize === 'large') return bytes > 2 * MB;
                return true;
            });
        }

        // Date range
        if (filterDate !== 'all') {
            result = result.filter((item) => matchesDateFilter(item.timestamp, filterDate));
        }

        // Sort
        if (sortBy === 'newest') result.sort((a, b) => b.timestamp - a.timestamp);
        else if (sortBy === 'oldest') result.sort((a, b) => a.timestamp - b.timestamp);
        else if (sortBy === 'hr')
            result.sort(
                (a, b) =>
                    b.dimensions.width * b.dimensions.height -
                    a.dimensions.width * a.dimensions.height
            );

        return result;
    }, [history, filterAspect, filterFormat, filterSize, filterDate, sortBy]);

    /* ---- active-filter count (for the reset button) ---- */
    const activeFilterCount = [filterAspect, filterFormat, filterSize, filterDate].filter(
        (v) => v !== 'all'
    ).length + (sortBy !== 'newest' ? 1 : 0);

    const resetFilters = useCallback(() => {
        vibrate('light');
        setFilterAspect('all');
        setSortBy('newest');
        setFilterFormat('all');
        setFilterSize('all');
        setFilterDate('all');
    }, [vibrate]);

    return (
        <div className="min-h-screen pt-28 pb-12">
            {/* Header */}
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-8 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                    Your Archive
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                    Revisit and re-edit your previous professional portrait exports.
                </p>
            </div>

            {/* Filter bar */}
            {history.length > 0 && (
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-6">
                    <div
                        className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-end"
                    >
                        <FilterDropdown
                            label="Shape"
                            options={ASPECT_OPTIONS}
                            value={filterAspect}
                            onChange={setFilterAspect}
                        />
                        <FilterDropdown
                            label="Sort"
                            options={SORT_OPTIONS}
                            value={sortBy}
                            onChange={setSortBy}
                        />
                        <FilterDropdown
                            label="Format"
                            options={FORMAT_OPTIONS}
                            value={filterFormat}
                            onChange={setFilterFormat}
                        />
                        <FilterDropdown
                            label="Size"
                            options={SIZE_OPTIONS}
                            value={filterSize}
                            onChange={setFilterSize}
                        />
                        <FilterDropdown
                            label="Date"
                            options={DATE_OPTIONS}
                            value={filterDate}
                            onChange={setFilterDate}
                        />

                        {/* Reset filters */}
                        <AnimatePresence>
                            {activeFilterCount > 0 && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.85 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.85 }}
                                    transition={{ duration: 0.15 }}
                                    type="button"
                                    onClick={resetFilters}
                                    className="flex items-center gap-1.5 rounded-xl bg-red-50/70 px-3.5 py-2.5
                                               text-xs font-semibold text-red-600 backdrop-blur-md
                                               border border-red-200/40 transition-colors
                                               hover:bg-red-100/80 focus:outline-none focus:ring-2 focus:ring-red-400/50
                                               dark:bg-red-900/20 dark:text-red-400 dark:border-red-500/20
                                               dark:hover:bg-red-900/40 cursor-pointer"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Reset{activeFilterCount > 1 ? ` (${activeFilterCount})` : ''}
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Active Sessions */}
            {sessions.length > 0 && (
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-10">
                    <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
                        Saved Sessions
                    </h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {sessions.map((session) => (
                            <motion.div
                                key={session.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group relative overflow-hidden rounded-xl border border-white/20 bg-white/60 shadow-sm backdrop-blur-md transition-shadow hover:shadow-lg dark:border-gray-700/50 dark:bg-gray-900/60"
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    {session.thumbnailDataUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={session.thumbnailDataUrl}
                                            alt="Session preview"
                                            className="h-full w-full object-cover"
                                            draggable={false}
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M6.75 3h10.5A2.25 2.25 0 0119.5 5.25v13.5A2.25 2.25 0 0117.25 21H6.75A2.25 2.25 0 014.5 18.75V5.25A2.25 2.25 0 016.75 3z" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Overlay with actions */}
                                    <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                        <button
                                            onClick={() => handleContinueSession(session)}
                                            className="rounded-full bg-blue-600 p-2.5 text-white shadow-lg transition-transform hover:scale-110"
                                            aria-label="Continue editing"
                                            title="Continue editing"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSession(session.id)}
                                            className="rounded-full bg-red-600/80 p-2.5 text-white shadow transition-transform hover:scale-110"
                                            aria-label="Delete session"
                                            title="Delete session"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-2">
                                    <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                        {session.selectedCropType} · {session.aspectRatio}
                                    </p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                        {new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Export History */}
            {filteredHistory.length > 0 ? (
                <CropHistory
                    entries={filteredHistory}
                    onSelect={handleSelect}
                    onClear={handleClearHistory}
                    onDelete={handleDelete}
                />
            ) : history.length > 0 && filteredHistory.length === 0 ? (
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center py-20">
                    <p className="text-gray-500 dark:text-gray-400">No exports match your current filters.</p>
                </div>
            ) : sessions.length === 0 ? (
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center py-20">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800/50 mb-6">
                        <svg
                            className="h-10 w-10 text-gray-400 dark:text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nothing to see here</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                        You haven&apos;t exported any portrait crops yet. Your saved sessions and exports will appear here.
                    </p>
                    <button
                        onClick={() => {
                            vibrate('light');
                            router.push('/edit');
                        }}
                        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-xl hover:from-blue-500 hover:to-indigo-500"
                    >
                        Start Creating
                    </button>
                </div>
            ) : null}
        </div>
    );
}
