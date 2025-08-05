"use client";

import React, { useRef } from "react";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { SubtitleBar } from "./components/SubtitleBar";
import { TimelineControls } from "./components/TimelineControls";
import { useSubtitleDrag } from "./hooks/useSubtitleDrag";
import { useTimelineWheel } from "./hooks/useTimelineWheel";
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
    timelineMode,
    setTimelineOffset,
    setTimelineScale,
    setTimelineMode,
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
    pixelsPerSecond,
    timelineMode
  );

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

  // 타임라인 높이를 부모 컨테이너에 맞게 설정
  const dynamicTimelineHeight = 200; // 고정 높이 증가

  // Centered 모드에서 사용할 계산된 값들
  const centerX = timelineWidth / 2;
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

  // 시간 눈금 생성 (성능 최적화를 위해 고정 기준점 사용)
  const timeMarkers = useMemo(() => {
    // timelineWidth가 0이면 빈 배열 반환
    if (timelineWidth === 0) return [];

    // 현재 표시되는 시간 범위 계산
    let visibleStartTime: number;
    let visibleEndTime: number;

    if (timelineMode === "centered") {
      // Centered 모드에서는 현재 시간 기준으로 좌우 표시 범위 계산
      const halfVisible = timelineWidth / (2 * pixelsPerSecond);
      visibleStartTime = Math.max(0, video.currentTime - halfVisible);
      visibleEndTime = video.currentTime + halfVisible;
    } else {
      // Free 모드에서는 timelineOffset 기준
      visibleStartTime = Math.max(0, timelineOffset);
      visibleEndTime = timelineOffset + timelineWidth / pixelsPerSecond;
    }

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
    const startMajor = Math.max(
      0,
      Math.floor(visibleStartTime / majorInterval) * majorInterval
    );
    const endMajor = Math.ceil(visibleEndTime / majorInterval) * majorInterval;

    for (let time = startMajor; time <= endMajor; time += majorInterval) {
      if (time < 0) continue;

      // 고정 기준점(timelineOffset = 0) 기준으로 x 좌표 계산
      const x = time * pixelsPerSecond;
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

    // 보조 눈금 생성 (줌이 충분할 때만)
    if (timelineScale >= 1) {
      const startMinor = Math.max(
        0,
        Math.floor(visibleStartTime / minorInterval) * minorInterval
      );
      const endMinor =
        Math.ceil(visibleEndTime / minorInterval) * minorInterval;

      for (let time = startMinor; time <= endMinor; time += minorInterval) {
        if (time < 0) continue;

        // 고정 기준점 기준으로 x 좌표 계산
        const x = time * pixelsPerSecond;
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

    return markers.sort((a, b) => a.time - b.time);
  }, [
    timelineMode,
    video.currentTime,
    timelineOffset,
    pixelsPerSecond,
    timelineScale,
    timelineWidth,
  ]);

  // 현재 재생 위치 플레이헤드 스타일
  const playheadStyle = useMemo(() => {
    if (timelineMode === "centered") {
      // Centered 모드에서는 플레이헤드가 중앙에 고정
      return {
        transform: `translate3d(${centerX}px, 0, 0)`,
        visibility: "visible" as "visible" | "hidden",
      };
    } else {
      // Free 모드에서는 기존 방식
      const x = getXFromTime(
        video.currentTime,
        effectiveTimelineOffset,
        pixelsPerSecond
      );
      return {
        transform: `translate3d(${x}px, 0, 0)`,
        visibility: (x >= -2 && x <= timelineWidth + 2
          ? "visible"
          : "hidden") as "visible" | "hidden",
      };
    }
  }, [
    timelineMode,
    centerX,
    video.currentTime,
    effectiveTimelineOffset,
    pixelsPerSecond,
    timelineWidth,
  ]);

  // 타임라인 클릭 핸들러
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return;

      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      let time: number;

      if (timelineMode === "centered") {
        // Centered 모드에서는 중앙 기준으로 시간 계산
        const offsetFromCenter = x - centerX;
        time = Math.max(
          0,
          video.currentTime + offsetFromCenter / pixelsPerSecond
        );
      } else {
        // Free 모드에서는 timelineOffset 기준으로 계산
        time = Math.max(0, timelineOffset + x / pixelsPerSecond);
      }

      setCurrentTime(time);
    },
    [
      isDragging,
      timelineMode,
      centerX,
      video.currentTime,
      pixelsPerSecond,
      timelineOffset,
      setCurrentTime,
    ]
  );

  // 더블클릭으로 새 자막 추가
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      let time: number;

      if (timelineMode === "centered") {
        // Centered 모드에서는 중앙 기준으로 시간 계산
        const offsetFromCenter = x - centerX;
        time = Math.max(
          0,
          video.currentTime + offsetFromCenter / pixelsPerSecond
        );
      } else {
        // Free 모드에서는 timelineOffset 기준으로 계산
        time = Math.max(0, timelineOffset + x / pixelsPerSecond);
      }

      const newSubtitle = {
        startTime: time,
        endTime: time + 2,
        text: "새 자막",
      };

      addSubtitle(newSubtitle);
      selectSubtitle(Date.now().toString()); // 임시 ID, 실제로는 addSubtitle에서 반환된 ID를 사용해야 함
    },
    [
      timelineMode,
      centerX,
      video.currentTime,
      pixelsPerSecond,
      timelineOffset,
      addSubtitle,
      selectSubtitle,
    ]
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
          <div
            className="absolute top-0 left-0 w-full h-8 border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
            style={{ transform: subtitleContainerTransform }}
          >
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
            style={{
              height: `${dynamicTimelineHeight - 32}px`,
              transform: subtitleContainerTransform,
            }}
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
                // 자막이 0초 미만에서 시작하거나 끝나면 렌더링하지 않음
                if (subtitle.endTime < 0) return null;

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
                    timelineOffset={0} // 항상 0으로 고정 (컨테이너가 이동하므로)
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

          {/* Centered 모드에서 중앙 참조선 */}
          {timelineMode === "centered" && (
            <div
              className="absolute top-0 w-px bg-red-400 dark:bg-red-500 pointer-events-none z-5 opacity-30"
              style={{
                height: `${dynamicTimelineHeight}px`,
                left: `${centerX}px`,
              }}
            >
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-400 dark:bg-red-500 rounded-full opacity-50" />
            </div>
          )}

          {/* 동영상 길이를 넘어가는 부분 딤드 처리 */}
          {video.duration &&
            (() => {
              // 고정 좌표계에서 동영상 끝 위치 계산
              const videoDurationX = video.duration * pixelsPerSecond;

              // 현재 보이는 영역에서 동영상 끝 위치 계산
              let visibleVideoDurationX: number;
              if (timelineMode === "centered") {
                visibleVideoDurationX =
                  videoDurationX -
                  video.currentTime * pixelsPerSecond +
                  centerX;
              } else {
                visibleVideoDurationX =
                  videoDurationX - timelineOffset * pixelsPerSecond;
              }

              if (
                visibleVideoDurationX < timelineWidth &&
                visibleVideoDurationX > 0
              ) {
                return (
                  <div
                    className="absolute top-0 bg-gray-900/20 dark:bg-gray-100/10 pointer-events-none z-5"
                    style={{
                      left: `${Math.max(0, visibleVideoDurationX)}px`,
                      width: `${
                        timelineWidth - Math.max(0, visibleVideoDurationX)
                      }px`,
                      height: `${dynamicTimelineHeight}px`,
                    }}
                  >
                    <div className="absolute left-0 top-0 w-0.5 h-full bg-orange-500 dark:bg-orange-400 opacity-60" />
                  </div>
                );
              }
              return null;
            })()}

          {/* 0초 아래 부분 딤드 처리 */}
          {(() => {
            // 현재 보이는 영역에서 0초 위치 계산
            let visibleZeroX: number;
            if (timelineMode === "centered") {
              visibleZeroX = -video.currentTime * pixelsPerSecond + centerX;
            } else {
              visibleZeroX = -timelineOffset * pixelsPerSecond;
            }

            if (visibleZeroX > 0 && visibleZeroX < timelineWidth) {
              return (
                <div
                  className="absolute top-0 bg-gray-900/30 dark:bg-gray-100/20 pointer-events-none z-5"
                  style={{
                    left: "0px",
                    width: `${Math.min(timelineWidth, visibleZeroX)}px`,
                    height: `${dynamicTimelineHeight}px`,
                  }}
                >
                  <div className="absolute right-0 top-0 w-0.5 h-full bg-red-500 dark:bg-red-400 opacity-60" />
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>
    </div>
  );
});
