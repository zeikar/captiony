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
    onMouseDown,
  }) => {
    // 드래그 중이면 임시 위치 사용, 아니면 실제 위치 사용
    const startTime = tempPosition
      ? tempPosition.startTime
      : subtitle.startTime;
    const endTime = tempPosition ? tempPosition.endTime : subtitle.endTime;

    const x = getXFromTime(startTime, timelineOffset, pixelsPerSecond);
    const width = (endTime - startTime) * pixelsPerSecond;

    const style = {
      left: `${x}px`,
      width: `${Math.max(20, width)}px`,
      backgroundColor: isSelected ? "#3b82f6" : "#8b5cf6",
      borderColor: isSelected ? "#1d4ed8" : "#7c3aed",
      transform: "translate3d(0, 0, 0)", // GPU 가속
    };

    return (
      <div
        className={`absolute top-4 h-12 border rounded cursor-move select-none flex items-center justify-center text-xs font-medium text-white overflow-hidden ${
          isSelected ? "ring-2 ring-blue-400" : ""
        }`}
        style={style}
        onMouseDown={(e) => onMouseDown(e, subtitle)}
      >
        {/* 텍스트 */}
        <span className="truncate px-1">{subtitle.text}</span>

        {/* 리사이즈 핸들 - 시작 */}
        <div
          className="absolute left-0 top-0 w-2 h-full bg-transparent cursor-ew-resize hover:bg-blue-400 hover:bg-opacity-50"
          onMouseDown={(e) => {
            e.stopPropagation();
            onMouseDown(e, subtitle, "start");
          }}
        />

        {/* 리사이즈 핸들 - 끝 */}
        <div
          className="absolute right-0 top-0 w-2 h-full bg-transparent cursor-ew-resize hover:bg-blue-400 hover:bg-opacity-50"
          onMouseDown={(e) => {
            e.stopPropagation();
            onMouseDown(e, subtitle, "end");
          }}
        />
      </div>
    );
  }
);
