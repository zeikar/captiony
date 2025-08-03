"use client";

import { PlayIcon, PauseIcon } from "@heroicons/react/24/solid";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoPlayer } from "./hooks/useVideoPlayer";
import { calculateProgress } from "./utils/videoUtils";
import { VideoArea } from "./components/VideoArea";
import { ProgressBar } from "./components/ProgressBar";
import { VolumeControl } from "./components/VolumeControl";

export function VideoPlayer() {
  const { getCurrentSubtitle } = useSubtitleStore();
  const {
    videoRef,
    video,
    togglePlay,
    handleSeek,
    handleVolumeChange,
    toggleMute,
  } = useVideoPlayer();

  const currentSubtitle = getCurrentSubtitle();
  const progressPercentage = calculateProgress(
    video.currentTime,
    video.duration
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700">
      {/* 비디오 영역 */}
      <VideoArea
        videoRef={videoRef}
        videoUrl={video.url}
        currentSubtitle={currentSubtitle}
        onVideoClick={togglePlay}
      />

      {/* 컨트롤 바 */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
        {/* 프로그레스 바 */}
        <ProgressBar
          currentTime={video.currentTime}
          duration={video.duration}
          onSeek={handleSeek}
        />

        {/* 컨트롤 버튼들 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* 재생/일시정지 버튼 */}
            <button
              onClick={togglePlay}
              className="group flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-gray-700 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              disabled={!video.url}
              aria-label={video.isPlaying ? "Pause" : "Play"}
            >
              {video.isPlaying ? (
                <PauseIcon className="h-5 w-5" />
              ) : (
                <PlayIcon className="h-5 w-5 ml-0.5" />
              )}
            </button>

            {/* 볼륨 컨트롤 */}
            <VolumeControl
              volume={video.volume}
              onVolumeChange={handleVolumeChange}
              onToggleMute={toggleMute}
            />
          </div>

          {/* 진행률 표시 */}
          {video.duration > 0 && (
            <div className="text-gray-600 dark:text-gray-400 text-sm font-medium bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
              {progressPercentage}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
