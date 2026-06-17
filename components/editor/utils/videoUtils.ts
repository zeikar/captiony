/**
 * Formats seconds as MM:SS.mmm (includes milliseconds).
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
}

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

/**
 * Clamps a value within the given range.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
