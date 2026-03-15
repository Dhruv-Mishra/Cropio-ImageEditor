'use client';

import { useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Manages the webcam <video> and overlay <canvas> elements.
 * Keeps canvas dimensions synced to the video's native resolution.
 */
export function HeadshotViewfinder({
  videoRef,
  canvasRef,
  instruction,
  tip,
  showInstruction,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  instruction?: string;
  tip?: string;
  showInstruction?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const syncCanvasSize = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }, [videoRef, canvasRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleResize = () => syncCanvasSize();
    video.addEventListener('loadedmetadata', handleResize);
    video.addEventListener('resize', handleResize);

    return () => {
      video.removeEventListener('loadedmetadata', handleResize);
      video.removeEventListener('resize', handleResize);
    };
  }, [videoRef, syncCanvasSize]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10"
      style={{ aspectRatio: '16 / 9' }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
      />

      {/* Overlaid instruction bar */}
      <AnimatePresence>
        {showInstruction && instruction && (
          <motion.div
            key={instruction}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-4 pb-5 pt-12 backdrop-blur-sm"
          >
            <p className="text-center text-base font-bold tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] sm:text-lg">
              {instruction}
            </p>
            {tip && (
              <p className="mt-1.5 text-center text-xs font-medium tracking-wide text-white/70 sm:text-sm">
                {tip}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner decoration */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-white/10" />
    </div>
  );
}
