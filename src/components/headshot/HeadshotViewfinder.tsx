'use client';

import { useRef, useCallback, useEffect } from 'react';

/**
 * Manages the webcam <video> and overlay <canvas> elements.
 * Keeps canvas dimensions synced to the video's native resolution.
 */
export function HeadshotViewfinder({
  videoRef,
  canvasRef,
  isMirrored = true,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isMirrored?: boolean;
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
      className="relative w-full overflow-hidden rounded-2xl bg-black aspect-video"
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 h-full w-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
      />
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full object-cover pointer-events-none ${isMirrored ? 'scale-x-[-1]' : ''}`}
      />
    </div>
  );
}
