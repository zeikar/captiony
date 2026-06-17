"use client";

import React from "react";
import type { SubtitleItem } from "@/lib/stores/subtitle-store";
import { getXFromTime } from "../utils/timelineUtils";

interface SubtitleBarProps {
  subtitle: SubtitleItem;
  timelineOffset: number;
  pixelsPerSecond: number;
  isSelected: boolean;
  tempPosition?: { startTime: number; endTime: number } | null;
  layerIndex?: number;
  hasOverlap?: boolean;
  onMouseDown: (
    e: React.MouseEvent,
    subtitle: SubtitleItem,
    dragType?: "start" | "end"
  ) => void;
}

export const SubtitleBar = React.memo<SubtitleBarProps>(
  ({
    subtitle,
    timelineOffset,
    pixelsPerSecond,
    isSelected,
    tempPosition,
    layerIndex = 0,
    hasOverlap = false,
    onMouseDown,
  }) => {
    // Use temporary position while dragging, otherwise use the real position
    const startTime = tempPosition
      ? tempPosition.startTime
      : subtitle.startTime;
    const endTime = tempPosition ? tempPosition.endTime : subtitle.endTime;

    const x = getXFromTime(startTime, timelineOffset, pixelsPerSecond);
    const width = (endTime - startTime) * pixelsPerSecond;

    // Y offset per layer (each layer shifts down by 16px)
    const yOffset = layerIndex * 16;

    // Color priority: selected + overlap > selected > overlap > default
    let backgroundClass: string;
    let borderClass: string;
    let textClass: string = "text-white";
    let ringClass: string = "";

    if (isSelected && hasOverlap) {
      // Selected + overlap: bright orange
      backgroundClass = "bg-orange-500 dark:bg-orange-400";
      borderClass = "border-orange-600 dark:border-orange-500";
      ringClass = "ring-2 ring-orange-400 dark:ring-orange-300";
      textClass = "text-white";
    } else if (isSelected) {
      // Selected: blue
      backgroundClass = "bg-blue-500 dark:bg-blue-600";
      borderClass = "border-blue-600 dark:border-blue-700";
      ringClass = "ring-2 ring-blue-400 dark:ring-blue-400";
      textClass = "text-white";
    } else if (hasOverlap) {
      // Overlap: red
      backgroundClass = "bg-red-500 dark:bg-red-600";
      borderClass = "border-red-600 dark:border-red-700";
      ringClass = "ring-2 ring-red-400 dark:ring-red-400";
      textClass = "text-white";
    } else {
      // Default: purple
      backgroundClass = "bg-violet-500 dark:bg-violet-600";
      borderClass = "border-violet-600 dark:border-violet-700";
      textClass = "text-white";
    }

    const style = {
      left: `${x}px`,
      width: `${Math.max(20, width)}px`,
      top: `${28 + yOffset}px`, // base 28px + layer offset
      transform: "translate3d(0, 0, 0)", // GPU acceleration
    };

    return (
      <div
        className={`absolute h-12 border rounded cursor-move select-none flex items-center justify-center text-xs font-medium overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-150 ${backgroundClass} ${borderClass} ${textClass} ${ringClass}`}
        style={style}
        onMouseDown={(e) => onMouseDown(e, subtitle)}
      >
        {/* Text */}
        <span className="truncate px-1 font-medium">{subtitle.text}</span>

        {/* Resize handle — start */}
        <div
          className="absolute left-0 top-0 w-2 h-full bg-transparent cursor-ew-resize hover:bg-white/30 transition-colors duration-150"
          onMouseDown={(e) => {
            e.stopPropagation();
            onMouseDown(e, subtitle, "start");
          }}
        />

        {/* Resize handle — end */}
        <div
          className="absolute right-0 top-0 w-2 h-full bg-transparent cursor-ew-resize hover:bg-white/30 transition-colors duration-150"
          onMouseDown={(e) => {
            e.stopPropagation();
            onMouseDown(e, subtitle, "end");
          }}
        />
      </div>
    );
  }
);
