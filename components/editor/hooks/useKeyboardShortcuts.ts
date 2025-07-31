"use client";

import { useEffect } from "react";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";

export function useKeyboardShortcuts() {
  const { selectedSubtitleId, subtitles, selectSubtitle, updateSubtitle } =
    useSubtitleStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return; // 입력 필드에서는 무시
      }

      switch (e.key) {
        case "Delete":
        case "Backspace":
          if (selectedSubtitleId) {
            // 자막 삭제는 SubtitleEditor에서 처리하도록 이벤트 전파
            return;
          }
          break;
        case "Escape":
          selectSubtitle(null);
          break;
        case "ArrowLeft":
          if (e.shiftKey && selectedSubtitleId) {
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
          }
          break;
        case "ArrowRight":
          if (e.shiftKey && selectedSubtitleId) {
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
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedSubtitleId, subtitles, selectSubtitle, updateSubtitle]);
}
