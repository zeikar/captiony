"use client";

import React, { memo } from "react";

interface TimelineCenterReferenceProps {
  timelineMode: "free" | "centered";
  centerX: number;
  dynamicTimelineHeight: number;
}

export const TimelineCenterReference = memo<TimelineCenterReferenceProps>(
  ({ timelineMode, centerX, dynamicTimelineHeight }) => {
    if (timelineMode !== "centered") return null;

    return (
      <div
        className="absolute top-0 w-px bg-red-400 dark:bg-red-500 pointer-events-none z-5 opacity-30"
        style={{
          height: `${dynamicTimelineHeight}px`,
          left: `${centerX}px`,
        }}
      >
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-400 dark:bg-red-500 rounded-full opacity-50" />
      </div>
    );
  }
);

TimelineCenterReference.displayName = "TimelineCenterReference";
