"use client";

import { memo, useCallback } from "react";
import type { SubtitleItem } from "@/lib/stores/subtitle-store";

interface SubtitleBarProps {
  subtitle: SubtitleItem;
  isSelected: boolean;
  isDragging: boolean;
  timelineOffset: number;
  pixelsPerSecond: number;
  subtitleHeight: number;
  layerIndex: number;
  subtitleMargin: number;
  tempPosition?: { startTime: number; endTime: number } | null;
  onMouseDown: (e: React.MouseEvent, subtitleId: string) => void;
  onResizeHandleMouseDown: (
    e: React.MouseEvent,
    subtitleId: string,
    handle: "start" | "end"
  ) => void;
}

export const SubtitleBar = memo<SubtitleBarProps>(
  ({
    subtitle,
    isSelected,
    isDragging,
    timelineOffset,
    pixelsPerSecond,
    subtitleHeight,
    layerIndex,
    subtitleMargin,
    tempPosition,
    onMouseDown,
    onResizeHandleMouseDown,
  }) => {
    // 드래그 중이면 임시 위치 사용, 아니면 원래 위치 사용
    const effectiveStartTime = tempPosition?.startTime ?? subtitle.startTime;
    const effectiveEndTime = tempPosition?.endTime ?? subtitle.endTime;

    const startX = (effectiveStartTime - timelineOffset) * pixelsPerSecond;
    const width = (effectiveEndTime - effectiveStartTime) * pixelsPerSecond;
    const y = 25 + layerIndex * (subtitleHeight + subtitleMargin);

    const handleMainMouseDown = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onMouseDown(e, subtitle.id);
      },
      [onMouseDown, subtitle.id]
    );

    const handleStartHandleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onResizeHandleMouseDown(e, subtitle.id, "start");
      },
      [onResizeHandleMouseDown, subtitle.id]
    );

    const handleEndHandleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onResizeHandleMouseDown(e, subtitle.id, "end");
      },
      [onResizeHandleMouseDown, subtitle.id]
    );

    return (
      <div
        className={`absolute rounded cursor-pointer border text-white text-xs overflow-hidden group select-none transform-gpu ${
          isSelected
            ? "bg-blue-500 border-blue-700 shadow-lg z-10"
            : "bg-gray-500 hover:bg-gray-600 border-gray-600 hover:shadow-md hover:z-10"
        } ${isDragging ? "opacity-90 shadow-xl" : ""}`}
        style={{
          left: Math.max(0, startX),
          top: y,
          width: startX < 0 ? width + startX : Math.max(width, 2),
          height: subtitleHeight,
          pointerEvents: "auto",
          willChange: isDragging ? "transform, left, width" : "auto",
          transition: isDragging ? "none" : "all 0.1s ease",
          backfaceVisibility: "hidden",
          perspective: 1000,
        }}
        onMouseDown={handleMainMouseDown}
        title={subtitle.text}
      >
        {/* 자막 텍스트 */}
        <div className="px-2 py-1 truncate h-full flex items-center pointer-events-none">
          {subtitle.text.length > 15
            ? subtitle.text.substring(0, 15) + "..."
            : subtitle.text}
        </div>

        {/* 리사이즈 핸들 (선택된 자막만) */}
        {isSelected && (
          <>
            <div
              className="absolute left-0 top-0 w-1 h-full bg-blue-700 cursor-ew-resize hover:bg-blue-600 z-20"
              onMouseDown={handleStartHandleMouseDown}
            />
            <div
              className="absolute right-0 top-0 w-1 h-full bg-blue-700 cursor-ew-resize hover:bg-blue-600 z-20"
              onMouseDown={handleEndHandleMouseDown}
            />
          </>
        )}
      </div>
    );
  }
);

SubtitleBar.displayName = "SubtitleBar";
