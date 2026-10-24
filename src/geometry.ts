/**
 * Squared distance from point (px, py) to the finite segment (x1, y1)–(x2, y2).
 * Same algorithm as `distance-to-line-segment` 0.2.0 `.squared`.
 * Wire selection treats a squared distance under 10 as a hit, as the original did.
 */
export const WIRE_HIT_DISTANCE_SQUARED = 10;

export function squaredDistanceToSegment(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  px: number,
  py: number,
): number {
  const ldx = x2 - x1;
  const ldy = y2 - y1;
  const lineLengthSquared = ldx * ldx + ldy * ldy;
  let t: number;
  if (!lineLengthSquared) {
    t = 0;
  } else {
    t = ((px - x1) * ldx + (py - y1) * ldy) / lineLengthSquared;
    if (t < 0) {
      t = 0;
    } else if (t > 1) {
      t = 1;
    }
  }
  const lx = x1 + t * ldx;
  const ly = y1 + t * ldy;
  const dx = px - lx;
  const dy = py - ly;
  return dx * dx + dy * dy;
}

export function isInsideRectangle(
  x: number,
  y: number,
  squareX: number,
  squareY: number,
  width: number,
  height: number,
): boolean {
  return x >= squareX && x <= squareX + width && y >= squareY && y <= squareY + height;
}

/** Strictly inside the circle, matching `Math.sqrt(...) < r` in the original. */
export function isInsideCircle(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  r: number,
): boolean {
  return Math.sqrt(Math.pow(Math.abs(x - centerX), 2) + Math.pow(Math.abs(y - centerY), 2)) < r;
}
