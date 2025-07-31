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
    // 드래그 중이면 임시 위치 사용, 아니면 실제 위치 사용
    const startTime = tempPosition
      ? tempPosition.startTime
      : subtitle.startTime;
    const endTime = tempPosition ? tempPosition.endTime : subtitle.endTime;

    const x = getXFromTime(startTime, timelineOffset, pixelsPerSecond);
    const width = (endTime - startTime) * pixelsPerSecond;

    // 레이어에 따른 Y 위치 계산 (각 레이어는 16px씩 아래로)
    const yOffset = layerIndex * 16;

    // 색상 우선순위: 선택됨 + 겹침 > 선택됨 > 겹침 > 기본
    let backgroundClass: string;
    let borderClass: string;
    let ringClass: string = "";

    if (isSelected && hasOverlap) {
      // 선택됨 + 겹침: 밝은 주황색
      backgroundClass = "bg-orange-400"; // 더 밝은 주황색
      borderClass = "border-orange-500";
      ringClass = "ring-2 ring-orange-300";
    } else if (isSelected) {
      // 선택됨: 파란색
      backgroundClass = "bg-blue-500";
      borderClass = "border-blue-700";
      ringClass = "ring-2 ring-blue-400";
    } else if (hasOverlap) {
      // 겹침: 빨간색
      backgroundClass = "bg-red-500";
      borderClass = "border-red-600";
      ringClass = "ring-2 ring-red-400";
    } else {
      // 기본: 보라색
      backgroundClass = "bg-violet-500";
      borderClass = "border-violet-600";
    }

    const style = {
      left: `${x}px`,
      width: `${Math.max(20, width)}px`,
      top: `${16 + yOffset}px`, // 기본 16px + 레이어 오프셋
      transform: "translate3d(0, 0, 0)", // GPU 가속
    };

    return (
      <div
        className={`absolute h-12 border rounded cursor-move select-none flex items-center justify-center text-xs font-medium text-white overflow-hidden ${backgroundClass} ${borderClass} ${ringClass}`}
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
