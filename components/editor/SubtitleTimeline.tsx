"use client";

import { useRef, useEffect, useState, useCallback, useMemo, memo } from "react";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";
import type { SubtitleItem } from "@/lib/stores/subtitle-store";

// 개별 자막 바 컴포넌트 (메모이제이션)
const SubtitleBar = memo(
  ({
    subtitle,
    isSelected,
    isDragging,
    timelineOffset,
    PIXELS_PER_SECOND,
    SUBTITLE_HEIGHT,
    layerIndex,
    SUBTITLE_MARGIN,
    tempPosition,
    onMouseDown,
    onResizeHandleMouseDown,
  }: {
    subtitle: SubtitleItem;
    isSelected: boolean;
    isDragging: boolean;
    timelineOffset: number;
    PIXELS_PER_SECOND: number;
    SUBTITLE_HEIGHT: number;
    layerIndex: number;
    SUBTITLE_MARGIN: number;
    tempPosition?: { startTime: number; endTime: number } | null;
    onMouseDown: (e: React.MouseEvent, subtitleId: string) => void;
    onResizeHandleMouseDown: (
      e: React.MouseEvent,
      subtitleId: string,
      handle: "start" | "end"
    ) => void;
  }) => {
    // 드래그 중이면 임시 위치 사용, 아니면 원래 위치 사용
    const effectiveStartTime = tempPosition?.startTime ?? subtitle.startTime;
    const effectiveEndTime = tempPosition?.endTime ?? subtitle.endTime;

    const startX = (effectiveStartTime - timelineOffset) * PIXELS_PER_SECOND;
    const width = (effectiveEndTime - effectiveStartTime) * PIXELS_PER_SECOND;
    const y = 25 + layerIndex * (SUBTITLE_HEIGHT + SUBTITLE_MARGIN);

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
          height: SUBTITLE_HEIGHT,
          pointerEvents: "auto",
          willChange: isDragging ? "transform, left, width" : "auto",
          transition: isDragging ? "none" : "all 0.1s ease",
          backfaceVisibility: "hidden", // GPU 가속 최적화
          perspective: 1000, // 3D 가속 활성화
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

export function SubtitleTimeline() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const currentTimeLineRef = useRef<HTMLDivElement>(null);

  const {
    subtitles,
    selectedSubtitleId,
    timelineScale,
    timelineOffset,
    setTimelineScale,
    setTimelineOffset,
    selectSubtitle,
    updateSubtitle,
  } = useSubtitleStore();

  const { video, setCurrentTime } = useVideoStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedSubtitle, setDraggedSubtitle] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<"start" | "end" | null>(
    null
  );
  const [tempSubtitlePosition, setTempSubtitlePosition] = useState<{
    id: string;
    startTime: number;
    endTime: number;
  } | null>(null);
  const [originalSubtitlePosition, setOriginalSubtitlePosition] = useState<{
    startTime: number;
    endTime: number;
  } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dragUpdateFrameRef = useRef<number | null>(null);
  const handleMouseMoveRef = useRef<((e: MouseEvent) => void) | null>(null);
  const handleMouseUpRef = useRef<(() => void) | null>(null);
  const lastDragUpdateRef = useRef<number>(0);

  // Timeline scaling constants
  const PIXELS_PER_SECOND = 50 * timelineScale;
  const TIMELINE_HEIGHT = 120;
  const SUBTITLE_HEIGHT = 30;
  const SUBTITLE_MARGIN = 2;

  // 현재 시간 라인 위치 업데이트 (requestAnimationFrame 사용)
  useEffect(() => {
    const updateTimelinePosition = () => {
      if (currentTimeLineRef.current) {
        const x = (video.currentTime - timelineOffset) * PIXELS_PER_SECOND;
        // transform3d를 사용하여 GPU 가속 적용
        currentTimeLineRef.current.style.transform = `translate3d(${x}px, 0, 0)`;
      }

      // 비디오가 재생 중일 때만 연속 업데이트
      if (video.isPlaying) {
        animationFrameRef.current = requestAnimationFrame(
          updateTimelinePosition
        );
      }
    };

    // 즉시 한 번 업데이트
    updateTimelinePosition();

    // cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (dragUpdateFrameRef.current) {
        cancelAnimationFrame(dragUpdateFrameRef.current);
      }
    };
  }, [video.currentTime, video.isPlaying, timelineOffset, PIXELS_PER_SECOND]);

  // 자동 스크롤 (별도로 처리)
  useEffect(() => {
    const timelineRect = timelineRef.current?.getBoundingClientRect();
    if (timelineRect && video.isPlaying) {
      // 재생 중일 때만 자동 스크롤
      const currentTimeX =
        (video.currentTime - timelineOffset) * PIXELS_PER_SECOND;
      const timelineWidth = timelineRect.width;

      if (currentTimeX < 50) {
        // 왼쪽 여유분
        setTimelineOffset(Math.max(0, video.currentTime - 2));
      } else if (currentTimeX > timelineWidth - 50) {
        // 오른쪽 여유분
        setTimelineOffset(
          video.currentTime - timelineWidth / PIXELS_PER_SECOND + 2
        );
      }
    }
  }, [video.currentTime, video.isPlaying, timelineOffset, PIXELS_PER_SECOND]);

  const formatTimelineTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeFromX = (x: number): number => {
    return timelineOffset + x / PIXELS_PER_SECOND;
  };

  // 시간 눈금 생성 (메모이제이션)
  const timeMarkers = useMemo(() => {
    const timelineRect = timelineRef.current?.getBoundingClientRect();
    if (!timelineRect) return { major: [], minor: [] };

    const startTime = timelineOffset;
    const endTime = startTime + timelineRect.width / PIXELS_PER_SECOND;
    const majorMarkers = [];
    const minorMarkers = [];

    // 주요 눈금 (1초 간격)
    for (let time = Math.floor(startTime); time <= Math.ceil(endTime); time++) {
      const x = (time - startTime) * PIXELS_PER_SECOND;
      if (x >= -50 && x <= timelineRect.width + 50) {
        majorMarkers.push({ time, x });
      }
    }

    // 보조 눈금 (0.5초 간격, 줌이 클 때만)
    if (timelineScale >= 1) {
      for (
        let time = Math.floor(startTime * 2) / 2;
        time <= Math.ceil(endTime * 2) / 2;
        time += 0.5
      ) {
        if (time % 1 !== 0) {
          // 1초 단위가 아닌 것만
          const x = (time - startTime) * PIXELS_PER_SECOND;
          if (x >= -50 && x <= timelineRect.width + 50) {
            minorMarkers.push({ time, x });
          }
        }
      }
    }

    return { major: majorMarkers, minor: minorMarkers };
  }, [timelineOffset, PIXELS_PER_SECOND, timelineScale]);

  // 자막을 레이어별로 배치 (메모이제이션)
  const layers = useMemo(() => {
    const arrangedLayers: SubtitleItem[][] = [];
    const sortedSubtitles = [...subtitles].sort(
      (a, b) => a.startTime - b.startTime
    );

    sortedSubtitles.forEach((subtitle) => {
      let placed = false;

      for (let i = 0; i < arrangedLayers.length; i++) {
        const layer = arrangedLayers[i];
        const lastSubtitle = layer[layer.length - 1];

        if (!lastSubtitle || lastSubtitle.endTime <= subtitle.startTime) {
          layer.push(subtitle);
          placed = true;
          break;
        }
      }

      if (!placed) {
        arrangedLayers.push([subtitle]);
      }
    });

    return arrangedLayers;
  }, [subtitles]);

  // 화면에 보이는 자막만 필터링 (가상화)
  const visibleSubtitles = useMemo(() => {
    const timelineWidth = timelineRef.current?.clientWidth || 1000;
    const visibleStartTime = timelineOffset - 1; // 1초 여유분
    const visibleEndTime =
      timelineOffset + timelineWidth / PIXELS_PER_SECOND + 1; // 1초 여유분

    return layers.map((layer) =>
      layer.filter(
        (subtitle) =>
          subtitle.endTime >= visibleStartTime &&
          subtitle.startTime <= visibleEndTime
      )
    );
  }, [layers, timelineOffset, PIXELS_PER_SECOND]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const time = getTimeFromX(x);
    const clampedTime = Math.max(0, Math.min(time, video.duration || 0));
    setCurrentTime(clampedTime);
  };

  const handleSubtitleMouseDown = useCallback(
    (e: React.MouseEvent, subtitleId: string, handle?: "start" | "end") => {
      e.preventDefault();
      e.stopPropagation();

      const subtitle = subtitles.find((s) => s.id === subtitleId);
      if (!subtitle) return;

      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setDraggedSubtitle(subtitleId);
      setResizeHandle(handle || null);
      setOriginalSubtitlePosition({
        startTime: subtitle.startTime,
        endTime: subtitle.endTime,
      });
      selectSubtitle(subtitleId);
    },
    [subtitles, selectSubtitle]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !draggedSubtitle || !originalSubtitlePosition) return;

      // throttling: 고성능으로 더 자주 업데이트 (120fps)
      const now = performance.now();
      if (now - lastDragUpdateRef.current < 8) return;
      lastDragUpdateRef.current = now;

      const deltaX = e.clientX - dragStart.x;
      const deltaTime = deltaX / PIXELS_PER_SECOND;

      let newStartTime: number;
      let newEndTime: number;

      if (resizeHandle === "start") {
        newStartTime = Math.max(
          0,
          originalSubtitlePosition.startTime + deltaTime
        );
        newEndTime = originalSubtitlePosition.endTime;
        if (newStartTime >= newEndTime) {
          newStartTime = newEndTime - 0.1;
        }
      } else if (resizeHandle === "end") {
        newStartTime = originalSubtitlePosition.startTime;
        newEndTime = Math.max(
          originalSubtitlePosition.startTime + 0.1,
          originalSubtitlePosition.endTime + deltaTime
        );
      } else {
        const duration =
          originalSubtitlePosition.endTime - originalSubtitlePosition.startTime;
        newStartTime = Math.max(
          0,
          originalSubtitlePosition.startTime + deltaTime
        );
        newEndTime = newStartTime + duration;
      }

      // React 상태를 직접 동기적으로 업데이트 (빠른 응답성)
      setTempSubtitlePosition({
        id: draggedSubtitle,
        startTime: newStartTime,
        endTime: newEndTime,
      });
    },
    [
      isDragging,
      draggedSubtitle,
      dragStart.x,
      PIXELS_PER_SECOND,
      resizeHandle,
      originalSubtitlePosition,
    ]
  );

  const handleMouseUp = useCallback(() => {
    // 드래그 완료 시에만 스토어 업데이트
    if (tempSubtitlePosition && draggedSubtitle) {
      updateSubtitle(draggedSubtitle, {
        startTime: tempSubtitlePosition.startTime,
        endTime: tempSubtitlePosition.endTime,
      });
    }

    // 상태 초기화
    setIsDragging(false);
    setDraggedSubtitle(null);
    setResizeHandle(null);
    setTempSubtitlePosition(null);
    setOriginalSubtitlePosition(null);

    // 애니메이션 프레임 정리
    if (dragUpdateFrameRef.current) {
      cancelAnimationFrame(dragUpdateFrameRef.current);
      dragUpdateFrameRef.current = null;
    }
  }, [tempSubtitlePosition, draggedSubtitle, updateSubtitle]);

  // handleMouseMove와 handleMouseUp을 ref에 저장
  handleMouseMoveRef.current = handleMouseMove;
  handleMouseUpRef.current = handleMouseUp;

  useEffect(() => {
    if (isDragging) {
      const mouseMoveHandler = (e: MouseEvent) => {
        handleMouseMoveRef.current?.(e);
      };
      const mouseUpHandler = () => {
        handleMouseUpRef.current?.();
      };

      document.addEventListener("mousemove", mouseMoveHandler);
      document.addEventListener("mouseup", mouseUpHandler);

      return () => {
        document.removeEventListener("mousemove", mouseMoveHandler);
        document.removeEventListener("mouseup", mouseUpHandler);
      };
    }
  }, [isDragging]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return; // 입력 필드에서는 무시
      }

      switch (e.key) {
        case "Delete":
        case "Backspace":
          if (selectedSubtitleId) {
            // 자막 삭제는 SubtitleEditor에서 처리하도록 이벤트 전파
            return;
          }
          break;
        case "Escape":
          selectSubtitle(null);
          break;
        case "ArrowLeft":
          if (e.shiftKey && selectedSubtitleId) {
            // 자막을 0.1초 앞으로 이동
            const subtitle = subtitles.find((s) => s.id === selectedSubtitleId);
            if (subtitle) {
              const duration = subtitle.endTime - subtitle.startTime;
              const newStartTime = Math.max(0, subtitle.startTime - 0.1);
              updateSubtitle(selectedSubtitleId, {
                startTime: newStartTime,
                endTime: newStartTime + duration,
              });
            }
            e.preventDefault();
          }
          break;
        case "ArrowRight":
          if (e.shiftKey && selectedSubtitleId) {
            // 자막을 0.1초 뒤로 이동
            const subtitle = subtitles.find((s) => s.id === selectedSubtitleId);
            if (subtitle) {
              const duration = subtitle.endTime - subtitle.startTime;
              const newStartTime = subtitle.startTime + 0.1;
              updateSubtitle(selectedSubtitleId, {
                startTime: newStartTime,
                endTime: newStartTime + duration,
              });
            }
            e.preventDefault();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedSubtitleId, subtitles, selectSubtitle, updateSubtitle]);

  // 휠 이벤트 핸들러 (non-passive로 등록하기 위해 useEffect 사용)
  useEffect(() => {
    const timelineElement = timelineRef.current;
    if (!timelineElement) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        // Zoom (마우스 포인터 위치를 중심으로 줌)
        const rect = timelineElement.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseTime = getTimeFromX(mouseX);

        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1; // 줌 속도도 조금 줄임
        const newScale = Math.max(0.5, Math.min(5, timelineScale * zoomFactor));

        // 마우스 위치를 중심으로 줌하도록 오프셋 조정
        const newMouseTime = mouseTime;
        const newMouseX = mouseX;
        const newOffset = newMouseTime - newMouseX / (50 * newScale);

        setTimelineScale(newScale);
        setTimelineOffset(Math.max(0, newOffset));
      } else {
        // 스크롤 (위아래 및 좌우 모두 처리)
        const rect = timelineElement.getBoundingClientRect();

        // 델타 값을 정규화 (다양한 브라우저/디바이스 호환성)
        let deltaY = e.deltaY;
        let deltaX = e.deltaX;

        if (e.deltaMode === 1) {
          // DOM_DELTA_LINE
          deltaY *= 33;
          deltaX *= 33;
        } else if (e.deltaMode === 2) {
          // DOM_DELTA_PAGE
          deltaY *= rect.height;
          deltaX *= rect.width;
        }

        // 스크롤 속도 조정 (좀 더 느리게)
        const baseScrollSpeed = 1; // 기본 스크롤 속도 (3에서 1로 줄임)
        const fastScrollThreshold = 100; // 빠른 스크롤 임계값

        // 주 스크롤 방향 결정 (deltaY가 더 크면 세로 스크롤, deltaX가 더 크면 가로 스크롤)
        const isDeltaYDominant = Math.abs(deltaY) > Math.abs(deltaX);
        const primaryDelta = isDeltaYDominant ? deltaY : deltaX;

        let scrollSpeed;
        if (Math.abs(primaryDelta) > fastScrollThreshold) {
          scrollSpeed = baseScrollSpeed * 1.5; // 빠른 스크롤 (2에서 1.5로 줄임)
        } else {
          scrollSpeed = baseScrollSpeed; // 일반 스크롤
        }

        // 세로 스크롤 또는 가로 스크롤이 없을 때는 세로를 가로로 변환
        let scrollDirection;
        if (deltaX !== 0) {
          // 가로 스크롤이 있으면 가로 스크롤 우선
          scrollDirection = deltaX > 0 ? 1 : -1;
        } else {
          // 세로 스크롤을 가로 스크롤로 변환
          scrollDirection = deltaY > 0 ? 1 : -1;
        }

        const scrollTime = scrollSpeed * scrollDirection;

        const newOffset = Math.max(0, timelineOffset + scrollTime);
        const maxOffset = Math.max(
          0,
          (video.duration || 0) - rect.width / PIXELS_PER_SECOND
        );

        setTimelineOffset(Math.min(newOffset, maxOffset));
      }
    };

    // non-passive 이벤트 리스너로 등록
    timelineElement.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      timelineElement.removeEventListener("wheel", handleWheel);
    };
  }, [
    timelineOffset,
    timelineScale,
    getTimeFromX,
    PIXELS_PER_SECOND,
    video.duration,
    setTimelineScale,
    setTimelineOffset,
  ]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Timeline
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Zoom:
            </span>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              value={timelineScale}
              onChange={(e) => setTimelineScale(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round(timelineScale * 100)}%
            </span>
          </div>
        </div>
      </div>

      <div
        ref={timelineRef}
        className="relative border border-gray-300 dark:border-gray-600 rounded overflow-hidden cursor-pointer select-none"
        style={{
          height: TIMELINE_HEIGHT,
          touchAction: "none", // 터치 스크롤 방지
          userSelect: "none", // 텍스트 선택 방지
        }}
        onClick={handleTimelineClick}
        tabIndex={0} // 키보드 포커스 가능하도록
      >
        {/* 배경 */}
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700"></div>

        {/* 시간 눈금 */}
        <div className="absolute top-0 left-0 w-full h-6 pointer-events-none">
          {/* 주요 눈금 (1초) */}
          {timeMarkers.major.map(({ time, x }) => (
            <div key={`major-${time}`} className="absolute" style={{ left: x }}>
              <div className="w-px h-5 bg-gray-400 dark:bg-gray-500"></div>
              <div
                className="text-xs text-gray-600 dark:text-gray-400 ml-1"
                style={{ marginTop: "2px" }}
              >
                {formatTimelineTime(time)}
              </div>
            </div>
          ))}
          {/* 보조 눈금 (0.5초) */}
          {timeMarkers.minor.map(({ time, x }) => (
            <div key={`minor-${time}`} className="absolute" style={{ left: x }}>
              <div className="w-px h-3 bg-gray-300 dark:bg-gray-600"></div>
            </div>
          ))}
        </div>

        {/* 자막 바들 */}
        {visibleSubtitles.map((layer, layerIndex) =>
          layer.map((subtitle) => {
            const isSelected = selectedSubtitleId === subtitle.id;

            return (
              <SubtitleBar
                key={subtitle.id}
                subtitle={subtitle}
                isSelected={isSelected}
                isDragging={isDragging && draggedSubtitle === subtitle.id}
                timelineOffset={timelineOffset}
                PIXELS_PER_SECOND={PIXELS_PER_SECOND}
                SUBTITLE_HEIGHT={SUBTITLE_HEIGHT}
                layerIndex={layerIndex}
                SUBTITLE_MARGIN={SUBTITLE_MARGIN}
                tempPosition={
                  tempSubtitlePosition?.id === subtitle.id
                    ? {
                        startTime: tempSubtitlePosition.startTime,
                        endTime: tempSubtitlePosition.endTime,
                      }
                    : null
                }
                onMouseDown={handleSubtitleMouseDown}
                onResizeHandleMouseDown={(e, id, handle) =>
                  handleSubtitleMouseDown(e, id, handle)
                }
              />
            );
          })
        )}

        {/* 현재 시간 라인 */}
        <div
          ref={currentTimeLineRef}
          className="absolute top-0 w-0.5 bg-red-500 pointer-events-none transition-transform duration-75 ease-linear"
          style={{
            height: TIMELINE_HEIGHT,
            willChange: "transform", // GPU 가속을 위한 힌트
          }}
        >
          <div className="absolute -bottom-4 -left-8 text-xs text-red-500 font-bold whitespace-nowrap">
            {formatTimelineTime(video.currentTime)}
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        <div>
          Ctrl/Cmd + Wheel: Zoom (around mouse cursor) | Wheel (↕/↔): Scroll
          timeline | Drag: Move/Resize Subtitles
        </div>
        <div>Shift + ←/→: Move selected subtitle | Esc: Deselect</div>
      </div>
    </div>
  );
}
