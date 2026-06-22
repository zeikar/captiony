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

// Suppresses the next document-level click in capture phase (once).
// Used to prevent synthetic clicks after mousedown-only interactions (modifier-click, post-drag)
// from bubbling to the timeline root and accidentally seeking the playhead.
function installClickSuppressor() {
  document.addEventListener(
    "click",
    (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
    },
    { capture: true, once: true }
  );
}

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
  const {
    subtitles,
    updateSubtitle,
    selectSubtitle,
    toggleSubtitleSelection,
    rangeSelectSubtitle,
    selectedIds,
  } = useSubtitleStore();

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
  // Tracks whether an actual drag occurred (to distinguish from a click)
  const didDragRef = useRef<boolean>(false);
  // When mousedown lands on an already-selected bar, we defer the single-select
  // collapse to mouseUp (so a drag preserves the full multi-selection).
  const pendingCollapseRef = useRef<string | null>(null);

  const handleSubtitleMouseDown = useCallback(
    (e: React.MouseEvent, subtitleId: string, handle?: DragHandle) => {
      e.preventDefault();
      e.stopPropagation();

      // Modifier-click: select without starting a drag
      if (e.metaKey || e.ctrlKey) {
        toggleSubtitleSelection(subtitleId);
        // Suppress the trailing synthetic click so it doesn't seek the playhead
        installClickSuppressor();
        return;
      }

      if (e.shiftKey) {
        rangeSelectSubtitle(subtitleId);
        // Suppress the trailing synthetic click so it doesn't seek the playhead
        installClickSuppressor();
        return;
      }

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

      // Reset at the start of each new drag
      didDragRef.current = false;

      if (selectedIds.includes(subtitleId)) {
        // Already in the (possibly multi-) selection: don't collapse on mousedown.
        // A drag preserves the whole selection; a plain click collapses to this cue on mouseUp.
        pendingCollapseRef.current = subtitleId;
      } else {
        // Clicking an unselected bar selects just it, then drags (unchanged behavior).
        selectSubtitle(subtitleId);
        pendingCollapseRef.current = null;
      }
    },
    [subtitles, selectSubtitle, toggleSubtitleSelection, rangeSelectSubtitle, selectedIds]
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

      // During drag only update tempSubtitlePosition; store is updated on mouseUp
      setDragState((prev) => ({
        ...prev,
        tempSubtitlePosition: {
          id: draggedSubtitle,
          startTime: newStartTime,
          endTime: newEndTime,
        },
      }));

      // Mark as dragged once movement exceeds the click threshold
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

    // Suppress the click event fired immediately after a drag so it does not
    // propagate to the timeline and accidentally move the current time
    if (didDragRef.current) {
      installClickSuppressor();
    }

    // Plain click on an already-selected bar: collapse multi-selection to just this cue.
    if (!didDragRef.current && pendingCollapseRef.current) {
      selectSubtitle(pendingCollapseRef.current);
    }
    pendingCollapseRef.current = null;

    setDragState({
      isDragging: false,
      draggedSubtitle: null,
      resizeHandle: null,
      dragStart: { x: 0, y: 0 },
      originalSubtitlePosition: null,
      tempSubtitlePosition: null,
    });
    didDragRef.current = false;
  }, [dragState, updateSubtitle, selectSubtitle]);

  // Register event listeners
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
