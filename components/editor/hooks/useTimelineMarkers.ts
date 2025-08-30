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

export const useTimelineMarkers = ({
  timelineWidth,
  timelineMode,
  video,
  timelineOffset,
  pixelsPerSecond,
  timelineScale,
}: UseTimelineMarkersProps): TimeMarker[] => {
  return useMemo(() => {
    // timelineWidth가 0이면 빈 배열 반환
    if (timelineWidth === 0) return [];

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

    // 줌 레벨에 따른 간격과 레이블 표시 간격 결정 - 미리 계산해서 반복 사용
    const getIntervals = (scale: number) => {
      if (scale < 0.3) return { major: 30, minor: 10, label: 30 };
      if (scale < 0.6) return { major: 10, minor: 5, label: 10 };
      if (scale < 1) return { major: 5, minor: 1, label: 5 };
      if (scale < 2) return { major: 1, minor: 0.5, label: 2 };
      if (scale < 4) return { major: 1, minor: 0.5, label: 1 };
      return { major: 0.5, minor: 0.1, label: 1 };
    };

    const intervals = getIntervals(timelineScale);
    const markers: TimeMarker[] = [];

    // 주요 눈금 생성 - 더 효율적인 루프
    const startMajor = Math.max(
      0,
      Math.floor(visibleStartTime / intervals.major) * intervals.major
    );
    const endMajor =
      Math.ceil(visibleEndTime / intervals.major) * intervals.major;

    for (let time = startMajor; time <= endMajor; time += intervals.major) {
      if (time < 0) continue;

      const x = time * pixelsPerSecond;
      const shouldShowLabel = time % intervals.label === 0;
      markers.push({
        time,
        x,
        label: shouldShowLabel ? formatTime(time) : "",
        isSecond: true,
        isMajor: true,
        showLabel: shouldShowLabel,
      });
    }

    // 보조 눈금 생성 - 조건부 처리로 성능 최적화
    if (timelineScale >= 1) {
      const startMinor = Math.max(
        0,
        Math.floor(visibleStartTime / intervals.minor) * intervals.minor
      );
      const endMinor =
        Math.ceil(visibleEndTime / intervals.minor) * intervals.minor;

      for (let time = startMinor; time <= endMinor; time += intervals.minor) {
        if (time < 0 || time % intervals.major === 0) continue;

        const x = time * pixelsPerSecond;
        markers.push({
          time,
          x,
          label: "",
          isSecond: false,
          isMajor: false,
          showLabel: false,
        });
      }
    }

    return markers.sort((a, b) => a.time - b.time);
  }, [
    timelineMode,
    video.currentTime,
    timelineOffset,
    pixelsPerSecond,
    timelineScale,
    timelineWidth,
  ]);
};
