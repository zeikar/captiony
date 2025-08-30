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
    // timelineWidth가 0이면 빈 배열 반환
    if (timelineWidth === 0)
      return { timeMarkers: [], visibleStartTime: 0, visibleEndTime: 0 };

    // 현재 표시되는 시간 범위 계산
    let visibleStartTime: number;
    let visibleEndTime: number;

    if (timelineMode === "centered") {
      // Centered 모드에서는 현재 시간 기준으로 좌우 표시 범위 계산
      const halfVisible = timelineWidth / (2 * pixelsPerSecond);
      visibleStartTime = Math.max(0, video.currentTime - halfVisible);
      visibleEndTime = video.currentTime + halfVisible;
    } else {
      // Free 모드에서는 timelineOffset 기준
      visibleStartTime = Math.max(0, timelineOffset);
      visibleEndTime = timelineOffset + timelineWidth / pixelsPerSecond;
    }

    // 줌 레벨에 따른 레이블 표시 간격 결정
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

    // 레이블이 필요한 주요 시간점만 생성
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
