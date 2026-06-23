"use client";

import React, { memo } from "react";
import { SubtitleBar } from "./SubtitleBar";

interface SubtitleLayerProps {
  visibleSubtitleLayers: Array<Array<any>>;
  selectedIds: string[];
  tempSubtitlePositions: Array<{
    id: string;
    startTime: number;
    endTime: number;
  }>;
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
    selectedIds,
    tempSubtitlePositions,
    overlapCandidates,
    pixelsPerSecond,
    subtitleContainerTransform,
    dynamicTimelineHeight,
    onMouseDown,
    findOverlappingSubtitles,
  }) => {
    // O(1) per-bar lookup of this drag's preview positions (one entry for a
    // single move/resize; one per cue for a multi-selection group move).
    const tempPosById = new Map(
      tempSubtitlePositions.map((t) => [
        t.id,
        { startTime: t.startTime, endTime: t.endTime },
      ])
    );

    // Overlap candidates must reflect LIVE positions: while a group drags, every
    // moving bar shifts, so checking against their original positions would flag
    // stale (ghost) overlaps. Apply each dragged bar's temp position to the pool.
    const effectiveOverlapCandidates =
      tempSubtitlePositions.length > 0
        ? overlapCandidates.map((c) => {
            const t = tempPosById.get(c.id);
            return t ? { ...c, startTime: t.startTime, endTime: t.endTime } : c;
          })
        : overlapCandidates;

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
            const tempPos = tempPosById.get(subtitle.id) ?? null;

            const isSelected = selectedIds.includes(subtitle.id);

            // Overlap check — computed only when necessary
            const currentPosition = tempPos
              ? { ...subtitle, ...tempPos }
              : subtitle;
            let hasOverlap = false;

            // Only check overlap for dragged or selected subtitles (performance optimization)
            if (isSelected || tempPos) {
              const overlappingSubtitles = findOverlappingSubtitles(
                effectiveOverlapCandidates,
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
                isSelected={isSelected}
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
