'use client';

import { motion } from 'framer-motion';
import { POSE_SEQUENCE } from '@/lib/headshot/types';

/**
 * Displays the current instruction, step progress dots,
 * and a hold-progress ring during the capture sequence.
 */
export function HeadshotHUD({
  instruction,
  currentStep,
  holdProgress,
  isOnTarget,
  hasFace,
}: {
  instruction: string;
  currentStep: number;
  holdProgress: number;
  isOnTarget: boolean;
  hasFace: boolean;
}) {
  const totalSteps = POSE_SEQUENCE.length;
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference * (1 - holdProgress);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Instruction text */}
      <motion.div
        key={instruction}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
          {instruction}
        </p>
        {!hasFace && currentStep < totalSteps && (
          <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
            No face detected — please look at the camera
          </p>
        )}
      </motion.div>

      {/* Hold progress ring */}
      {currentStep < totalSteps && (
        <div className="relative flex items-center justify-center">
          <svg width={72} height={72} className="-rotate-90">
            {/* Background ring */}
            <circle
              cx={36}
              cy={36}
              r={28}
              fill="none"
              stroke="currentColor"
              strokeWidth={4}
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress ring */}
            <circle
              cx={36}
              cy={36}
              r={28}
              fill="none"
              stroke={isOnTarget ? '#22c55e' : '#ef4444'}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-100"
            />
          </svg>
          <span className="absolute text-sm font-bold text-gray-700 dark:text-gray-300">
            {currentStep + 1}/{totalSteps}
          </span>
        </div>
      )}

      {/* Step dots */}
      <div className="flex gap-2">
        {POSE_SEQUENCE.map((pose, i) => (
          <div
            key={pose.label}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              i < currentStep
                ? 'bg-green-500'
                : i === currentStep
                  ? 'bg-blue-500 animate-pulse'
                  : 'bg-gray-300 dark:bg-gray-600'
            }`}
            title={pose.label}
          />
        ))}
      </div>
    </div>
  );
}
