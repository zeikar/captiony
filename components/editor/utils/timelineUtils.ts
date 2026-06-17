import type { SubtitleItem } from "@/lib/stores/subtitle-store";

// Time formatting (mm:ss.ms)
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
};

// Timeline formatting (m:ss)
export const formatTimelineTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Compute time from X coordinate
export const getTimeFromX = (
  x: number,
  timelineOffset: number,
  pixelsPerSecond: number
): number => {
  return timelineOffset + x / pixelsPerSecond;
};

// Compute X coordinate from time
export const getXFromTime = (
  time: number,
  timelineOffset: number,
  pixelsPerSecond: number
): number => {
  return (time - timelineOffset) * pixelsPerSecond;
};

// Generate time markers
export const generateTimeMarkers = (
  timelineOffset: number,
  pixelsPerSecond: number,
  timelineScale: number,
  timelineWidth: number
) => {
  const startTime = timelineOffset;
  const endTime = startTime + timelineWidth / pixelsPerSecond;
  const majorMarkers = [];
  const minorMarkers = [];

  // Major ticks (1-second interval)
  for (let time = Math.floor(startTime); time <= Math.ceil(endTime); time++) {
    const x = (time - startTime) * pixelsPerSecond;
    if (x >= -50 && x <= timelineWidth + 50) {
      majorMarkers.push({ time, x });
    }
  }

  // Minor ticks (0.5-second interval, only when zoomed in)
  if (timelineScale >= 1) {
    for (
      let time = Math.floor(startTime * 2) / 2;
      time <= Math.ceil(endTime * 2) / 2;
      time += 0.5
    ) {
      if (time % 1 !== 0) {
        const x = (time - startTime) * pixelsPerSecond;
        if (x >= -50 && x <= timelineWidth + 50) {
          minorMarkers.push({ time, x });
        }
      }
    }
  }

  return { major: majorMarkers, minor: minorMarkers };
};

// Overlap detection
export const checkSubtitleOverlap = (
  subtitle1: { startTime: number; endTime: number },
  subtitle2: { startTime: number; endTime: number }
): boolean => {
  return subtitle1.startTime < subtitle2.endTime && subtitle2.startTime < subtitle1.endTime;
};

// Find all subtitles overlapping a target
export const findOverlappingSubtitles = (
  subtitles: SubtitleItem[],
  targetSubtitle: SubtitleItem
): SubtitleItem[] => {
  return subtitles.filter(
    (subtitle) =>
      subtitle.id !== targetSubtitle.id &&
      checkSubtitleOverlap(subtitle, targetSubtitle)
  );
};

// Arrange subtitles into non-overlapping layers
export const arrangeSubtitlesInLayers = (
  subtitles: SubtitleItem[]
): SubtitleItem[][] => {
  const layers: SubtitleItem[][] = [];
  const sortedSubtitles = [...subtitles].sort(
    (a, b) => a.startTime - b.startTime
  );

  sortedSubtitles.forEach((subtitle) => {
    let placed = false;

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const lastSubtitle = layer[layer.length - 1];

      if (!lastSubtitle || lastSubtitle.endTime <= subtitle.startTime) {
        layer.push(subtitle);
        placed = true;
        break;
      }
    }

    if (!placed) {
      layers.push([subtitle]);
    }
  });

  return layers;
};

// Filter to only the subtitles visible on screen (virtualization)
export const getVisibleSubtitles = (
  layers: SubtitleItem[][],
  timelineOffset: number,
  pixelsPerSecond: number,
  timelineWidth: number
) => {
  const visibleStartTime = timelineOffset - 1; // 1-second padding
  const visibleEndTime = timelineOffset + timelineWidth / pixelsPerSecond + 1; // 1-second padding

  return layers.map((layer) =>
    layer.filter(
      (subtitle) =>
        subtitle.endTime >= visibleStartTime &&
        subtitle.startTime <= visibleEndTime
    )
  );
};
