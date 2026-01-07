"use client";

import { useEffect } from "react";
import { VideoPlayer } from "./VideoPlayer";
import { SubtitleTimeline } from "./SubtitleTimeline";
import { SubtitleEditor } from "./SubtitleEditor";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

export function CaptionEditor() {
  // 전체 에디터에서 키보드 단축키 활성화
  useKeyboardShortcuts();

  // 페이지 나가기 전 경고 표시
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // 구형 브라우저 호환성을 위해 returnValue 설정 (deprecated이지만 필요)
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
