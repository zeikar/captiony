"use client";

import { useEffect } from "react";
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

        // 새로운 좌표 체계에 맞게 마우스 위치의 시간 계산
        let mouseTime: number;
        if (timelineMode === "centered") {
          const centerX = rect.width / 2;
          const offsetFromCenter = mouseX - centerX;
          mouseTime = video.currentTime + offsetFromCenter / pixelsPerSecond;
        } else {
          mouseTime = timelineOffset + mouseX / pixelsPerSecond;
        }

        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.5, Math.min(5, timelineScale * zoomFactor));

        if (timelineMode === "free") {
          // Free 모드에서만 offset 조정
          const newOffset = mouseTime - mouseX / (50 * newScale);
          setTimelineOffset(Math.max(0, newOffset));
        }

        setTimelineScale(newScale);
      } else {
        // Scroll
        if (timelineMode === "centered") {
          // Centered 모드에서는 스크롤을 동영상 시간 변경으로 처리
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
          const newTime = Math.max(
            0,
            Math.min(video.duration || 0, video.currentTime + scrollTime)
          );
          setCurrentTime(newTime);
        } else {
          // Free 모드에서는 기존 방식으로 타임라인 오프셋 변경
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
    timelineMode,
    video.duration,
    video.currentTime,
    setTimelineScale,
    setTimelineOffset,
    setCurrentTime,
  ]);
}
