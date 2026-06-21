"use client";

import React, { memo } from "react";
import { formatTime } from "../utils/timeUtils";

// Time label component
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
  videoDuration: number; // total video duration
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
    // Calculate range to render only the visible portion
    const visibleDuration = visibleEndTime - visibleStartTime;
    const bufferTime = Math.max(10, visibleDuration * 0.5); // 50% overscan
    const startTime = Math.max(0, visibleStartTime - bufferTime);
    const endTime = Math.min(videoDuration, visibleEndTime + bufferTime);
    const renderDuration = endTime - startTime;
    const renderWidth = renderDuration * pixelsPerSecond;
    const offsetX = startTime * pixelsPerSecond;

    // Generate CSS grid pattern for the visible area
    const generateVisibleGridPattern = () => {
      if (renderDuration <= 0) return "";

      // Choose interval based on zoom level
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

      // Compute offset based on start time so the pattern aligns correctly
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

    // Full-height grid line pattern
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
        {/* Timeline header background — visible area only */}
        <div
          className="absolute top-0 h-8 border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
          style={{
            transform: subtitleContainerTransform,
            left: `${offsetX}px`,
            width: `${renderWidth}px`,
          }}
        >
          {/* CSS-based tick pattern */}
          <div
            className="absolute top-0 left-0 h-8"
            style={{
              width: `${renderWidth}px`,
              background: generateVisibleGridPattern(),
            }}
          />

          {/* Time labels */}
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

        {/* Full-height grid lines — visible area only */}
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
