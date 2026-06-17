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
        {/* Layer separators — shown only when there are 2 or more layers */}
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
            // Skip subtitles that start or end before 0s
            if (subtitle.endTime < 0) return null;

            // Check for temporary drag position
            const tempPos =
              tempSubtitlePosition && tempSubtitlePosition.id === subtitle.id
                ? {
                    startTime: tempSubtitlePosition.startTime,
                    endTime: tempSubtitlePosition.endTime,
                  }
                : null;

            // Overlap check — computed only when necessary
            const currentPosition = tempPos
              ? { ...subtitle, ...tempPos }
              : subtitle;
            let hasOverlap = false;

            // Only check overlap for dragged or selected subtitles (performance optimization)
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
                timelineOffset={0} // always 0 — the container itself is translated
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
