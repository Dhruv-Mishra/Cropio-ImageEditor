'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { HeadPose } from './types';
import { estimateHeadPose, getForeheadPosition } from './posemath';

export interface FaceTrackingResult {
  pose: HeadPose;
  foreheadX: number;
  foreheadY: number;
  hasFace: boolean;
}

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

/**
 * Hook that initializes MediaPipe FaceLandmarker and processes video frames.
 * Uses the modern @mediapipe/tasks-vision API.
 */
export function useMediaPipeFace(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isActive: boolean,
  onFrame: (result: FaceTrackingResult) => void,
) {
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onFrameRef = useRef(onFrame);

  // EMA smoothing state
  const smoothedPoseRef = useRef<HeadPose>({ pitch: 0, yaw: 0, roll: 0 });
  const smoothedPosRef = useRef({ x: 0, y: 0 });
  const smoothingInitRef = useRef(false);
  const POSE_ALPHA = 0.25;      // lower = smoother, higher = more responsive
  const POSITION_ALPHA = 0.3;

  // Keep callback ref fresh without re-triggering effects
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  const initFaceMesh = useCallback(async () => {
    if (landmarkerRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      landmarkerRef.current = faceLandmarker;
      setIsReady(true);
    } catch (err) {
      // Retry with CPU delegate if GPU fails
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        landmarkerRef.current = faceLandmarker;
        setIsReady(true);
      } catch (cpuErr) {
        setError(
          cpuErr instanceof Error ? cpuErr.message : 'Failed to load face tracking model',
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start/stop processing loop
  useEffect(() => {
    if (!isActive || !isReady) return;

    const video = videoRef.current;
    const fl = landmarkerRef.current;
    if (!video || !fl) return;

    let running = true;
    let lastTimestamp = -1;

    const processFrame = () => {
      if (!running || !video || video.readyState < 2) {
        if (running) animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const now = performance.now();
      // Avoid sending the same timestamp twice (detectForVideo requires increasing timestamps)
      if (now <= lastTimestamp) {
        if (running) animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }
      lastTimestamp = now;

      try {
        const results = fl.detectForVideo(video, now);

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];
          const rawPose = estimateHeadPose(landmarks);
          const rawForehead = getForeheadPosition(
            landmarks,
            video.videoWidth,
            video.videoHeight,
          );

          // Apply EMA smoothing to eliminate micro-fluctuations
          if (!smoothingInitRef.current) {
            smoothedPoseRef.current = rawPose;
            smoothedPosRef.current = rawForehead;
            smoothingInitRef.current = true;
          } else {
            const sp = smoothedPoseRef.current;
            smoothedPoseRef.current = {
              pitch: sp.pitch + POSE_ALPHA * (rawPose.pitch - sp.pitch),
              yaw: sp.yaw + POSE_ALPHA * (rawPose.yaw - sp.yaw),
              roll: sp.roll + POSE_ALPHA * (rawPose.roll - sp.roll),
            };
            const sf = smoothedPosRef.current;
            smoothedPosRef.current = {
              x: sf.x + POSITION_ALPHA * (rawForehead.x - sf.x),
              y: sf.y + POSITION_ALPHA * (rawForehead.y - sf.y),
            };
          }

          onFrameRef.current({
            pose: smoothedPoseRef.current,
            foreheadX: smoothedPosRef.current.x,
            foreheadY: smoothedPosRef.current.y,
            hasFace: true,
          });
        } else {
          smoothingInitRef.current = false;
          onFrameRef.current({
            pose: { pitch: 0, yaw: 0, roll: 0 },
            foreheadX: 0,
            foreheadY: 0,
            hasFace: false,
          });
        }
      } catch {
        // Detection can fail during teardown; ignore
      }

      if (running) {
        animFrameRef.current = requestAnimationFrame(processFrame);
      }
    };

    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, isReady, videoRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  return { initFaceMesh, isLoading, isReady, error };
}
