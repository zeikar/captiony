"use client";

import React, { memo } from "react";
import { SubtitleBar } from "./SubtitleBar";

interface SubtitleLayerProps {
  visibleSubtitleLayers: Array<Array<any>>;
  selectedSubtitleId: string | null;
  tempSubtitlePosition: {
    id: string;
    startTime: number;
    endTime: number;
  } | null;
  overlapCandidates: any[];
  pixelsPerSecond: number;
  subtitleContainerTransform: string;
  dynamicTimelineHeight: number;
  onMouseDown: (
    e: React.MouseEvent,
    subtitle: any,
    dragType?: "start" | "end"
  ) => void;
  findOverlappingSubtitles: (candidates: any[], position: any) => any[];
}

export const SubtitleLayer = memo<SubtitleLayerProps>(
  ({
    visibleSubtitleLayers,
    selectedSubtitleId,
    tempSubtitlePosition,
    overlapCandidates,
    pixelsPerSecond,
    subtitleContainerTransform,
    dynamicTimelineHeight,
    onMouseDown,
    findOverlappingSubtitles,
  }) => {
    return (
      <div
        className="absolute top-8 left-0 w-full"
        style={{
          height: `${dynamicTimelineHeight - 32}px`,
          transform: subtitleContainerTransform,
        }}
      >
        {/* 레이어 구분선 - 레이어가 2개 이상일 때만 표시 */}
        {visibleSubtitleLayers.length > 1 &&
          visibleSubtitleLayers.map((_, layerIndex) => (
            <div
              key={`layer-line-${layerIndex}`}
              className="absolute left-0 w-full h-px bg-gray-200 dark:bg-gray-700 opacity-50"
              style={{ top: `${16 + layerIndex * 16 + 48}px` }}
            />
          ))}

        {visibleSubtitleLayers.map((layer, layerIndex) =>
          layer.map((subtitle) => {
            // 자막이 0초 미만에서 시작하거나 끝나면 렌더링하지 않음
            if (subtitle.endTime < 0) return null;

            // 드래그 중인 자막의 임시 위치 확인
            const tempPos =
              tempSubtitlePosition && tempSubtitlePosition.id === subtitle.id
                ? {
                    startTime: tempSubtitlePosition.startTime,
                    endTime: tempSubtitlePosition.endTime,
                  }
                : null;

            // 겹침 확인 최적화 - 필요할 때만 계산
            const currentPosition = tempPos
              ? { ...subtitle, ...tempPos }
              : subtitle;
            let hasOverlap = false;

            // 드래그 중이거나 선택된 자막만 겹침 검사 (성능 최적화)
            if (subtitle.id === selectedSubtitleId || tempPos) {
              const overlappingSubtitles = findOverlappingSubtitles(
                overlapCandidates,
                currentPosition
              );
              hasOverlap = overlappingSubtitles.length > 0;
            }

            return (
              <SubtitleBar
                key={subtitle.id}
                subtitle={subtitle}
                timelineOffset={0} // 항상 0으로 고정 (컨테이너가 이동하므로)
                pixelsPerSecond={pixelsPerSecond}
                isSelected={subtitle.id === selectedSubtitleId}
                tempPosition={tempPos}
                layerIndex={layerIndex}
                hasOverlap={hasOverlap}
                onMouseDown={onMouseDown}
              />
            );
          })
        )}
      </div>
    );
  }
);

SubtitleLayer.displayName = "SubtitleLayer";
