import { useCallback } from "react";

interface UseTimelineClicksProps {
  timelineRef: React.RefObject<HTMLDivElement>;
  timelineMode: "free" | "centered";
  centerX: number;
  video: { currentTime: number };
  pixelsPerSecond: number;
  timelineOffset: number;
  isDragging: boolean;
  setCurrentTime: (time: number) => void;
}

export const useTimelineClicks = ({
  timelineRef,
  timelineMode,
  centerX,
  video,
  pixelsPerSecond,
  timelineOffset,
  isDragging,
  setCurrentTime,
}: UseTimelineClicksProps) => {
  // Add new subtitle on double-click — time calculation extracted for performance
  const calculateTimeFromClick = useCallback(
    (clientX: number) => {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return 0;

      const x = clientX - rect.left;

      if (timelineMode === "centered") {
        const offsetFromCenter = x - centerX;
        return Math.max(
          0,
          video.currentTime + offsetFromCenter / pixelsPerSecond
        );
      } else {
        return Math.max(0, timelineOffset + x / pixelsPerSecond);
      }
    },
    [timelineMode, centerX, video.currentTime, pixelsPerSecond, timelineOffset]
  );

  // Timeline click handler — optimized by reusing calculateTimeFromClick
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return;
      const time = calculateTimeFromClick(e.clientX);
      setCurrentTime(time);
    },
    [isDragging, calculateTimeFromClick, setCurrentTime]
  );

  return {
    handleTimelineClick,
  };
};
