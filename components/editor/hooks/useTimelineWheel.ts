"use client";

import { useEffect } from "react";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { getTimeFromX } from "../utils/timelineUtils";

export function useTimelineWheel(
  timelineRef: React.RefObject<HTMLDivElement>,
  timelineOffset: number,
  timelineScale: number,
  pixelsPerSecond: number
) {
  const { setTimelineScale, setTimelineOffset } = useSubtitleStore();
  const { video } = useVideoStore();

  useEffect(() => {
    const timelineElement = timelineRef.current;
    if (!timelineElement) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const rect = timelineElement.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseTime = getTimeFromX(mouseX, timelineOffset, pixelsPerSecond);

        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.5, Math.min(5, timelineScale * zoomFactor));

        const newOffset = mouseTime - mouseX / (50 * newScale);

        setTimelineScale(newScale);
        setTimelineOffset(Math.max(0, newOffset));
      } else {
        // Scroll
        const rect = timelineElement.getBoundingClientRect();
        let deltaY = e.deltaY;
        let deltaX = e.deltaX;

        if (e.deltaMode === 1) {
          deltaY *= 33;
          deltaX *= 33;
        } else if (e.deltaMode === 2) {
          deltaY *= rect.height;
          deltaX *= rect.width;
        }

        const baseScrollSpeed = 1;
        const fastScrollThreshold = 100;
        const isDeltaYDominant = Math.abs(deltaY) > Math.abs(deltaX);
        const primaryDelta = isDeltaYDominant ? deltaY : deltaX;

        let scrollSpeed;
        if (Math.abs(primaryDelta) > fastScrollThreshold) {
          scrollSpeed = baseScrollSpeed * 1.5;
        } else {
          scrollSpeed = baseScrollSpeed;
        }

        let scrollDirection;
        if (deltaX !== 0) {
          scrollDirection = deltaX > 0 ? 1 : -1;
        } else {
          scrollDirection = deltaY > 0 ? 1 : -1;
        }

        const scrollTime = scrollSpeed * scrollDirection;
        const newOffset = Math.max(0, timelineOffset + scrollTime);
        const maxOffset = Math.max(
          0,
          (video.duration || 0) - rect.width / pixelsPerSecond
        );

        setTimelineOffset(Math.min(newOffset, maxOffset));
      }
    };

    timelineElement.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      timelineElement.removeEventListener("wheel", handleWheel);
    };
  }, [
    timelineRef,
    timelineOffset,
    timelineScale,
    pixelsPerSecond,
    video.duration,
    setTimelineScale,
    setTimelineOffset,
  ]);
}
