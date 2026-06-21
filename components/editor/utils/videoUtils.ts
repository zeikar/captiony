/**
 * Calculates playback progress as a percentage.
 */
export function calculateProgress(
  currentTime: number,
  duration: number
): number {
  if (duration <= 0) return 0;
  return Math.round((currentTime / duration) * 100);
}
