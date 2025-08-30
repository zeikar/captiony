"use client";

import React, { memo } from "react";

interface TimelineDimmingOverlayProps {
  timelineMode: "free" | "centered";
  video: { duration: number; currentTime: number };
  pixelsPerSecond: number;
  centerX: number;
  timelineOffset: number;
  timelineWidth: number;
  dynamicTimelineHeight: number;
}

export const TimelineDimmingOverlay = memo<TimelineDimmingOverlayProps>(
  ({
    timelineMode,
    video,
    pixelsPerSecond,
    centerX,
    timelineOffset,
    timelineWidth,
    dynamicTimelineHeight,
  }) => {
    const renderVideoDurationDim = () => {
      if (!video.duration) return null;

      // 고정 좌표계에서 동영상 끝 위치 계산
      const videoDurationX = video.duration * pixelsPerSecond;

      // 현재 보이는 영역에서 동영상 끝 위치 계산
      let visibleVideoDurationX: number;
      if (timelineMode === "centered") {
        visibleVideoDurationX =
          videoDurationX - video.currentTime * pixelsPerSecond + centerX;
      } else {
        visibleVideoDurationX =
          videoDurationX - timelineOffset * pixelsPerSecond;
      }

      if (visibleVideoDurationX < timelineWidth && visibleVideoDurationX > 0) {
        return (
          <div
            className="absolute top-0 bg-gray-900/20 dark:bg-gray-100/10 pointer-events-none z-5"
            style={{
              left: `${Math.max(0, visibleVideoDurationX)}px`,
              width: `${timelineWidth - Math.max(0, visibleVideoDurationX)}px`,
              height: `${dynamicTimelineHeight}px`,
            }}
          >
            <div className="absolute left-0 top-0 w-0.5 h-full bg-orange-500 dark:bg-orange-400 opacity-60" />
          </div>
        );
      }
      return null;
    };

    const renderZeroDim = () => {
      // 현재 보이는 영역에서 0초 위치 계산
      let visibleZeroX: number;
      if (timelineMode === "centered") {
        visibleZeroX = -video.currentTime * pixelsPerSecond + centerX;
      } else {
        visibleZeroX = -timelineOffset * pixelsPerSecond;
      }

      if (visibleZeroX > 0 && visibleZeroX < timelineWidth) {
        return (
          <div
            className="absolute top-0 bg-gray-900/30 dark:bg-gray-100/20 pointer-events-none z-5"
            style={{
              left: "0px",
              width: `${Math.min(timelineWidth, visibleZeroX)}px`,
              height: `${dynamicTimelineHeight}px`,
            }}
          >
            <div className="absolute right-0 top-0 w-0.5 h-full bg-red-500 dark:bg-red-400 opacity-60" />
          </div>
        );
      }
      return null;
    };

    return (
      <>
        {/* 동영상 길이를 넘어가는 부분 딤드 처리 */}
        {renderVideoDurationDim()}

        {/* 0초 아래 부분 딤드 처리 */}
        {renderZeroDim()}
      </>
    );
  }
);

TimelineDimmingOverlay.displayName = "TimelineDimmingOverlay";
