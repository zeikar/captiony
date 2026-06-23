"use client";

import React, { useRef } from "react";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { TimelineControls } from "./components/TimelineControls";
import { TimelineGrid } from "./components/TimelineGrid";
import { TimelinePlayhead } from "./components/TimelinePlayhead";
import { TimelineDimmingOverlay } from "./components/TimelineDimmingOverlay";
import { SubtitleLayer } from "./components/SubtitleLayer";
import { TimelineCenterReference } from "./components/TimelineCenterReference";
import { useSubtitleDrag } from "./hooks/useSubtitleDrag";
import { useTimelineWheel } from "./hooks/useTimelineWheel";
import { useTimelineMarkers } from "./hooks/useTimelineMarkers";
import { usePlayheadStyle } from "./hooks/usePlayheadStyle";
import { useTimelineClicks } from "./hooks/useTimelineClicks";
import {
  arrangeSubtitlesInLayers,
  findOverlappingSubtitles,
} from "./utils/timelineUtils";
import { useMemo, useCallback, useState, useEffect, memo } from "react";

export const SubtitleTimeline: React.FC = memo(() => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);

  const {
    subtitles,
    timelineOffset,
    timelineScale,
    timelineMode,
    setTimelineOffset,
    setTimelineScale,
    setTimelineMode,
    selectedIds,
    selectSubtitle,
    addSubtitle,
  } = useSubtitleStore();

  const { video, setCurrentTime } = useVideoStore();

  // ResizeObserver to detect timeline width — throttled for performance
  useEffect(() => {
    if (!timelineRef.current) return;

    let rafId: number | null = null;
    const handleResize = (entries: ResizeObserverEntry[]) => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        for (const entry of entries) {
          setTimelineWidth(entry.contentRect.width);
        }
        rafId = null;
      });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(timelineRef.current);

    // Set initial value
    setTimelineWidth(timelineRef.current.clientWidth);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, []);

  // Constants — memoized to avoid unnecessary recalculation
  const constants = useMemo(() => {
    const basePixelsPerSecond = 50;
    const pixelsPerSecond = basePixelsPerSecond * timelineScale;
    const baseTimelineHeight = 120;
    const dynamicTimelineHeight = 200;
    const centerX = timelineWidth / 2;

    return {
      basePixelsPerSecond,
      pixelsPerSecond,
      baseTimelineHeight,
      dynamicTimelineHeight,
      centerX,
    };
  }, [timelineScale, timelineWidth]);

  const {
    pixelsPerSecond,
    dynamicTimelineHeight,
    centerX,
    basePixelsPerSecond,
  } = constants;

  // Custom hooks
  const { handleSubtitleMouseDown, isDragging, tempSubtitlePositions } =
    useSubtitleDrag(pixelsPerSecond);

  // Stable key for the set of bars being dragged this frame (ids don't change
  // mid-drag, so the visible-list memo below isn't recomputed every drag frame).
  const draggingIdsKey = tempSubtitlePositions.map((t) => t.id).join("|");

  useTimelineWheel(
    timelineRef as React.RefObject<HTMLDivElement>,
    timelineOffset,
    timelineScale,
    pixelsPerSecond,
    timelineMode
  );

  // Compute effectiveTimelineOffset
  const effectiveTimelineOffset = useMemo(() => {
    if (timelineMode === "centered") {
      // In centered mode, compute offset so that the current time is centered
      return video.currentTime - centerX / pixelsPerSecond;
    }
    return timelineOffset;
  }, [
    timelineMode,
    video.currentTime,
    centerX,
    pixelsPerSecond,
    timelineOffset,
  ]);

  // Generate time markers (extracted to hook)
  const { timeMarkers, visibleStartTime, visibleEndTime } = useTimelineMarkers({
    timelineWidth,
    timelineMode,
    video,
    timelineOffset,
    pixelsPerSecond,
    timelineScale,
  });

  // Playhead style (extracted to hook)
  const playheadStyleHook = usePlayheadStyle({
    timelineMode,
    centerX,
    video,
    effectiveTimelineOffset,
    pixelsPerSecond,
    timelineWidth,
  });

  // Timeline click/double-click handler (extracted to hook)
  const { handleTimelineClick } = useTimelineClicks({
    timelineRef: timelineRef as React.RefObject<HTMLDivElement>,
    timelineMode,
    centerX,
    video,
    pixelsPerSecond,
    timelineOffset,
    isDragging,
    setCurrentTime,
  });

  // Mode change handler (sync offset to current time when switching to free mode)
  const handleModeChange = useCallback(
    (newMode: "free" | "centered") => {
      if (newMode === "free" && timelineMode === "centered") {
        // When switching from centered to free, set offset so current time stays centered
        const centerX = timelineWidth / 2;
        const newOffset = Math.max(
          0,
          video.currentTime - centerX / pixelsPerSecond
        );
        setTimelineOffset(newOffset);
      }
      setTimelineMode(newMode);
    },
    [
      timelineMode,
      timelineWidth,
      video.currentTime,
      pixelsPerSecond,
      setTimelineOffset,
      setTimelineMode,
    ]
  );

  // Arrange subtitles into layers
  const subtitleLayers = useMemo(() => {
    return arrangeSubtitlesInLayers(subtitles);
  }, [subtitles]);

  // Compute the currently visible time range (virtual list window)
  const visibleTimeRange = useMemo(() => {
    if (timelineWidth === 0 || pixelsPerSecond === 0) {
      return { start: 0, end: 0, overscan: 0 };
    }

    // Visible duration in seconds
    const visibleSeconds = timelineWidth / pixelsPerSecond;
    // Overscan to prevent excessive re-renders (25% of visible range, minimum 2s)
    const overscan = Math.max(2, visibleSeconds * 0.25);

    if (timelineMode === "centered") {
      const half = visibleSeconds / 2;
      const start = Math.max(0, video.currentTime - half - overscan);
      const end = video.currentTime + half + overscan;
      return { start, end, overscan };
    } else {
      const start = Math.max(0, timelineOffset - overscan);
      const end = timelineOffset + visibleSeconds + overscan;
      return { start, end, overscan };
    }
  }, [
    timelineWidth,
    pixelsPerSecond,
    timelineMode,
    video.currentTime,
    timelineOffset,
  ]);

  // Filter to only visible subtitles (simple virtual list)
  const visibleSubtitleLayers = useMemo(() => {
    // Always keep the currently dragged subtitle(s) in the render list
    const draggingIds = new Set(draggingIdsKey ? draggingIdsKey.split("|") : []);

    const intersects = (start: number, end: number) => {
      return end >= visibleTimeRange.start && start <= visibleTimeRange.end;
    };

    return subtitleLayers.map((layer) =>
      layer.filter((subtitle) => {
        // Skip subtitles that end before 0 (preserve existing logic)
        if (subtitle.endTime < 0) return false;

        // Always keep the dragged subtitle(s)
        if (draggingIds.has(subtitle.id)) return true;

        // Render visibility check
        const startTime = subtitle.startTime;
        const endTime = subtitle.endTime;
        return intersects(startTime, endTime);
      })
    );
  }, [
    subtitleLayers,
    visibleTimeRange.start,
    visibleTimeRange.end,
    draggingIdsKey,
  ]);

  // Overlap-check candidate pool: only subtitles intersecting the visible range (with overscan)
  const overlapCandidates = useMemo(() => {
    const result = subtitles.filter(
      (s) =>
        s.endTime >= visibleTimeRange.start &&
        s.startTime <= visibleTimeRange.end
    );
    return result;
  }, [subtitles, visibleTimeRange.start, visibleTimeRange.end]);

  // Compute subtitle container transform for repositioning (performance optimized)
  const subtitleContainerTransform = useMemo(() => {
    if (timelineMode === "centered") {
      // In centered mode, shift the entire container so subtitles render at the correct position
      const translateX = -video.currentTime * pixelsPerSecond + centerX;
      return `translate3d(${translateX}px, 0, 0)`;
    }
    // In free mode, shift based on timelineOffset
    const translateX = -timelineOffset * pixelsPerSecond;
    return `translate3d(${translateX}px, 0, 0)`;
  }, [
    timelineMode,
    video.currentTime,
    pixelsPerSecond,
    centerX,
    timelineOffset,
  ]);

  // Subtitle mousedown handler
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, subtitle: any, dragType?: "start" | "end") => {
      handleSubtitleMouseDown(e, subtitle.id, dragType);
    },
    [handleSubtitleMouseDown]
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl overflow-hidden">
      {/* Control bar */}
      <div className="flex-shrink-0">
        <TimelineControls
          timelineScale={timelineScale}
          timelineMode={timelineMode}
          onScaleChange={setTimelineScale}
          onModeChange={handleModeChange}
          onFitToView={() => {
            if (!timelineRef.current || !video.duration) return;
            const newScale =
              timelineWidth / (video.duration * basePixelsPerSecond);
            const clampedScale = Math.max(0.5, Math.min(5, newScale));
            setTimelineScale(clampedScale);
            setTimelineOffset(0);
          }}
          onResetZoom={() => setTimelineScale(1)}
        />
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={timelineRef}
          className="relative bg-gray-50 dark:bg-gray-800 cursor-pointer select-none h-full"
          onClick={handleTimelineClick}
        >
          {/* Time grid */}
          <TimelineGrid
            timeMarkers={timeMarkers}
            dynamicTimelineHeight={dynamicTimelineHeight}
            subtitleContainerTransform={subtitleContainerTransform}
            pixelsPerSecond={pixelsPerSecond}
            timelineScale={timelineScale}
            visibleStartTime={visibleStartTime}
            visibleEndTime={visibleEndTime}
            videoDuration={video.duration || 0}
          />

          {/* Subtitle bars */}
          <SubtitleLayer
            visibleSubtitleLayers={visibleSubtitleLayers}
            selectedIds={selectedIds}
            tempSubtitlePositions={tempSubtitlePositions}
            overlapCandidates={overlapCandidates}
            pixelsPerSecond={pixelsPerSecond}
            subtitleContainerTransform={subtitleContainerTransform}
            dynamicTimelineHeight={dynamicTimelineHeight}
            onMouseDown={handleMouseDown}
            findOverlappingSubtitles={findOverlappingSubtitles}
          />

          {/* Playhead */}
          <TimelinePlayhead
            dynamicTimelineHeight={dynamicTimelineHeight}
            playheadStyle={playheadStyleHook}
          />

          {/* Center reference line in centered mode */}
          <TimelineCenterReference
            timelineMode={timelineMode}
            centerX={centerX}
            dynamicTimelineHeight={dynamicTimelineHeight}
          />

          {/* Dimming overlay */}
          <TimelineDimmingOverlay
            timelineMode={timelineMode}
            video={video}
            pixelsPerSecond={pixelsPerSecond}
            centerX={centerX}
            timelineOffset={timelineOffset}
            timelineWidth={timelineWidth}
            dynamicTimelineHeight={dynamicTimelineHeight}
          />
        </div>
      </div>
    </div>
  );
});

SubtitleTimeline.displayName = "SubtitleTimeline";
