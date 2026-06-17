"use client";

import { useEffect } from "react";
import { VideoPlayer } from "./VideoPlayer";
import { SubtitleTimeline } from "./SubtitleTimeline";
import { SubtitleEditor } from "./SubtitleEditor";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

export function CaptionEditor() {
  // Enable keyboard shortcuts for the entire editor
  useKeyboardShortcuts();

  // Warn before leaving the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Set returnValue for legacy browser compatibility (deprecated but required)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top area: video player + subtitle editor */}
      <div className="flex-1 flex min-h-0">
        {/* Video player — left 2/3 */}
        <div className="flex-[2] p-4 pr-2">
          <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <VideoPlayer />
          </div>
        </div>

        {/* Subtitle editor — right 1/3 */}
        <div className="flex-[1] p-4 pl-2">
          <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <SubtitleEditor />
          </div>
        </div>
      </div>

      {/* Bottom area: timeline */}
      <div className="h-64 p-4 pt-0">
        <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <SubtitleTimeline />
        </div>
      </div>
    </div>
  );
}
