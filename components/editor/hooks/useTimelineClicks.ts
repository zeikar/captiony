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
  // 더블클릭으로 새 자막 추가 - 시간 계산 함수 분리로 성능 최적화
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

  // 타임라인 클릭 핸들러 - 공통 함수 사용으로 최적화
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
