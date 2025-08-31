"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";

type DragHandle = "start" | "end" | null;

interface DragState {
  isDragging: boolean;
  draggedSubtitle: string | null;
  resizeHandle: DragHandle;
  dragStart: { x: number; y: number };
  originalSubtitlePosition: { startTime: number; endTime: number } | null;
  tempSubtitlePosition: {
    id: string;
    startTime: number;
    endTime: number;
  } | null;
}

// Tunable constants
const DRAG_UPDATE_INTERVAL_MS = 8; // ~120fps
const DRAG_CLICK_THRESHOLD_PX = 2; // distinguish click vs drag
const MIN_SUBTITLE_DURATION = 0.1; // seconds

function computeNewTimes(
  original: { startTime: number; endTime: number },
  deltaTime: number,
  handle: DragHandle
) {
  let newStartTime: number;
  let newEndTime: number;

  if (handle === "start") {
    newStartTime = Math.max(0, original.startTime + deltaTime);
    newEndTime = original.endTime;
    if (newStartTime >= newEndTime)
      newStartTime = newEndTime - MIN_SUBTITLE_DURATION;
  } else if (handle === "end") {
    newStartTime = original.startTime;
    newEndTime = Math.max(
      original.startTime + MIN_SUBTITLE_DURATION,
      original.endTime + deltaTime
    );
  } else {
    const duration = original.endTime - original.startTime;
    newStartTime = Math.max(0, original.startTime + deltaTime);
    newEndTime = newStartTime + duration;
  }

  return { newStartTime, newEndTime };
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
  // 실제 드래그가 발생했는지 여부 (클릭과 구분)
  const didDragRef = useRef<boolean>(false);

  const handleSubtitleMouseDown = useCallback(
    (e: React.MouseEvent, subtitleId: string, handle?: DragHandle) => {
      e.preventDefault();
      e.stopPropagation();

      const subtitle = subtitles.find((s) => s.id === subtitleId);
      if (!subtitle) return;

      setDragState({
        isDragging: true,
        draggedSubtitle: subtitleId,
        resizeHandle: handle ?? null,
        dragStart: { x: e.clientX, y: e.clientY },
        originalSubtitlePosition: {
          startTime: subtitle.startTime,
          endTime: subtitle.endTime,
        },
        tempSubtitlePosition: null,
      });

      // 새 드래그 시작 시 초기화
      didDragRef.current = false;

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
      if (now - lastDragUpdateRef.current < DRAG_UPDATE_INTERVAL_MS) return;
      lastDragUpdateRef.current = now;

      const deltaX = e.clientX - dragStart.x;
      const deltaTime = deltaX / pixelsPerSecond;

      const { newStartTime, newEndTime } = computeNewTimes(
        originalSubtitlePosition,
        deltaTime,
        resizeHandle
      );

      // 드래그 중에는 tempSubtitlePosition만 업데이트 (실제 store는 mouseUp에서 업데이트)
      setDragState((prev) => ({
        ...prev,
        tempSubtitlePosition: {
          id: draggedSubtitle,
          startTime: newStartTime,
          endTime: newEndTime,
        },
      }));

      // 실제로 커서가 움직였음을 표시 (소량의 이동은 클릭으로 간주할 수 있으므로 임계값 적용)
      if (!didDragRef.current && Math.abs(deltaX) >= DRAG_CLICK_THRESHOLD_PX) {
        didDragRef.current = true;
      }
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

    // 드래그 직후 발생하는 click 이벤트가 타임라인으로 전파되어
    // 현재 시간이 이동하는 것을 방지하기 위해 한 번만 캡처 단계에서 차단
    if (didDragRef.current) {
      const suppressNextClick = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
      };
      document.addEventListener("click", suppressNextClick, {
        capture: true,
        once: true,
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
    didDragRef.current = false;
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
