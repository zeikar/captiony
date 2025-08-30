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
    selectedSubtitleId,
    selectSubtitle,
    addSubtitle,
  } = useSubtitleStore();

  const { video, setCurrentTime } = useVideoStore();

  // Timeline width 감지를 위한 ResizeObserver - throttled로 성능 최적화
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

    // 초기 값 설정
    setTimelineWidth(timelineRef.current.clientWidth);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, []);

  // Constants - 메모이제이션으로 재계산 방지
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
  const { handleSubtitleMouseDown, isDragging, tempSubtitlePosition } =
    useSubtitleDrag(pixelsPerSecond);

  useTimelineWheel(
    timelineRef as React.RefObject<HTMLDivElement>,
    timelineOffset,
    timelineScale,
    pixelsPerSecond,
    timelineMode
  );

  // effectiveTimelineOffset 계산
  const effectiveTimelineOffset = useMemo(() => {
    if (timelineMode === "centered") {
      // Centered 모드에서는 현재 시간을 중앙에 위치시키기 위해 offset 계산
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

  // 시간 눈금 생성 (훅으로 분리)
  const timelineMarkers = useTimelineMarkers({
    timelineWidth,
    timelineMode,
    video,
    timelineOffset,
    pixelsPerSecond,
    timelineScale,
  });

  // 플레이헤드 스타일 (훅으로 분리)
  const playheadStyleHook = usePlayheadStyle({
    timelineMode,
    centerX,
    video,
    effectiveTimelineOffset,
    pixelsPerSecond,
    timelineWidth,
  });

  // 타임라인 클릭/더블클릭 핸들러 (훅으로 분리)
  const { handleTimelineClick, handleDoubleClick } = useTimelineClicks({
    timelineRef: timelineRef as React.RefObject<HTMLDivElement>,
    timelineMode,
    centerX,
    video,
    pixelsPerSecond,
    timelineOffset,
    isDragging,
    setCurrentTime,
    addSubtitle,
    selectSubtitle,
  });

  // 모드 변경 핸들러 (free 모드로 바뀔 때 현재 재생 시간으로 이동)
  const handleModeChange = useCallback(
    (newMode: "free" | "centered") => {
      if (newMode === "free" && timelineMode === "centered") {
        // centered에서 free로 바뀔 때, 현재 재생 시간이 중앙에 오도록 offset 설정
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

  // 자막을 레이어별로 배치
  const subtitleLayers = useMemo(() => {
    return arrangeSubtitlesInLayers(subtitles);
  }, [subtitles]);

  // 현재 보이는 시간 범위 계산 (가상 리스트 윈도우)
  const visibleTimeRange = useMemo(() => {
    if (timelineWidth === 0 || pixelsPerSecond === 0) {
      return { start: 0, end: 0, overscan: 0 };
    }

    // 화면에 보이는 시간 길이(초)
    const visibleSeconds = timelineWidth / pixelsPerSecond;
    // 과도한 재렌더 방지를 위한 오버스캔 (보이는 구간의 25% 또는 최소 2초)
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

  // 보이는 자막만 필터링 (간단한 가상 리스트)
  const visibleSubtitleLayers = useMemo(() => {
    // dragging 중인 자막은 항상 렌더링 유지
    const draggingId = tempSubtitlePosition?.id;

    const intersects = (start: number, end: number) => {
      return end >= visibleTimeRange.start && start <= visibleTimeRange.end;
    };

    return subtitleLayers.map((layer) =>
      layer.filter((subtitle) => {
        // 음수로 끝나는 자막은 스킵 (기존 로직 유지)
        if (subtitle.endTime < 0) return false;

        // 드래그 중인 자막은 무조건 유지
        if (draggingId && subtitle.id === draggingId) return true;

        // 렌더 가시성 판단
        const startTime = subtitle.startTime;
        const endTime = subtitle.endTime;
        return intersects(startTime, endTime);
      })
    );
  }, [
    subtitleLayers,
    visibleTimeRange.start,
    visibleTimeRange.end,
    tempSubtitlePosition?.id,
  ]);

  // 겹침 체크용 후보 풀: 보이는 범위(오버스캔 포함)에 교차하는 자막만
  const overlapCandidates = useMemo(() => {
    const result = subtitles.filter(
      (s) =>
        s.endTime >= visibleTimeRange.start &&
        s.startTime <= visibleTimeRange.end
    );
    return result;
  }, [subtitles, visibleTimeRange.start, visibleTimeRange.end]);

  // 자막 컨테이너 이동을 위한 transform 계산 (성능 최적화)
  const subtitleContainerTransform = useMemo(() => {
    if (timelineMode === "centered") {
      // Centered 모드에서는 컨테이너 전체를 이동시켜 자막들을 올바른 위치에 표시
      const translateX = -video.currentTime * pixelsPerSecond + centerX;
      return `translate3d(${translateX}px, 0, 0)`;
    }
    // Free 모드에서는 timelineOffset 기준으로 이동
    const translateX = -timelineOffset * pixelsPerSecond;
    return `translate3d(${translateX}px, 0, 0)`;
  }, [
    timelineMode,
    video.currentTime,
    pixelsPerSecond,
    centerX,
    timelineOffset,
  ]);

  // 자막 마우스다운 핸들러
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, subtitle: any, dragType?: "start" | "end") => {
      handleSubtitleMouseDown(e, subtitle.id, dragType);
    },
    [handleSubtitleMouseDown]
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl overflow-hidden">
      {/* 컨트롤 바 */}
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

      {/* 타임라인 */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={timelineRef}
          className="relative bg-gray-50 dark:bg-gray-800 cursor-pointer select-none h-full"
          onClick={handleTimelineClick}
          onDoubleClick={handleDoubleClick}
        >
          {/* 시간 눈금 */}
          <TimelineGrid
            timeMarkers={timelineMarkers}
            dynamicTimelineHeight={dynamicTimelineHeight}
            subtitleContainerTransform={subtitleContainerTransform}
          />

          {/* 자막 바들 */}
          <SubtitleLayer
            visibleSubtitleLayers={visibleSubtitleLayers}
            selectedSubtitleId={selectedSubtitleId}
            tempSubtitlePosition={tempSubtitlePosition}
            overlapCandidates={overlapCandidates}
            pixelsPerSecond={pixelsPerSecond}
            subtitleContainerTransform={subtitleContainerTransform}
            dynamicTimelineHeight={dynamicTimelineHeight}
            onMouseDown={handleMouseDown}
            findOverlappingSubtitles={findOverlappingSubtitles}
          />

          {/* 플레이헤드 */}
          <TimelinePlayhead
            dynamicTimelineHeight={dynamicTimelineHeight}
            playheadStyle={playheadStyleHook}
          />

          {/* Centered 모드에서 중앙 참조선 */}
          <TimelineCenterReference
            timelineMode={timelineMode}
            centerX={centerX}
            dynamicTimelineHeight={dynamicTimelineHeight}
          />

          {/* 딤드 오버레이 */}
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
