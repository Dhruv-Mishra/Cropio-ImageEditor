/** Head pose angles in degrees */
export interface HeadPose {
  pitch: number; // up/down (negative = looking up)
  yaw: number;   // left/right (negative = looking left)
  roll: number;  // head tilt
}

/** A target orientation for the capture sequence */
export interface PoseTarget {
  label: string;
  instruction: string;
  tip: string;
  pitch: number;
  yaw: number;
  thresholdDeg: number;
}

/** State of the capture sequence state machine */
export type CapturePhase =
  | 'idle'
  | 'requesting-camera'
  | 'positioning'
  | 'tracking'
  | 'holding'
  | 'captured'
  | 'complete'
  | 'uploading'
  | 'done'
  | 'error';

/** A single captured headshot frame */
export interface CapturedFrame {
  dataUrl: string; // webp data URL
  poseLabel: string;
}

/** The 5-pose capture sequence */
export const POSE_SEQUENCE: PoseTarget[] = [
  {
    label: 'Straight',
    instruction: 'Look straight at the camera',
    tip: 'Smile naturally \u{1F60A}',
    pitch: 0,
    yaw: 0,
    thresholdDeg: 15,
  },
  {
    label: 'Left',
    instruction: 'Turn your head slightly Left',
    tip: 'Show your best side \u{2728}',
    pitch: 0,
    yaw: -20,
    thresholdDeg: 18,
  },
  {
    label: 'Right',
    instruction: 'Turn your head slightly Right',
    tip: 'You\u2019re doing great! \u{1F44F}',
    pitch: 0,
    yaw: 20,
    thresholdDeg: 18,
  },
  {
    label: 'Up',
    instruction: 'Tilt your head slightly Up',
    tip: 'Chin up, confidence on \u{1F4AA}',
    pitch: -15,
    yaw: 0,
    thresholdDeg: 18,
  },
  {
    label: 'Down',
    instruction: 'Tilt your head slightly Down',
    tip: 'Almost there! \u{1F3AF}',
    pitch: 15,
    yaw: 0,
    thresholdDeg: 18,
  },
];

/** Duration (ms) user must hold the target pose before capture */
export const HOLD_DURATION_MS = 1500;
