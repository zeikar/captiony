"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import type { SubtitleItem } from "@/lib/stores/subtitle-store";

interface DragState {
  isDragging: boolean;
  draggedSubtitle: string | null;
  resizeHandle: "start" | "end" | null;
  dragStart: { x: number; y: number };
  originalSubtitlePosition: { startTime: number; endTime: number } | null;
  tempSubtitlePosition: {
    id: string;
    startTime: number;
    endTime: number;
  } | null;
}

export function useSubtitleDrag(pixelsPerSecond: number) {
  const { subtitles, updateSubtitle, selectSubtitle } = useSubtitleStore();

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedSubtitle: null,
    resizeHandle: null,
    dragStart: { x: 0, y: 0 },
    originalSubtitlePosition: null,
    tempSubtitlePosition: null,
  });

  const handleMouseMoveRef = useRef<((e: MouseEvent) => void) | null>(null);
  const handleMouseUpRef = useRef<(() => void) | null>(null);
  const lastDragUpdateRef = useRef<number>(0);

  const handleSubtitleMouseDown = useCallback(
    (e: React.MouseEvent, subtitleId: string, handle?: "start" | "end") => {
      e.preventDefault();
      e.stopPropagation();

      const subtitle = subtitles.find((s) => s.id === subtitleId);
      if (!subtitle) return;

      setDragState({
        isDragging: true,
        draggedSubtitle: subtitleId,
        resizeHandle: handle || null,
        dragStart: { x: e.clientX, y: e.clientY },
        originalSubtitlePosition: {
          startTime: subtitle.startTime,
          endTime: subtitle.endTime,
        },
        tempSubtitlePosition: null,
      });

      selectSubtitle(subtitleId);
    },
    [subtitles, selectSubtitle]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const {
        isDragging,
        draggedSubtitle,
        originalSubtitlePosition,
        dragStart,
        resizeHandle,
      } = dragState;

      if (!isDragging || !draggedSubtitle || !originalSubtitlePosition) return;

      // 120fps throttling
      const now = performance.now();
      if (now - lastDragUpdateRef.current < 8) return;
      lastDragUpdateRef.current = now;

      const deltaX = e.clientX - dragStart.x;
      const deltaTime = deltaX / pixelsPerSecond;

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

      // 드래그 중에는 tempSubtitlePosition만 업데이트 (실제 store는 mouseUp에서 업데이트)
      setDragState((prev) => ({
        ...prev,
        tempSubtitlePosition: {
          id: draggedSubtitle,
          startTime: newStartTime,
          endTime: newEndTime,
        },
      }));
    },
    [dragState, pixelsPerSecond]
  );

  const handleMouseUp = useCallback(() => {
    const { tempSubtitlePosition, draggedSubtitle } = dragState;

    if (tempSubtitlePosition && draggedSubtitle) {
      updateSubtitle(draggedSubtitle, {
        startTime: tempSubtitlePosition.startTime,
        endTime: tempSubtitlePosition.endTime,
      });
    }

    setDragState({
      isDragging: false,
      draggedSubtitle: null,
      resizeHandle: null,
      dragStart: { x: 0, y: 0 },
      originalSubtitlePosition: null,
      tempSubtitlePosition: null,
    });
  }, [dragState, updateSubtitle]);

  // 이벤트 리스너 등록
  handleMouseMoveRef.current = handleMouseMove;
  handleMouseUpRef.current = handleMouseUp;

  useEffect(() => {
    if (dragState.isDragging) {
      const mouseMoveHandler = (e: MouseEvent) =>
        handleMouseMoveRef.current?.(e);
      const mouseUpHandler = () => handleMouseUpRef.current?.();

      document.addEventListener("mousemove", mouseMoveHandler);
      document.addEventListener("mouseup", mouseUpHandler);

      return () => {
        document.removeEventListener("mousemove", mouseMoveHandler);
        document.removeEventListener("mouseup", mouseUpHandler);
      };
    }
  }, [dragState.isDragging]);

  return {
    ...dragState,
    handleSubtitleMouseDown,
  };
}
