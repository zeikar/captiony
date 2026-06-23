"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";

type DragHandle = "start" | "end" | null;

interface SubtitlePosition {
  id: string;
  startTime: number;
  endTime: number;
}

interface DragState {
  isDragging: boolean;
  draggedSubtitle: string | null;
  resizeHandle: DragHandle;
  dragStart: { x: number; y: number };
  originalSubtitlePosition: { startTime: number; endTime: number } | null;
  // Live preview positions for the bars being moved this drag. One entry for a
  // single move/resize; one per selected cue for a multi-selection group move.
  tempSubtitlePositions: SubtitlePosition[];
  // Original positions of every cue in a group move (null for single move/resize).
  groupOriginals: SubtitlePosition[] | null;
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
    nudgeSelectedSubtitles,
    selectedIds,
  } = useSubtitleStore();

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedSubtitle: null,
    resizeHandle: null,
    dragStart: { x: 0, y: 0 },
    originalSubtitlePosition: null,
    tempSubtitlePositions: [],
    groupOriginals: null,
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

      // Group move: a body drag (not a resize) on a bar that's part of a
      // multi-selection moves every selected cue together.
      const isGroupMove =
        !handle && selectedIds.length > 1 && selectedIds.includes(subtitleId);
      const groupOriginals: SubtitlePosition[] | null = isGroupMove
        ? subtitles
            .filter((s) => selectedIds.includes(s.id))
            .map((s) => ({
              id: s.id,
              startTime: s.startTime,
              endTime: s.endTime,
            }))
        : null;

      setDragState({
        isDragging: true,
        draggedSubtitle: subtitleId,
        resizeHandle: handle ?? null,
        dragStart: { x: e.clientX, y: e.clientY },
        originalSubtitlePosition: {
          startTime: subtitle.startTime,
          endTime: subtitle.endTime,
        },
        tempSubtitlePositions: [],
        groupOriginals,
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
        groupOriginals,
      } = dragState;

      if (!isDragging || !draggedSubtitle || !originalSubtitlePosition) return;

      // 120fps throttling
      const now = performance.now();
      if (now - lastDragUpdateRef.current < DRAG_UPDATE_INTERVAL_MS) return;
      lastDragUpdateRef.current = now;

      const deltaX = e.clientX - dragStart.x;
      const deltaTime = deltaX / pixelsPerSecond;

      let tempPositions: SubtitlePosition[];
      if (groupOriginals) {
        // Group move: clamp the whole group by the earliest cue so spacing is kept.
        const minStart = Math.min(...groupOriginals.map((o) => o.startTime));
        const clampedDelta = Math.max(deltaTime, -minStart);
        tempPositions = groupOriginals.map((o) => ({
          id: o.id,
          startTime: o.startTime + clampedDelta,
          endTime: o.endTime + clampedDelta,
        }));
      } else {
        const { newStartTime, newEndTime } = computeNewTimes(
          originalSubtitlePosition,
          deltaTime,
          resizeHandle
        );
        tempPositions = [
          { id: draggedSubtitle, startTime: newStartTime, endTime: newEndTime },
        ];
      }

      // During drag only update the preview; the store is committed on mouseUp
      setDragState((prev) => ({
        ...prev,
        tempSubtitlePositions: tempPositions,
      }));

      // Mark as dragged once movement exceeds the click threshold
      if (!didDragRef.current && Math.abs(deltaX) >= DRAG_CLICK_THRESHOLD_PX) {
        didDragRef.current = true;
      }
    },
    [dragState, pixelsPerSecond]
  );

  const handleMouseUp = useCallback(() => {
    const { tempSubtitlePositions, draggedSubtitle, groupOriginals } = dragState;

    if (tempSubtitlePositions.length > 0 && draggedSubtitle) {
      if (groupOriginals) {
        // Group move: derive the applied (already-clamped) delta from the dragged
        // bar and shift every selected cue by it in one history step.
        const draggedTemp = tempSubtitlePositions.find(
          (t) => t.id === draggedSubtitle
        );
        const draggedOrig = groupOriginals.find((o) => o.id === draggedSubtitle);
        const delta =
          draggedTemp && draggedOrig
            ? draggedTemp.startTime - draggedOrig.startTime
            : 0;
        if (delta !== 0) nudgeSelectedSubtitles(delta);
      } else {
        const t = tempSubtitlePositions[0];
        updateSubtitle(draggedSubtitle, {
          startTime: t.startTime,
          endTime: t.endTime,
        });
      }
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
      tempSubtitlePositions: [],
      groupOriginals: null,
    });
    didDragRef.current = false;
  }, [dragState, updateSubtitle, selectSubtitle, nudgeSelectedSubtitles]);

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
