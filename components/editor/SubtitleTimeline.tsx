"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import type { SubtitleItem } from "@/lib/stores/subtitle-store";

export function SubtitleTimeline() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const currentTimeLineRef = useRef<HTMLDivElement>(null);

  const {
    video,
    subtitles,
    selectedSubtitleId,
    timelineScale,
    timelineOffset,
    setCurrentTime,
    setTimelineScale,
    setTimelineOffset,
    selectSubtitle,
    updateSubtitle,
  } = useSubtitleStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedSubtitle, setDraggedSubtitle] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<"start" | "end" | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Timeline scaling constants
  const PIXELS_PER_SECOND = 50 * timelineScale;
  const TIMELINE_HEIGHT = 120;
  const SUBTITLE_HEIGHT = 30;
  const SUBTITLE_MARGIN = 2;

  // 현재 시간 라인 위치 업데이트 (throttled)
  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 16) return; // 60fps 제한
    lastUpdateRef.current = now;

    if (currentTimeLineRef.current) {
      const x = (video.currentTime - timelineOffset) * PIXELS_PER_SECOND;
      currentTimeLineRef.current.style.transform = `translateX(${x}px)`;
    }
  }, [video.currentTime, timelineOffset, PIXELS_PER_SECOND]);

  // 자동 스크롤 (별도로 처리)
  useEffect(() => {
    const timelineRect = timelineRef.current?.getBoundingClientRect();
    if (timelineRect && video.isPlaying) { // 재생 중일 때만 자동 스크롤
      const currentTimeX = (video.currentTime - timelineOffset) * PIXELS_PER_SECOND;
      const timelineWidth = timelineRect.width;

      if (currentTimeX < 50) { // 왼쪽 여유분
        setTimelineOffset(Math.max(0, video.currentTime - 2));
      } else if (currentTimeX > timelineWidth - 50) { // 오른쪽 여유분
        setTimelineOffset(video.currentTime - timelineWidth / PIXELS_PER_SECOND + 2);
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

  // 시간 눈금 생성
  const generateTimeMarkers = () => {
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
      for (let time = Math.floor(startTime * 2) / 2; time <= Math.ceil(endTime * 2) / 2; time += 0.5) {
        if (time % 1 !== 0) { // 1초 단위가 아닌 것만
          const x = (time - startTime) * PIXELS_PER_SECOND;
          if (x >= -50 && x <= timelineRect.width + 50) {
            minorMarkers.push({ time, x });
          }
        }
      }
    }

    return { major: majorMarkers, minor: minorMarkers };
  };

  // 자막을 레이어별로 배치
  const arrangeSubtitlesInLayers = (subtitles: SubtitleItem[]): SubtitleItem[][] => {
    const layers: SubtitleItem[][] = [];
    const sortedSubtitles = [...subtitles].sort((a, b) => a.startTime - b.startTime);

    sortedSubtitles.forEach((subtitle) => {
      let placed = false;

      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        const lastSubtitle = layer[layer.length - 1];

        if (!lastSubtitle || lastSubtitle.endTime <= subtitle.startTime) {
          layer.push(subtitle);
          placed = true;
          break;
        }
      }

      if (!placed) {
        layers.push([subtitle]);
      }
    });

    return layers;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const time = getTimeFromX(x);
    const clampedTime = Math.max(0, Math.min(time, video.duration || 0));
    setCurrentTime(clampedTime);
  };

  const handleSubtitleMouseDown = (e: React.MouseEvent, subtitleId: string, handle?: "start" | "end") => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDraggedSubtitle(subtitleId);
    setResizeHandle(handle || null);
    selectSubtitle(subtitleId);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggedSubtitle) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaTime = deltaX / PIXELS_PER_SECOND;

    const subtitle = subtitles.find((s) => s.id === draggedSubtitle);
    if (!subtitle) return;

    if (resizeHandle === "start") {
      const newStartTime = Math.max(0, subtitle.startTime + deltaTime);
      if (newStartTime < subtitle.endTime) {
        updateSubtitle(subtitle.id, { startTime: newStartTime });
      }
    } else if (resizeHandle === "end") {
      const newEndTime = Math.max(subtitle.startTime + 0.1, subtitle.endTime + deltaTime);
      updateSubtitle(subtitle.id, { endTime: newEndTime });
    } else {
      const duration = subtitle.endTime - subtitle.startTime;
      const newStartTime = Math.max(0, subtitle.startTime + deltaTime);
      updateSubtitle(subtitle.id, {
        startTime: newStartTime,
        endTime: newStartTime + duration,
      });
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, draggedSubtitle, dragStart, PIXELS_PER_SECOND, subtitles, resizeHandle, updateSubtitle]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedSubtitle(null);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
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
            const subtitle = subtitles.find(s => s.id === selectedSubtitleId);
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
            const subtitle = subtitles.find(s => s.id === selectedSubtitleId);
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

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.5, Math.min(3, timelineScale * zoomFactor));
      setTimelineScale(newScale);
    } else {
      // Scroll
      const scrollSpeed = 2;
      const newOffset = Math.max(0, timelineOffset + (e.deltaY > 0 ? scrollSpeed : -scrollSpeed));
      setTimelineOffset(newOffset);
    }
  };

  const layers = arrangeSubtitlesInLayers(subtitles);
  const timeMarkers = generateTimeMarkers();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Timeline
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Zoom:</span>
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
        style={{ height: TIMELINE_HEIGHT }}
        onClick={handleTimelineClick}
        onWheel={handleWheel}
      >
        {/* 배경 */}
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700"></div>

        {/* 시간 눈금 */}
        <div className="absolute top-0 left-0 w-full h-6 pointer-events-none">
          {/* 주요 눈금 (1초) */}
          {timeMarkers.major.map(({ time, x }) => (
            <div key={`major-${time}`} className="absolute" style={{ left: x }}>
              <div className="w-px h-5 bg-gray-400 dark:bg-gray-500"></div>
              <div className="text-xs text-gray-600 dark:text-gray-400 ml-1" style={{ marginTop: '2px' }}>
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
        {layers.map((layer, layerIndex) =>
          layer.map((subtitle) => {
            const startX = (subtitle.startTime - timelineOffset) * PIXELS_PER_SECOND;
            const width = (subtitle.endTime - subtitle.startTime) * PIXELS_PER_SECOND;
            const y = 25 + layerIndex * (SUBTITLE_HEIGHT + SUBTITLE_MARGIN);
            const isSelected = selectedSubtitleId === subtitle.id;

            // 화면에 보이는 자막만 렌더링
            if (startX + width < 0 || startX > (timelineRef.current?.clientWidth || 0)) {
              return null;
            }

            return (
              <div
                key={subtitle.id}
                className={`absolute rounded cursor-pointer transition-all duration-150 border text-white text-xs overflow-hidden group ${
                  isSelected
                    ? "bg-blue-500 border-blue-700 shadow-lg z-10"
                    : "bg-gray-500 hover:bg-gray-600 border-gray-600 hover:shadow-md hover:z-10"
                }`}
                style={{
                  left: Math.max(0, startX),
                  top: y,
                  width: startX < 0 ? width + startX : width,
                  height: SUBTITLE_HEIGHT,
                  minWidth: 1,
                }}
                onMouseDown={(e) => handleSubtitleMouseDown(e, subtitle.id)}
                title={subtitle.text} // 툴팁으로 전체 텍스트 표시
              >
                {/* 자막 텍스트 */}
                <div className="px-2 py-1 truncate h-full flex items-center">
                  {subtitle.text.length > 15
                    ? subtitle.text.substring(0, 15) + "..."
                    : subtitle.text}
                </div>

                {/* 리사이즈 핸들 (선택된 자막만) */}
                {isSelected && (
                  <>
                    {/* 시작 핸들 */}
                    <div
                      className="absolute left-0 top-0 w-1 h-full bg-blue-700 cursor-ew-resize hover:bg-blue-600"
                      onMouseDown={(e) => handleSubtitleMouseDown(e, subtitle.id, "start")}
                    ></div>
                    {/* 끝 핸들 */}
                    <div
                      className="absolute right-0 top-0 w-1 h-full bg-blue-700 cursor-ew-resize hover:bg-blue-600"
                      onMouseDown={(e) => handleSubtitleMouseDown(e, subtitle.id, "end")}
                    ></div>
                  </>
                )}
              </div>
            );
          })
        )}

        {/* 현재 시간 라인 */}
        <div
          ref={currentTimeLineRef}
          className="absolute top-0 w-0.5 bg-red-500 pointer-events-none"
          style={{ height: TIMELINE_HEIGHT }}
        >
          <div className="absolute -bottom-4 -left-8 text-xs text-red-500 font-bold whitespace-nowrap">
            {formatTimelineTime(video.currentTime)}
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        <div>Ctrl/Cmd + Wheel: Zoom | Wheel: Scroll | Drag: Move/Resize Subtitles</div>
        <div>Shift + ←/→: Move selected subtitle | Esc: Deselect</div>
      </div>
    </div>
  );
}
