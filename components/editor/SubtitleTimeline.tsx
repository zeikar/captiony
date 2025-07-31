"use client";

import React, { useRef } from "react";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { SubtitleBar } from "./components/SubtitleBar";
import { TimelineControls } from "./components/TimelineControls";
import { useSubtitleDrag } from "./hooks/useSubtitleDrag";
import { useTimelineWheel } from "./hooks/useTimelineWheel";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { formatTime, getTimeFromX, getXFromTime } from "./utils/timelineUtils";
import { useMemo, useCallback } from "react";

export const SubtitleTimeline: React.FC = React.memo(() => {
  const timelineRef = useRef<HTMLDivElement>(null);

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

  // Constants
  const basePixelsPerSecond = 50;
  const pixelsPerSecond = basePixelsPerSecond * timelineScale;
  const timelineHeight = 120;

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

  // 시간 눈금 생성
  const timeMarkers = useMemo(() => {
    if (!timelineRef.current) return [];

    const timelineWidth = timelineRef.current.clientWidth;
    const startTime = timelineOffset;
    const endTime = timelineOffset + timelineWidth / pixelsPerSecond;
    const markers = [];

    // 간격 결정 (줌 레벨에 따라)
    let interval = 1;
    if (timelineScale < 0.5) {
      interval = 10;
    } else if (timelineScale < 1) {
      interval = 5;
    } else if (timelineScale > 3) {
      interval = 0.5;
    }

    const startMarker = Math.floor(startTime / interval) * interval;
    const endMarker = Math.ceil(endTime / interval) * interval;

    for (let time = startMarker; time <= endMarker; time += interval) {
      const x = getXFromTime(time, timelineOffset, pixelsPerSecond);
      if (x >= -50 && x <= timelineWidth + 50) {
        markers.push({
          time,
          x,
          label: formatTime(time),
          isSecond: time % 1 === 0,
        });
      }
    }

    return markers;
  }, [timelineOffset, pixelsPerSecond, timelineScale]);

  // 현재 재생 위치 플레이헤드 스타일
  const playheadStyle = useMemo(() => {
    const x = getXFromTime(video.currentTime, timelineOffset, pixelsPerSecond);
    return {
      transform: `translate3d(${x}px, 0, 0)`,
      visibility: (x >= -2 && x <= (timelineRef.current?.clientWidth || 0) + 2
        ? "visible"
        : "hidden") as "visible" | "hidden",
    };
  }, [video.currentTime, timelineOffset, pixelsPerSecond]);

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
    <div className="w-full bg-gray-900 text-white">
      {/* 컨트롤 바 */}
      <TimelineControls
        timelineScale={timelineScale}
        onScaleChange={setTimelineScale}
        onFitToView={() => {
          if (!timelineRef.current || !video.duration) return;
          const timelineWidth = timelineRef.current.clientWidth;
          const newScale =
            timelineWidth / (video.duration * basePixelsPerSecond);
          const clampedScale = Math.max(0.5, Math.min(5, newScale));
          setTimelineScale(clampedScale);
          setTimelineOffset(0);
        }}
        onResetZoom={() => setTimelineScale(1)}
      />

      {/* 타임라인 */}
      <div
        ref={timelineRef}
        className="relative bg-gray-800 cursor-pointer select-none"
        style={{ height: `${timelineHeight}px` }}
        onClick={handleTimelineClick}
        onDoubleClick={handleDoubleClick}
      >
        {/* 시간 눈금 */}
        <div className="absolute top-0 left-0 w-full h-8 border-b border-gray-600">
          {timeMarkers.map((marker, index) => (
            <div
              key={index}
              className="absolute top-0"
              style={{ left: `${marker.x}px` }}
            >
              <div
                className={`w-px bg-gray-500 ${
                  marker.isSecond ? "h-6" : "h-3"
                }`}
              />
              {marker.isSecond && (
                <div className="absolute top-6 left-1 text-xs text-gray-400 whitespace-nowrap">
                  {marker.label}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 자막 바들 */}
        <div
          className="absolute top-8 left-0 w-full"
          style={{ height: `${timelineHeight - 32}px` }}
        >
          {subtitles.map((subtitle) => {
            // 드래그 중인 자막의 임시 위치 확인
            const tempPos =
              tempSubtitlePosition && tempSubtitlePosition.id === subtitle.id
                ? {
                    startTime: tempSubtitlePosition.startTime,
                    endTime: tempSubtitlePosition.endTime,
                  }
                : null;

            return (
              <SubtitleBar
                key={subtitle.id}
                subtitle={subtitle}
                timelineOffset={timelineOffset}
                pixelsPerSecond={pixelsPerSecond}
                isSelected={subtitle.id === selectedSubtitleId}
                tempPosition={tempPos}
                onMouseDown={handleMouseDown}
              />
            );
          })}
        </div>

        {/* 플레이헤드 */}
        <div
          className="absolute top-0 w-0.5 bg-red-500 pointer-events-none z-10"
          style={{
            height: `${timelineHeight}px`,
            ...playheadStyle,
          }}
        >
          <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-sm" />
        </div>
      </div>
    </div>
  );
});
