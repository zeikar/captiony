/**
 * 초를 MM:SS 형식으로 포맷팅
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * 진행률 계산 (백분율)
 */
export function calculateProgress(
  currentTime: number,
  duration: number
): number {
  if (duration <= 0) return 0;
  return Math.round((currentTime / duration) * 100);
}

/**
 * 범위 내로 값 제한
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
