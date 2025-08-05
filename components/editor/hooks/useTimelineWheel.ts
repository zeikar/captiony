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

  // 성능 최적화를 위한 throttling
  const lastUpdateRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const timelineElement = timelineRef.current;
    if (!timelineElement) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 성능 최적화: 16ms throttling (60fps)
      const now = performance.now();
      if (now - lastUpdateRef.current < 16) {
        return;
      }
      lastUpdateRef.current = now;

      // RAF 중복 요청 방지
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
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
          const newScale = Math.max(
            0.5,
            Math.min(5, timelineScale * zoomFactor)
          );

          if (timelineMode === "free") {
            // Free 모드에서만 offset 조정
            const newOffset = mouseTime - mouseX / (50 * newScale);
            setTimelineOffset(Math.max(0, newOffset));
          }

          setTimelineScale(newScale);
        } else {
          // Scroll - 부드러운 스크롤 로직은 그대로 유지
          if (timelineMode === "centered") {
            // Centered 모드에서는 스크롤을 동영상 시간 변경으로 처리
            const rect = timelineElement.getBoundingClientRect();
            let deltaY = e.deltaY;
            let deltaX = e.deltaX;

            // 델타 모드에 따른 정규화
            if (e.deltaMode === 1) {
              deltaY *= 33;
              deltaX *= 33;
            } else if (e.deltaMode === 2) {
              deltaY *= rect.height;
              deltaX *= rect.width;
            }

            // 부드러운 스크롤을 위한 세밀한 속도 조정
            const baseScrollSpeed = 0.03; // 기본 속도를 더 줄임 (0.05 → 0.03)
            const zoomAdjustment = 1 / timelineScale; // 줌 레벨에 반비례하여 속도 조정

            const isDeltaXDominant = Math.abs(deltaX) > Math.abs(deltaY);
            const primaryDelta = isDeltaXDominant ? deltaX : deltaY;

            // 델타 값에 비례하는 부드러운 속도 계산
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
            // Free 모드에서는 타임라인 오프셋 변경
            const rect = timelineElement.getBoundingClientRect();
            let deltaY = e.deltaY;
            let deltaX = e.deltaX;

            // 델타 모드에 따른 정규화
            if (e.deltaMode === 1) {
              deltaY *= 33;
              deltaX *= 33;
            } else if (e.deltaMode === 2) {
              deltaY *= rect.height;
              deltaX *= rect.width;
            }

            // 부드러운 스크롤을 위한 세밀한 속도 조정
            const baseScrollSpeed = 0.03; // 기본 속도를 더 줄임
            const zoomAdjustment = 1 / timelineScale; // 줌 레벨에 반비례하여 속도 조정

            const isDeltaXDominant = Math.abs(deltaX) > Math.abs(deltaY);
            const primaryDelta = isDeltaXDominant ? deltaX : deltaY;

            // 델타 값에 비례하는 부드러운 속도 계산
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
