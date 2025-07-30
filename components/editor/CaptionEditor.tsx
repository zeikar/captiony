"use client";

import { VideoPlayer } from "./VideoPlayer";
import { SubtitleTimeline } from "./SubtitleTimeline";
import { SubtitleEditor } from "./SubtitleEditor";
import { ToolBar } from "./ToolBar";
import { useVideoStore } from "@/lib/stores/video-store";

export function CaptionEditor() {
  const { video } = useVideoStore();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* 툴바 */}
      <ToolBar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* 비디오 플레이어 - 2/3 너비 */}
        <div className="lg:col-span-2">
          <VideoPlayer />
        </div>

        {/* 자막 편집기 - 1/3 너비 */}
        <div className="lg:col-span-1">
          <SubtitleEditor />
        </div>
      </div>

      {/* 타임라인 - 전체 너비 */}
      <div className="mt-6">
        <SubtitleTimeline />
      </div>
    </div>
  );
}
