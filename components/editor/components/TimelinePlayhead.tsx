"use client";

import React, { memo } from "react";

interface TimelinePlayheadProps {
  dynamicTimelineHeight: number;
  playheadStyle: {
    transform: string;
    visibility: "visible" | "hidden";
  };
}

export const TimelinePlayhead = memo<TimelinePlayheadProps>(
  ({ dynamicTimelineHeight, playheadStyle }) => {
    return (
      <div
        className="absolute top-0 w-0.5 bg-blue-600 dark:bg-blue-500 pointer-events-none z-10"
        style={{
          height: `${dynamicTimelineHeight}px`,
          ...playheadStyle,
        }}
      >
        <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-sm" />
      </div>
    );
  }
);

TimelinePlayhead.displayName = "TimelinePlayhead";
