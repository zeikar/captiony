/**
 * Formats seconds as mm:ss.cc (zero-padded minutes, seconds, and centiseconds).
 * Shared by the video progress bar, timeline ticks, and the subtitle list.
 */
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const centis = Math.floor((seconds % 1) * 100);
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}.${centis.toString().padStart(2, "0")}`;
};
