import type { HeadPose } from './types';

/**
 * Draw a flat, wide chevron directional indicator on the overlay canvas.
 *
 * The chevron originates near (ox, oy) — the mirrored forehead position.
 * Direction determined by current head pose (pitch/yaw).
 * Color is green when on-target, red otherwise.
 *
 * Caller must mirror the X coordinate before passing (canvas is un-flipped,
 * video is CSS-mirrored). Yaw is negated here to map from body-space to
 * mirrored-screen-space.
 *
 * Does NOT call clearRect — caller handles that.
 */
export function drawPoseArrow(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  pose: HeadPose,
  isOnTarget: boolean,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const color = isOnTarget ? '#22c55e' : '#ef4444';
  const glowColor = isOnTarget ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.5)';
  const unit = Math.min(canvasWidth, canvasHeight);

  // Chevron sizing — wide and flat
  const chevronLen = unit * 0.055;
  const chevronSpread = unit * 0.065;
  const strokeW = Math.max(6, unit * 0.01);
  const dotR = Math.max(8, unit * 0.014);
  const offsetDist = unit * 0.04;

  // Yaw maps directly: positive yaw = user looks right = arrow points right on mirrored display
  // (X is already mirrored by caller, so no negation needed)
  const yawRad = (pose.yaw * Math.PI) / 180;
  const pitchRad = (pose.pitch * Math.PI) / 180;

  const dirX = Math.sin(yawRad);
  const dirY = Math.sin(pitchRad);
  const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);

  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 20;

  // Only draw chevron if there's meaningful direction (avoids wild spin near center)
  if (magnitude > 0.12) {
    const nx = dirX / magnitude;
    const ny = dirY / magnitude;
    const px = -ny; // perpendicular
    const py = nx;

    // Chevron center (offset from origin dot)
    const cx = ox + nx * offsetDist;
    const cy = oy + ny * offsetDist;

    // Tip (front of chevron)
    const tipX = cx + nx * chevronLen;
    const tipY = cy + ny * chevronLen;

    // Back arms (two wide ends of the V)
    const arm1X = cx - px * chevronSpread;
    const arm1Y = cy - py * chevronSpread;
    const arm2X = cx + px * chevronSpread;
    const arm2Y = cy + py * chevronSpread;

    ctx.beginPath();
    ctx.moveTo(arm1X, arm1Y);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(arm2X, arm2Y);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeW;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  // Origin dot
  ctx.beginPath();
  ctx.arc(ox, oy, dotR, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // White ring around origin
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(ox, oy, dotR + 3, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a green check flash animation frame on the canvas (capture feedback).
 */
export function drawCaptureFlash(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  alpha: number,
): void {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = `rgba(34, 197, 94, ${alpha * 0.3})`;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Checkmark icon in center
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const size = Math.min(canvasWidth, canvasHeight) * 0.1;

  ctx.beginPath();
  ctx.moveTo(cx - size * 0.5, cy);
  ctx.lineTo(cx - size * 0.1, cy + size * 0.4);
  ctx.lineTo(cx + size * 0.5, cy - size * 0.35);
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

/**
 * Draw a head-shaped oval positioning guide in the center of the canvas.
 * Turns green when face is positioned correctly, white/dim otherwise.
 * Does NOT call clearRect — caller handles that.
 */
export function drawFaceGuide(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  isPositioned: boolean,
  opacity: number,
): void {
  const guideX = canvasWidth / 2;
  const guideY = canvasHeight * 0.42;
  const guideRx = canvasWidth * 0.12;
  const guideRy = canvasHeight * 0.28;

  const color = isPositioned
    ? `rgba(34, 197, 94, ${opacity * 0.8})`
    : `rgba(255, 255, 255, ${opacity * 0.35})`;
  const glowColor = isPositioned
    ? `rgba(34, 197, 94, ${opacity * 0.3})`
    : 'transparent';

  ctx.save();

  if (isPositioned) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;
  }

  // Dashed oval
  ctx.beginPath();
  ctx.ellipse(guideX, guideY, guideRx, guideRy, 0, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = isPositioned ? 3.5 : 2.5;
  ctx.setLineDash(isPositioned ? [] : [14, 8]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Small crosshair at center when not positioned
  if (!isPositioned && opacity > 0.5) {
    const chSize = 8;
    ctx.beginPath();
    ctx.moveTo(guideX - chSize, guideY);
    ctx.lineTo(guideX + chSize, guideY);
    ctx.moveTo(guideX, guideY - chSize);
    ctx.lineTo(guideX, guideY + chSize);
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}
