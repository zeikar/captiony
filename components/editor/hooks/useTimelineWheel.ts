"use client";

import { useEffect, useRef } from "react";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { getTimeFromX } from "../utils/timelineUtils";

export function useTimelineWheel(
  timelineRef: React.RefObject<HTMLDivElement>,
  timelineOffset: number,
  timelineScale: number,
  pixelsPerSecond: number,
  timelineMode: "free" | "centered"
) {
  const { setTimelineScale, setTimelineOffset } = useSubtitleStore();
  const { video, setCurrentTime } = useVideoStore();

  // Throttling for performance
  const lastUpdateRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const timelineElement = timelineRef.current;
    if (!timelineElement) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 16ms throttle for 60fps performance
      const now = performance.now();
      if (now - lastUpdateRef.current < 16) {
        return;
      }
      lastUpdateRef.current = now;

      // Cancel any pending RAF before scheduling a new one
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        if (e.ctrlKey || e.metaKey) {
          // Zoom
          const rect = timelineElement.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;

          // Compute time at mouse position for the new coordinate system
          let mouseTime: number;
          if (timelineMode === "centered") {
            const centerX = rect.width / 2;
            const offsetFromCenter = mouseX - centerX;
            mouseTime = video.currentTime + offsetFromCenter / pixelsPerSecond;
          } else {
            mouseTime = timelineOffset + mouseX / pixelsPerSecond;
          }

          const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
          const newScale = Math.max(
            0.5,
            Math.min(5, timelineScale * zoomFactor)
          );

          if (timelineMode === "free") {
            // Adjust offset only in free mode
            const newOffset = mouseTime - mouseX / (50 * newScale);
            setTimelineOffset(Math.max(0, newOffset));
          }

          setTimelineScale(newScale);
        } else {
          // Scroll — smooth scroll logic preserved as-is
          if (timelineMode === "centered") {
            // In centered mode, translate scroll into video time changes
            const rect = timelineElement.getBoundingClientRect();
            let deltaY = e.deltaY;
            let deltaX = e.deltaX;

            // Normalize delta based on deltaMode
            if (e.deltaMode === 1) {
              deltaY *= 33;
              deltaX *= 33;
            } else if (e.deltaMode === 2) {
              deltaY *= rect.height;
              deltaX *= rect.width;
            }

            // Fine-grained speed adjustment for smooth scrolling
            const baseScrollSpeed = 0.03; // reduced from 0.05 to 0.03
            const zoomAdjustment = 1 / timelineScale; // inversely proportional to zoom level

            const isDeltaXDominant = Math.abs(deltaX) > Math.abs(deltaY);
            const primaryDelta = isDeltaXDominant ? deltaX : deltaY;

            // Smooth speed proportional to delta magnitude
            const normalizedDelta =
              Math.sign(primaryDelta) * Math.min(Math.abs(primaryDelta), 200);
            const scrollTime =
              normalizedDelta * baseScrollSpeed * zoomAdjustment;

            const newTime = Math.max(
              0,
              Math.min(video.duration || 0, video.currentTime + scrollTime)
            );
            setCurrentTime(newTime);
          } else {
            // In free mode, change the timeline offset
            const rect = timelineElement.getBoundingClientRect();
            let deltaY = e.deltaY;
            let deltaX = e.deltaX;

            // Normalize delta based on deltaMode
            if (e.deltaMode === 1) {
              deltaY *= 33;
              deltaX *= 33;
            } else if (e.deltaMode === 2) {
              deltaY *= rect.height;
              deltaX *= rect.width;
            }

            // Fine-grained speed adjustment for smooth scrolling
            const baseScrollSpeed = 0.03; // reduced base speed
            const zoomAdjustment = 1 / timelineScale; // inversely proportional to zoom level

            const isDeltaXDominant = Math.abs(deltaX) > Math.abs(deltaY);
            const primaryDelta = isDeltaXDominant ? deltaX : deltaY;

            // Smooth speed proportional to delta magnitude
            const normalizedDelta =
              Math.sign(primaryDelta) * Math.min(Math.abs(primaryDelta), 200);
            const scrollTime =
              normalizedDelta * baseScrollSpeed * zoomAdjustment;

            const newOffset = Math.max(0, timelineOffset + scrollTime);
            const maxOffset = Math.max(
              0,
              (video.duration || 0) - rect.width / pixelsPerSecond
            );

            setTimelineOffset(Math.min(newOffset, maxOffset));
          }
        }

        rafIdRef.current = null;
      });
    };

    timelineElement.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      timelineElement.removeEventListener("wheel", handleWheel);
      // RAF cleanup
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [
    timelineRef,
    timelineOffset,
    timelineScale,
    pixelsPerSecond,
    timelineMode,
    video.duration,
    video.currentTime,
    setTimelineScale,
    setTimelineOffset,
    setCurrentTime,
  ]);
}
