import { useMemo } from "react";
import { getXFromTime } from "../utils/timelineUtils";

interface UsePlayheadStyleProps {
  timelineMode: "free" | "centered";
  centerX: number;
  video: { currentTime: number };
  effectiveTimelineOffset: number;
  pixelsPerSecond: number;
  timelineWidth: number;
}

export const usePlayheadStyle = ({
  timelineMode,
  centerX,
  video,
  effectiveTimelineOffset,
  pixelsPerSecond,
  timelineWidth,
}: UsePlayheadStyleProps) => {
  return useMemo(() => {
    if (timelineMode === "centered") {
      // In centered mode the playhead is fixed at the center
      return {
        transform: `translate3d(${centerX}px, 0, 0)`,
        visibility: "visible" as "visible" | "hidden",
      };
    } else {
      // In free mode use the standard position calculation
      const x = getXFromTime(
        video.currentTime,
        effectiveTimelineOffset,
        pixelsPerSecond
      );
      return {
        transform: `translate3d(${x}px, 0, 0)`,
        visibility: (x >= -2 && x <= timelineWidth + 2
          ? "visible"
          : "hidden") as "visible" | "hidden",
      };
    }
  }, [
    timelineMode,
    centerX,
    video.currentTime,
    effectiveTimelineOffset,
    pixelsPerSecond,
    timelineWidth,
  ]);
};
