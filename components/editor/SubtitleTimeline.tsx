"use client";

import React, { useRef } from "react";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { SubtitleBar } from "./components/SubtitleBar";
import { TimelineControls } from "./components/TimelineControls";
import { useSubtitleDrag } from "./hooks/useSubtitleDrag";
import { useTimelineWheel } from "./hooks/useTimelineWheel";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import {
  formatTime,
  getTimeFromX,
  getXFromTime,
  arrangeSubtitlesInLayers,
  findOverlappingSubtitles,
} from "./utils/timelineUtils";
import { useMemo, useCallback, useState, useEffect } from "react";

export const SubtitleTimeline: React.FC = React.memo(() => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);

  const {
    subtitles,
    timelineOffset,
    timelineScale,
    setTimelineOffset,
    setTimelineScale,
    selectedSubtitleId,
    selectSubtitle,
    addSubtitle,
  } = useSubtitleStore();

  const { video, setCurrentTime } = useVideoStore();

  // Timeline width 감지를 위한 ResizeObserver
  useEffect(() => {
    if (!timelineRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setTimelineWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(timelineRef.current);
    
    // 초기 값 설정
    setTimelineWidth(timelineRef.current.clientWidth);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Constants
  const basePixelsPerSecond = 50;
  const pixelsPerSecond = basePixelsPerSecond * timelineScale;
  const baseTimelineHeight = 120;

  // Custom hooks
  const { handleSubtitleMouseDown, isDragging, tempSubtitlePosition } =
    useSubtitleDrag(pixelsPerSecond);

  // 플레이헤드를 위한 별도 ref 생성 (실제로는 timelineRef와 다른 용도)
  const playheadRef = useRef<HTMLDivElement>(null);

  useTimelineWheel(
    timelineRef as React.RefObject<HTMLDivElement>,
    timelineOffset,
    timelineScale,
    pixelsPerSecond
  );
  useKeyboardShortcuts();

  // 자막을 레이어별로 배치
  const subtitleLayers = useMemo(() => {
    return arrangeSubtitlesInLayers(subtitles);
  }, [subtitles]);

  // 타임라인 높이를 부모 컨테이너에 맞게 설정
  const dynamicTimelineHeight = 200; // 고정 높이 증가

  // 시간 눈금 생성
  const timeMarkers = useMemo(() => {
    // timelineWidth가 0이면 빈 배열 반환
    if (timelineWidth === 0) return [];

    const startTime = timelineOffset;
    const endTime = timelineOffset + timelineWidth / pixelsPerSecond;
    const markers = [];

    // 줌 레벨에 따른 간격과 레이블 표시 간격 결정
    let majorInterval = 1; // 주요 눈금 (초 단위)
    let minorInterval = 0.5; // 보조 눈금
    let labelInterval = 1; // 레이블 표시 간격

    if (timelineScale < 0.3) {
      majorInterval = 30;
      minorInterval = 10;
      labelInterval = 30;
    } else if (timelineScale < 0.6) {
      majorInterval = 10;
      minorInterval = 5;
      labelInterval = 10;
    } else if (timelineScale < 1) {
      majorInterval = 5;
      minorInterval = 1;
      labelInterval = 5;
    } else if (timelineScale < 2) {
      majorInterval = 1;
      minorInterval = 0.5;
      labelInterval = 2; // 2초마다 레이블 표시
    } else if (timelineScale < 4) {
      majorInterval = 1;
      minorInterval = 0.5;
      labelInterval = 1;
    } else {
      majorInterval = 0.5;
      minorInterval = 0.1;
      labelInterval = 1;
    }

    // 주요 눈금 생성
    const startMajor = Math.floor(startTime / majorInterval) * majorInterval;
    const endMajor = Math.ceil(endTime / majorInterval) * majorInterval;

    for (let time = startMajor; time <= endMajor; time += majorInterval) {
      const x = getXFromTime(time, timelineOffset, pixelsPerSecond);
      if (x >= -100 && x <= timelineWidth + 100) {
        const shouldShowLabel = time % labelInterval === 0;
        markers.push({
          time,
          x,
          label: formatTime(time),
          isSecond: true,
          isMajor: true,
          showLabel: shouldShowLabel,
        });
      }
    }

    // 보조 눈금 생성 (줌이 충분할 때만)
    if (timelineScale >= 1) {
      const startMinor = Math.floor(startTime / minorInterval) * minorInterval;
      const endMinor = Math.ceil(endTime / minorInterval) * minorInterval;

      for (let time = startMinor; time <= endMinor; time += minorInterval) {
        const x = getXFromTime(time, timelineOffset, pixelsPerSecond);
        if (x >= -50 && x <= timelineWidth + 50) {
          // 주요 눈금과 겹치지 않는 경우만 추가
          const isNotMajor = time % majorInterval !== 0;
          if (isNotMajor) {
            markers.push({
              time,
              x,
              label: formatTime(time),
              isSecond: false,
              isMajor: false,
              showLabel: false,
            });
          }
        }
      }
    }

    return markers.sort((a, b) => a.time - b.time);
  }, [timelineOffset, pixelsPerSecond, timelineScale, timelineWidth]);

  // 현재 재생 위치 플레이헤드 스타일
  const playheadStyle = useMemo(() => {
    const x = getXFromTime(video.currentTime, timelineOffset, pixelsPerSecond);
    return {
      transform: `translate3d(${x}px, 0, 0)`,
      visibility: (x >= -2 && x <= timelineWidth + 2
        ? "visible"
        : "hidden") as "visible" | "hidden",
    };
  }, [video.currentTime, timelineOffset, pixelsPerSecond, timelineWidth]);

  // 타임라인 클릭 핸들러
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return;

      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const time = getTimeFromX(x, timelineOffset, pixelsPerSecond);

      setCurrentTime(time);
    },
    [isDragging, timelineOffset, pixelsPerSecond, setCurrentTime]
  );

  // 더블클릭으로 새 자막 추가
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const time = getTimeFromX(x, timelineOffset, pixelsPerSecond);

      const newSubtitle = {
        startTime: time,
        endTime: time + 2,
        text: "새 자막",
      };

      addSubtitle(newSubtitle);
      selectSubtitle(Date.now().toString()); // 임시 ID, 실제로는 addSubtitle에서 반환된 ID를 사용해야 함
    },
    [timelineOffset, pixelsPerSecond, addSubtitle, selectSubtitle]
  );

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
          onScaleChange={setTimelineScale}
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
          <div className="absolute top-0 left-0 w-full h-8 border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900">
            {timeMarkers.map((marker, index) => (
              <div
                key={`${marker.time}-${index}`}
                className="absolute top-0"
                style={{ left: `${marker.x}px` }}
              >
                {/* 주요 눈금에는 전체 높이 그리드 라인 */}
                {marker.isMajor && (
                  <div
                    className="absolute top-0 w-px bg-gray-300 dark:bg-gray-600 opacity-40"
                    style={{ height: `${dynamicTimelineHeight}px` }}
                  />
                )}

                {/* 눈금 표시 */}
                <div
                  className={`w-px relative z-10 ${
                    marker.isMajor
                      ? "bg-gray-600 dark:bg-gray-400 h-8"
                      : "bg-gray-400 dark:bg-gray-500 h-4"
                  }`}
                />

                {/* 시간 레이블 - 겹침 방지를 위해 조건부 표시 */}
                {marker.showLabel && (
                  <div
                    className="absolute left-1 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap font-mono bg-white/90 dark:bg-gray-900/90 px-1.5 py-0.5 rounded shadow-sm border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
                    style={{
                      top: marker.isMajor ? "32px" : "28px",
                      transform: "translateX(-50%)",
                      left: "0px",
                    }}
                  >
                    {marker.label}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 자막 바들 */}
          <div
            className="absolute top-8 left-0 w-full"
            style={{ height: `${dynamicTimelineHeight - 32}px` }}
          >
            {/* 레이어 구분선 - 레이어가 2개 이상일 때만 표시 */}
            {subtitleLayers.length > 1 &&
              subtitleLayers.map((_, layerIndex) => (
                <div
                  key={`layer-line-${layerIndex}`}
                  className="absolute left-0 w-full h-px bg-gray-200 dark:bg-gray-700 opacity-50"
                  style={{ top: `${16 + layerIndex * 16 + 48}px` }}
                />
              ))}

            {subtitleLayers.map((layer, layerIndex) =>
              layer.map((subtitle) => {
                // 드래그 중인 자막의 임시 위치 확인
                const tempPos =
                  tempSubtitlePosition &&
                  tempSubtitlePosition.id === subtitle.id
                    ? {
                        startTime: tempSubtitlePosition.startTime,
                        endTime: tempSubtitlePosition.endTime,
                      }
                    : null;

                // 겹침 확인 (드래그 중이면 임시 위치 기준으로 확인)
                const currentPosition = tempPos
                  ? { ...subtitle, ...tempPos }
                  : subtitle;
                const overlappingSubtitles = findOverlappingSubtitles(
                  subtitles,
                  currentPosition
                );
                const hasOverlap = overlappingSubtitles.length > 0;

                return (
                  <SubtitleBar
                    key={subtitle.id}
                    subtitle={subtitle}
                    timelineOffset={timelineOffset}
                    pixelsPerSecond={pixelsPerSecond}
                    isSelected={subtitle.id === selectedSubtitleId}
                    tempPosition={tempPos}
                    layerIndex={layerIndex}
                    hasOverlap={hasOverlap}
                    onMouseDown={handleMouseDown}
                  />
                );
              })
            )}
          </div>

          {/* 플레이헤드 */}
          <div
            className="absolute top-0 w-0.5 bg-blue-600 dark:bg-blue-500 pointer-events-none z-10"
            style={{
              height: `${dynamicTimelineHeight}px`,
              ...playheadStyle,
            }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
});
