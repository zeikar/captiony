import { useMemo } from "react";
import { formatTime } from "../utils/timelineUtils";

interface TimeMarker {
  time: number;
  x: number;
  label: string;
  isSecond: boolean;
  isMajor: boolean;
  showLabel: boolean;
}

interface UseTimelineMarkersProps {
  timelineWidth: number;
  timelineMode: "free" | "centered";
  video: { currentTime: number };
  timelineOffset: number;
  pixelsPerSecond: number;
  timelineScale: number;
}

interface UseTimelineMarkersResult {
  timeMarkers: TimeMarker[];
  visibleStartTime: number;
  visibleEndTime: number;
}

export const useTimelineMarkers = ({
  timelineWidth,
  timelineMode,
  video,
  timelineOffset,
  pixelsPerSecond,
  timelineScale,
}: UseTimelineMarkersProps): UseTimelineMarkersResult => {
  return useMemo(() => {
    // Return empty if timelineWidth is 0
    if (timelineWidth === 0)
      return { timeMarkers: [], visibleStartTime: 0, visibleEndTime: 0 };

    // Compute the currently visible time range
    let visibleStartTime: number;
    let visibleEndTime: number;

    if (timelineMode === "centered") {
      // In centered mode, compute the visible range around the current time
      const halfVisible = timelineWidth / (2 * pixelsPerSecond);
      visibleStartTime = Math.max(0, video.currentTime - halfVisible);
      visibleEndTime = video.currentTime + halfVisible;
    } else {
      // In free mode, compute from timelineOffset
      visibleStartTime = Math.max(0, timelineOffset);
      visibleEndTime = timelineOffset + timelineWidth / pixelsPerSecond;
    }

    // Determine label spacing based on zoom level
    const getIntervals = (scale: number) => {
      if (scale < 0.3) return { label: 30 };
      if (scale < 0.6) return { label: 10 };
      if (scale < 1) return { label: 5 };
      if (scale < 2) return { label: 2 };
      if (scale < 4) return { label: 1 };
      return { label: 1 };
    };

    const intervals = getIntervals(timelineScale);
    const markers: TimeMarker[] = [];

    // Generate only the major time points that need labels
    const startLabel = Math.max(
      0,
      Math.floor(visibleStartTime / intervals.label) * intervals.label
    );
    const endLabel =
      Math.ceil(visibleEndTime / intervals.label) * intervals.label;

    for (let time = startLabel; time <= endLabel; time += intervals.label) {
      if (time < 0) continue;

      const x = time * pixelsPerSecond;
      markers.push({
        time,
        x,
        label: formatTime(time),
        isSecond: true,
        isMajor: true,
        showLabel: true,
      });
    }

    return {
      timeMarkers: markers.sort((a, b) => a.time - b.time),
      visibleStartTime,
      visibleEndTime,
    };
  }, [
    timelineMode,
    video.currentTime,
    timelineOffset,
    pixelsPerSecond,
    timelineScale,
    timelineWidth,
  ]);
};
