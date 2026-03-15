import type { HeadPose } from './types';

/**
 * Draw a production-grade directional arrow on the overlay canvas.
 *
 * Arrow originates from (ox, oy) — the forehead landmark position.
 * Direction determined by current head pose (pitch/yaw).
 * Color is green when on-target, red otherwise.
 * Includes shadow/glow for visibility against any background.
 *
 * The video is mirrored, so we negate yaw for the arrow direction.
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
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const color = isOnTarget ? '#22c55e' : '#ef4444';
  const glowColor = isOnTarget ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.4)';
  const arrowLength = Math.min(canvasWidth, canvasHeight) * 0.18;
  const headSize = arrowLength * 0.4;
  const lineWidth = 7;
  const dotRadius = 12;

  // Direction vector from pose — negate yaw because video is mirrored
  const yawRad = (-pose.yaw * Math.PI) / 180;
  const pitchRad = (pose.pitch * Math.PI) / 180;

  const dirX = Math.sin(yawRad);
  const dirY = Math.sin(pitchRad);
  const mag = Math.sqrt(dirX * dirX + dirY * dirY) || 1;

  const nx = dirX / mag;
  const ny = dirY / mag;

  const endX = ox + nx * arrowLength;
  const endY = oy + ny * arrowLength;

  // Shadow / glow for visibility
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Draw arrow shaft
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Draw arrowhead
  const angle = Math.atan2(ny, nx);
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headSize * Math.cos(angle - Math.PI / 6),
    endY - headSize * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    endX - headSize * Math.cos(angle + Math.PI / 6),
    endY - headSize * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Draw origin dot with white ring
  ctx.beginPath();
  ctx.arc(ox, oy, dotRadius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ox, oy, dotRadius + 3, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2.5;
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
