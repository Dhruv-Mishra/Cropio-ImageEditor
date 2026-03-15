'use client';

import { POSE_SEQUENCE } from '@/lib/headshot/types';

/**
 * Compact HUD below the viewfinder: progress ring + step dots.
 * The instruction text is now overlaid on the viewfinder itself.
 */
export function HeadshotHUD({
  currentStep,
  holdProgress,
  isOnTarget,
  hasFace,
}: {
  currentStep: number;
  holdProgress: number;
  isOnTarget: boolean;
  hasFace: boolean;
}) {
  const totalSteps = POSE_SEQUENCE.length;
  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference * (1 - holdProgress);

  return (
    <div className="flex items-center justify-center gap-5">
      {/* Hold progress ring */}
      {currentStep < totalSteps && (
        <div className="relative flex items-center justify-center">
          <svg width={56} height={56} className="-rotate-90">
            <circle
              cx={28}
              cy={28}
              r={22}
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx={28}
              cy={28}
              r={22}
              fill="none"
              stroke={isOnTarget ? '#22c55e' : '#ef4444'}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-100"
            />
          </svg>
          <span className="absolute text-xs font-bold text-gray-700 dark:text-gray-300">
            {currentStep + 1}/{totalSteps}
          </span>
        </div>
      )}

      {/* Step dots with labels */}
      <div className="flex gap-3">
        {POSE_SEQUENCE.map((pose, i) => (
          <div key={pose.label} className="flex flex-col items-center gap-1">
            <div
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                i < currentStep
                  ? 'bg-green-500 scale-100'
                  : i === currentStep
                    ? 'bg-blue-500 scale-125 animate-pulse'
                    : 'bg-gray-300 dark:bg-gray-600 scale-100'
              }`}
            />
            <span className={`text-[9px] font-medium ${
              i < currentStep
                ? 'text-green-600 dark:text-green-400'
                : i === currentStep
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500'
            }`}>
              {pose.label}
            </span>
          </div>
        ))}
      </div>

      {/* No face warning */}
      {!hasFace && currentStep < totalSteps && (
        <span className="text-xs text-amber-600 dark:text-amber-400">
          No face detected
        </span>
      )}
    </div>
  );
}
