"use client";

import { VideoPlayer } from "./VideoPlayer";
import { SubtitleTimeline } from "./SubtitleTimeline";
import { SubtitleEditor } from "./SubtitleEditor";
import { useVideoStore } from "@/lib/stores/video-store";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

export function CaptionEditor() {
  const { video } = useVideoStore();

  // 전체 에디터에서 키보드 단축키 활성화
  useKeyboardShortcuts();

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 상단 영역: 비디오 플레이어 + 자막 편집기 */}
      <div className="flex-1 flex min-h-0">
        {/* 비디오 플레이어 - 좌측 2/3 */}
        <div className="flex-[2] p-4 pr-2">
          <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <VideoPlayer />
          </div>
        </div>

        {/* 자막 편집기 - 우측 1/3 */}
        <div className="flex-[1] p-4 pl-2">
          <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <SubtitleEditor />
          </div>
        </div>
      </div>

      {/* 하단 영역: 타임라인 */}
      <div className="h-64 p-4 pt-0">
        <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <SubtitleTimeline />
        </div>
      </div>
    </div>
  );
}
