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
    <div className="bg-black rounded-lg overflow-hidden shadow-lg">
      {/* 비디오 영역 */}
      <VideoArea
        videoRef={videoRef}
        videoUrl={video.url}
        currentSubtitle={currentSubtitle}
        onVideoClick={togglePlay}
      />

      {/* 컨트롤 바 */}
      <div className="bg-gray-900 p-4 space-y-3">
        {/* 프로그레스 바 */}
        <ProgressBar
          currentTime={video.currentTime}
          duration={video.duration}
          onSeek={handleSeek}
        />

        {/* 컨트롤 버튼들 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* 재생/일시정지 버튼 */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!video.url}
              aria-label={video.isPlaying ? "Pause" : "Play"}
            >
              {video.isPlaying ? (
                <PauseIcon className="h-8 w-8" />
              ) : (
                <PlayIcon className="h-8 w-8" />
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
            <div className="text-white text-sm font-medium">
              {progressPercentage}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
