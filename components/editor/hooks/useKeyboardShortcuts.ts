"use client";

import { useEffect } from "react";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";

export function useKeyboardShortcuts() {
  const {
    selectedSubtitleId,
    subtitles,
    selectSubtitle,
    updateSubtitle,
    deleteSubtitle,
    addSubtitle,
  } = useSubtitleStore();

  const { video, setCurrentTime, togglePlayPause, seekTo } = useVideoStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서는 무시 (단, 일부 키는 허용)
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        // 입력 필드에서도 Escape는 허용
        if (e.key !== "Escape") {
          return;
        }
      }

      switch (e.key) {
        case " ": // 스페이스바 - 재생/일시정지
          e.preventDefault();
          togglePlayPause();
          break;
        case "Delete":
        case "Backspace":
          if (selectedSubtitleId) {
            deleteSubtitle(selectedSubtitleId);
            e.preventDefault();
          }
          break;
        case "Escape":
          selectSubtitle(null);
          break;
        case "ArrowUp":
          // 이전 자막 선택
          if (subtitles.length > 0) {
            const sortedSubtitles = [...subtitles].sort(
              (a, b) => a.startTime - b.startTime
            );
            if (selectedSubtitleId) {
              const currentIndex = sortedSubtitles.findIndex(
                (s) => s.id === selectedSubtitleId
              );
              if (currentIndex > 0) {
                const prevSubtitle = sortedSubtitles[currentIndex - 1];
                selectSubtitle(prevSubtitle.id);
                setCurrentTime(prevSubtitle.startTime);
              }
            } else if (sortedSubtitles.length > 0) {
              const firstSubtitle = sortedSubtitles[0];
              selectSubtitle(firstSubtitle.id);
              setCurrentTime(firstSubtitle.startTime);
            }
            e.preventDefault();
          }
          break;
        case "ArrowDown":
          // 다음 자막 선택
          if (subtitles.length > 0) {
            const sortedSubtitles = [...subtitles].sort(
              (a, b) => a.startTime - b.startTime
            );
            if (selectedSubtitleId) {
              const currentIndex = sortedSubtitles.findIndex(
                (s) => s.id === selectedSubtitleId
              );
              if (currentIndex < sortedSubtitles.length - 1) {
                const nextSubtitle = sortedSubtitles[currentIndex + 1];
                selectSubtitle(nextSubtitle.id);
                setCurrentTime(nextSubtitle.startTime);
              }
            } else if (sortedSubtitles.length > 0) {
              const firstSubtitle = sortedSubtitles[0];
              selectSubtitle(firstSubtitle.id);
              setCurrentTime(firstSubtitle.startTime);
            }
            e.preventDefault();
          }
          break;
        case "ArrowLeft":
          if (e.shiftKey && selectedSubtitleId) {
            // Shift + 왼쪽 화살표: 자막을 왼쪽으로 이동 (시간 단축)
            const subtitle = subtitles.find((s) => s.id === selectedSubtitleId);
            if (subtitle) {
              const duration = subtitle.endTime - subtitle.startTime;
              const newStartTime = Math.max(0, subtitle.startTime - 0.1);
              updateSubtitle(selectedSubtitleId, {
                startTime: newStartTime,
                endTime: newStartTime + duration,
              });
            }
            e.preventDefault();
          } else {
            // 왼쪽 화살표: 5초 뒤로
            const newTime = Math.max(0, video.currentTime - 5);
            seekTo(newTime);
            e.preventDefault();
          }
          break;
        case "ArrowRight":
          if (e.shiftKey && selectedSubtitleId) {
            // Shift + 오른쪽 화살표: 자막을 오른쪽으로 이동 (시간 증가)
            const subtitle = subtitles.find((s) => s.id === selectedSubtitleId);
            if (subtitle) {
              const duration = subtitle.endTime - subtitle.startTime;
              const newStartTime = subtitle.startTime + 0.1;
              updateSubtitle(selectedSubtitleId, {
                startTime: newStartTime,
                endTime: newStartTime + duration,
              });
            }
            e.preventDefault();
          } else {
            // 오른쪽 화살표: 5초 앞으로
            const maxTime = video.duration || video.currentTime + 5;
            const newTime = Math.min(maxTime, video.currentTime + 5);
            seekTo(newTime);
            e.preventDefault();
          }
          break;
        case "Enter":
          if (e.metaKey || e.ctrlKey) {
            // Cmd/Ctrl + Enter: 새 자막 추가
            const currentTime = video.currentTime;
            const newSubtitle = {
              text: "",
              startTime: currentTime,
              endTime: currentTime + 2,
            };
            addSubtitle(newSubtitle);
            e.preventDefault();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedSubtitleId,
    subtitles,
    selectSubtitle,
    updateSubtitle,
    deleteSubtitle,
    addSubtitle,
    video,
    setCurrentTime,
    togglePlayPause,
    seekTo,
  ]);
}
