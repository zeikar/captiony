"use client";

import React, { memo } from "react";
import { formatTime } from "../utils/timelineUtils";

// 시간 레이블 컴포넌트
const TimelineLabel = memo(({ x, label }: { x: number; label: string }) => (
  <div
    className="absolute text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap font-mono bg-white/90 dark:bg-gray-900/90 px-1.5 py-0.5 rounded shadow-sm border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
    style={{
      left: `${x}px`,
      top: "32px",
      transform: "translateX(-50%)",
      zIndex: 20,
    }}
  >
    {label}
  </div>
));

TimelineLabel.displayName = "TimelineLabel";

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
  pixelsPerSecond: number;
  timelineScale: number;
  visibleStartTime: number;
  visibleEndTime: number;
  videoDuration: number; // 동영상 전체 길이
}

export const TimelineGrid = memo<TimelineGridProps>(
  ({
    timeMarkers,
    dynamicTimelineHeight,
    subtitleContainerTransform,
    pixelsPerSecond,
    timelineScale,
    visibleStartTime,
    visibleEndTime,
    videoDuration,
  }) => {
    // 보이는 범위만 렌더링하기 위한 계산
    const visibleDuration = visibleEndTime - visibleStartTime;
    const bufferTime = Math.max(10, visibleDuration * 0.5); // 50% 오버스캔
    const startTime = Math.max(0, visibleStartTime - bufferTime);
    const endTime = Math.min(videoDuration, visibleEndTime + bufferTime);
    const renderDuration = endTime - startTime;
    const renderWidth = renderDuration * pixelsPerSecond;
    const offsetX = startTime * pixelsPerSecond;

    // 보이는 영역 기반 CSS 그리드 패턴 생성
    const generateVisibleGridPattern = () => {
      if (renderDuration <= 0) return "";

      // 줌 레벨에 따른 간격 결정
      const getIntervals = (scale: number) => {
        if (scale < 0.3) return { major: 30, minor: 10 };
        if (scale < 0.6) return { major: 10, minor: 5 };
        if (scale < 1) return { major: 5, minor: 1 };
        if (scale < 2) return { major: 1, minor: 0.5 };
        if (scale < 4) return { major: 1, minor: 0.5 };
        return { major: 0.5, minor: 0.1 };
      };

      const intervals = getIntervals(timelineScale);
      const majorSpacing = intervals.major * pixelsPerSecond;
      const minorSpacing = intervals.minor * pixelsPerSecond;

      // 시작 시간에 따른 오프셋 계산 (패턴이 올바른 위치에서 시작하도록)
      const majorOffset = (startTime % intervals.major) * pixelsPerSecond;
      const minorOffset = (startTime % intervals.minor) * pixelsPerSecond;

      const majorPattern = `repeating-linear-gradient(
        to right,
        transparent ${-majorOffset}px,
        transparent ${majorSpacing - majorOffset - 1}px,
        rgb(75 85 99 / 0.6) ${majorSpacing - majorOffset - 1}px,
        rgb(75 85 99 / 0.6) ${majorSpacing - majorOffset}px
      )`;

      if (timelineScale >= 1 && minorSpacing > 2) {
        const minorPattern = `repeating-linear-gradient(
          to right,
          transparent ${-minorOffset}px,
          transparent ${minorSpacing - minorOffset - 0.5}px,
          rgb(156 163 175 / 0.4) ${minorSpacing - minorOffset - 0.5}px,
          rgb(156 163 175 / 0.4) ${minorSpacing - minorOffset}px
        )`;
        return `${majorPattern}, ${minorPattern}`;
      }

      return majorPattern;
    };

    // 전체 높이 그리드 라인 패턴
    const generateVisibleFullHeightGridPattern = () => {
      if (renderDuration <= 0) return "";

      const getIntervals = (scale: number) => {
        if (scale < 0.3) return { major: 30 };
        if (scale < 0.6) return { major: 10 };
        if (scale < 1) return { major: 5 };
        if (scale < 2) return { major: 1 };
        if (scale < 4) return { major: 1 };
        return { major: 0.5 };
      };

      const intervals = getIntervals(timelineScale);
      const majorSpacing = intervals.major * pixelsPerSecond;
      const majorOffset = (startTime % intervals.major) * pixelsPerSecond;

      return `repeating-linear-gradient(
        to right,
        transparent ${-majorOffset}px,
        transparent ${majorSpacing - majorOffset - 0.5}px,
        rgb(209 213 219 / 0.3) ${majorSpacing - majorOffset - 0.5}px,
        rgb(209 213 219 / 0.3) ${majorSpacing - majorOffset}px
      )`;
    };

    return (
      <div className="relative">
        {/* 타임라인 헤더 배경 - 보이는 영역만 */}
        <div
          className="absolute top-0 h-8 border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
          style={{
            transform: subtitleContainerTransform,
            left: `${offsetX}px`,
            width: `${renderWidth}px`,
          }}
        >
          {/* CSS 기반 눈금 패턴 */}
          <div
            className="absolute top-0 left-0 h-8"
            style={{
              width: `${renderWidth}px`,
              background: generateVisibleGridPattern(),
            }}
          />

          {/* 시간 레이블들 */}
          {timeMarkers
            .filter(
              (marker) =>
                marker.showLabel &&
                marker.label &&
                marker.time >= startTime &&
                marker.time <= endTime
            )
            .map((marker) => (
              <TimelineLabel
                key={`label-${marker.time}`}
                x={marker.x - offsetX}
                label={marker.label}
              />
            ))}
        </div>

        {/* 전체 높이 그리드 라인 - 보이는 영역만 */}
        <div
          className="absolute top-0 pointer-events-none z-0"
          style={{
            left: `${offsetX}px`,
            width: `${renderWidth}px`,
            height: `${dynamicTimelineHeight}px`,
            transform: subtitleContainerTransform,
            background: generateVisibleFullHeightGridPattern(),
          }}
        />
      </div>
    );
  }
);

TimelineGrid.displayName = "TimelineGrid";
