"use client";

import { PlayIcon, PauseIcon } from "@heroicons/react/24/solid";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { calculateProgress } from "./utils/videoUtils";
import { VideoArea } from "./components/VideoArea";
import { ProgressBar } from "./components/ProgressBar";
import { VolumeControl } from "./components/VolumeControl";

export function VideoPlayer() {
  const { getCurrentSubtitle } = useSubtitleStore();
  const { video, setVideoUrl, togglePlayPause, seekTo, setVolume } =
    useVideoStore();

  const handleVideoSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url, "local");
  };

  const currentSubtitle = getCurrentSubtitle();
  const progressPercentage = calculateProgress(
    video.currentTime,
    video.duration
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
      {/* Video area */}
      <div className="flex-1 min-h-0">
        <VideoArea
          videoUrl={video.url}
          source={video.source}
          currentSubtitle={currentSubtitle}
          onVideoSelect={handleVideoSelect}
        />
      </div>

      {/* Control bar */}
      <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
        {/* Progress bar */}
        <ProgressBar
          currentTime={video.currentTime}
          duration={video.duration}
          onSeek={seekTo}
        />

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Play/Pause button */}
            <button
              onClick={togglePlayPause}
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

            {/* Volume control */}
            <VolumeControl
              volume={video.volume}
              onVolumeChange={setVolume}
              onToggleMute={() => setVolume(video.volume > 0 ? 0 : 1)}
            />
          </div>

          {/* Progress percentage */}
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
