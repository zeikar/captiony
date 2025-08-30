"use client";

import React, { memo } from "react";
import { formatTime } from "../utils/timelineUtils";

// TimelineMarker 컴포넌트 메모이제이션 - 불필요한 재렌더링 방지
const TimelineMarker = memo(
  ({
    marker,
    dynamicTimelineHeight,
  }: {
    marker: {
      time: number;
      x: number;
      label: string;
      isSecond: boolean;
      isMajor: boolean;
      showLabel: boolean;
    };
    dynamicTimelineHeight: number;
  }) => (
    <div
      key={`${marker.time}-${marker.x}`}
      className="absolute top-0"
      style={{ left: `${marker.x}px` }}
    >
      {/* 주요 눈금에는 전체 높이 그리드 라인 */}
      {marker.isMajor && (
        <div
          className="absolute top-0 w-px bg-gray-300 dark:bg-gray-600 opacity-40"
          style={{ height: `${dynamicTimelineHeight}px` }}
        />
      )}

      {/* 눈금 표시 */}
      <div
        className={`w-px relative z-10 ${
          marker.isMajor
            ? "bg-gray-600 dark:bg-gray-400 h-8"
            : "bg-gray-400 dark:bg-gray-500 h-4"
        }`}
      />

      {/* 시간 레이블 - 겹침 방지를 위해 조건부 표시 */}
      {marker.showLabel && marker.label && (
        <div
          className="absolute left-1 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap font-mono bg-white/90 dark:bg-gray-900/90 px-1.5 py-0.5 rounded shadow-sm border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
          style={{
            top: marker.isMajor ? "32px" : "28px",
            transform: "translateX(-50%)",
            left: "0px",
          }}
        >
          {marker.label}
        </div>
      )}
    </div>
  )
);

TimelineMarker.displayName = "TimelineMarker";

interface TimelineGridProps {
  timeMarkers: Array<{
    time: number;
    x: number;
    label: string;
    isSecond: boolean;
    isMajor: boolean;
    showLabel: boolean;
  }>;
  dynamicTimelineHeight: number;
  subtitleContainerTransform: string;
}

export const TimelineGrid = memo<TimelineGridProps>(
  ({ timeMarkers, dynamicTimelineHeight, subtitleContainerTransform }) => {
    return (
      <div
        className="absolute top-0 left-0 w-full h-8 border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
        style={{ transform: subtitleContainerTransform }}
      >
        {timeMarkers.map((marker) => (
          <TimelineMarker
            key={`${marker.time}-${marker.x}`}
            marker={marker}
            dynamicTimelineHeight={dynamicTimelineHeight}
          />
        ))}
      </div>
    );
  }
);

TimelineGrid.displayName = "TimelineGrid";
