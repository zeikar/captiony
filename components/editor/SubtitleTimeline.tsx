"use client";

import { useRef, useEffect, useState } from "react";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import type { SubtitleItem } from "@/lib/stores/subtitle-store";

export function SubtitleTimeline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

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
  const [resizeHandle, setResizeHandle] = useState<"start" | "end" | null>(
    null
  );

  // Timeline scaling constants
  const PIXELS_PER_SECOND = 50 * timelineScale;
  const TIMELINE_HEIGHT = 120;
  const SUBTITLE_HEIGHT = 30;
  const SUBTITLE_MARGIN = 2;

  useEffect(() => {
    drawTimeline();

    // 현재 시간이 타임라인 화면 밖으로 나가면 자동으로 스크롤
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (canvasRect) {
      const currentTimeX =
        (video.currentTime - timelineOffset) * PIXELS_PER_SECOND;
      const timelineWidth = canvasRect.width;

      // 현재 시간이 화면 밖으로 나갔을 때 자동 스크롤
      if (currentTimeX < 0) {
        setTimelineOffset(Math.max(0, video.currentTime - 2)); // 2초 여유분
      } else if (currentTimeX > timelineWidth) {
        setTimelineOffset(
          video.currentTime - timelineWidth / PIXELS_PER_SECOND + 2
        );
      }
    }
  }, [video, subtitles, selectedSubtitleId, timelineScale, timelineOffset]);

  const drawTimeline = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = TIMELINE_HEIGHT * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Draw background
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, rect.width, TIMELINE_HEIGHT);

    // Draw time ruler
    drawTimeRuler(ctx, rect.width);

    // Draw subtitle bars
    drawSubtitleBars(ctx, rect.width);

    // Draw current time line
    drawCurrentTimeLine(ctx, rect.width);
  };

  const drawTimeRuler = (ctx: CanvasRenderingContext2D, width: number) => {
    const startTime = timelineOffset;
    const endTime = startTime + width / PIXELS_PER_SECOND;

    ctx.strokeStyle = "#9ca3af";
    ctx.fillStyle = "#374151";
    ctx.font = "12px sans-serif";
    ctx.lineWidth = 1;

    // Draw tick marks every 1 second
    for (let time = Math.floor(startTime); time <= Math.ceil(endTime); time++) {
      const x = (time - startTime) * PIXELS_PER_SECOND;

      if (x >= 0 && x <= width) {
        // Major tick (1 second interval)
        if (time % 1 === 0) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 20);
          ctx.stroke();

          // Time text
          const timeText = formatTimelineTime(time);
          ctx.fillText(timeText, x + 2, 15);
        }

        // Minor tick (0.5 second interval)
        if (time % 0.5 === 0 && time % 1 !== 0) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 10);
          ctx.stroke();
        }
      }
    }
  };

  const drawSubtitleBars = (ctx: CanvasRenderingContext2D, width: number) => {
    const startTime = timelineOffset;
    const endTime = startTime + width / PIXELS_PER_SECOND;

    // Arrange subtitles by layers (place overlapping subtitles in different layers)
    const layers = arrangeSubtitlesInLayers(subtitles);

    layers.forEach((layer, layerIndex) => {
      layer.forEach((subtitle) => {
        // Only draw subtitles visible on screen
        if (subtitle.endTime >= startTime && subtitle.startTime <= endTime) {
          drawSubtitleBar(ctx, subtitle, layerIndex, startTime);
        }
      });
    });
  };

  const drawSubtitleBar = (
    ctx: CanvasRenderingContext2D,
    subtitle: SubtitleItem,
    layer: number,
    startTime: number
  ) => {
    const x = (subtitle.startTime - startTime) * PIXELS_PER_SECOND;
    const width = (subtitle.endTime - subtitle.startTime) * PIXELS_PER_SECOND;
    const y = 25 + layer * (SUBTITLE_HEIGHT + SUBTITLE_MARGIN);

    // Subtitle bar background
    const isSelected = selectedSubtitleId === subtitle.id;
    ctx.fillStyle = isSelected ? "#3b82f6" : "#6b7280";
    ctx.fillRect(x, y, width, SUBTITLE_HEIGHT);

    // Border
    ctx.strokeStyle = isSelected ? "#1d4ed8" : "#4b5563";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, SUBTITLE_HEIGHT);

    // Subtitle text
    ctx.fillStyle = "white";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const text =
      subtitle.text.length > 20
        ? subtitle.text.substring(0, 20) + "..."
        : subtitle.text;
    ctx.fillText(text, x + 4, y + SUBTITLE_HEIGHT / 2);

    // Resize handles
    if (isSelected) {
      ctx.fillStyle = "#1d4ed8";
      // Start handle
      ctx.fillRect(x - 2, y, 4, SUBTITLE_HEIGHT);
      // End handle
      ctx.fillRect(x + width - 2, y, 4, SUBTITLE_HEIGHT);
    }
  };

  const drawCurrentTimeLine = (
    ctx: CanvasRenderingContext2D,
    width: number
  ) => {
    const x = (video.currentTime - timelineOffset) * PIXELS_PER_SECOND;

    if (x >= 0 && x <= width) {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, TIMELINE_HEIGHT);
      ctx.stroke();

      // Current time display
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        formatTimelineTime(video.currentTime),
        x,
        TIMELINE_HEIGHT - 5
      );
    }
  };

  const arrangeSubtitlesInLayers = (
    subtitles: SubtitleItem[]
  ): SubtitleItem[][] => {
    const layers: SubtitleItem[][] = [];
    const sortedSubtitles = [...subtitles].sort(
      (a, b) => a.startTime - b.startTime
    );

    sortedSubtitles.forEach((subtitle) => {
      let placed = false;

      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        const lastSubtitle = layer[layer.length - 1];

        // Place on same layer if not overlapping with previous subtitle
        if (!lastSubtitle || lastSubtitle.endTime <= subtitle.startTime) {
          layer.push(subtitle);
          placed = true;
          break;
        }
      }

      // Create new layer if overlapping with all existing layers
      if (!placed) {
        layers.push([subtitle]);
      }
    });

    return layers;
  };

  const formatTimelineTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeFromX = (x: number): number => {
    return timelineOffset + x / PIXELS_PER_SECOND;
  };

  const getSubtitleAtPosition = (
    x: number,
    y: number
  ): { subtitle: SubtitleItem; handle?: "start" | "end" } | null => {
    const time = getTimeFromX(x);
    const layer = Math.floor((y - 25) / (SUBTITLE_HEIGHT + SUBTITLE_MARGIN));

    const layers = arrangeSubtitlesInLayers(subtitles);
    if (layer >= 0 && layer < layers.length) {
      for (const subtitle of layers[layer]) {
        const startX =
          (subtitle.startTime - timelineOffset) * PIXELS_PER_SECOND;
        const endX = (subtitle.endTime - timelineOffset) * PIXELS_PER_SECOND;

        if (time >= subtitle.startTime && time <= subtitle.endTime) {
          // Check handle areas (selected subtitle only)
          if (selectedSubtitleId === subtitle.id) {
            if (x >= startX - 4 && x <= startX + 4) {
              return { subtitle, handle: "start" };
            }
            if (x >= endX - 4 && x <= endX + 4) {
              return { subtitle, handle: "end" };
            }
          }
          return { subtitle };
        }
      }
    }

    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = getSubtitleAtPosition(x, y);

    if (hit) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setDraggedSubtitle(hit.subtitle.id);
      setResizeHandle(hit.handle || null);
      selectSubtitle(hit.subtitle.id);
    } else {
      // Click on empty space to change current time
      const time = getTimeFromX(x);
      const clampedTime = Math.max(0, Math.min(time, video.duration || 0));
      setCurrentTime(clampedTime);
      selectSubtitle(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
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
      const newEndTime = Math.max(
        subtitle.startTime + 0.1,
        subtitle.endTime + deltaTime
      );
      updateSubtitle(subtitle.id, { endTime: newEndTime });
    } else {
      // Move entire subtitle
      const duration = subtitle.endTime - subtitle.startTime;
      const newStartTime = Math.max(0, subtitle.startTime + deltaTime);
      updateSubtitle(subtitle.id, {
        startTime: newStartTime,
        endTime: newStartTime + duration,
      });
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedSubtitle(null);
    setResizeHandle(null);
  };

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
      const newOffset = Math.max(
        0,
        timelineOffset + (e.deltaY > 0 ? scrollSpeed : -scrollSpeed)
      );
      setTimelineOffset(newOffset);
    }
  };

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
        className="relative border border-gray-300 dark:border-gray-600 rounded overflow-hidden"
        style={{ height: TIMELINE_HEIGHT }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-pointer"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />
      </div>

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Ctrl/Cmd + Wheel: Zoom | Wheel: Scroll | Drag: Move/Resize Subtitles
      </div>
    </div>
  );
}
