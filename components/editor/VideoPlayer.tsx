"use client";

import { useRef, useEffect } from "react";
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/solid";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    video,
    setCurrentTime,
    setIsPlaying,
    setVideoDuration,
    setVolume,
    getCurrentSubtitle,
  } = useSubtitleStore();

  const currentSubtitle = getCurrentSubtitle();

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };

    const handleLoadedMetadata = () => {
      setVideoDuration(videoElement.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);

    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.removeEventListener("play", handlePlay);
      videoElement.removeEventListener("pause", handlePause);
    };
  }, [setCurrentTime, setVideoDuration, setIsPlaying]);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (video.isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  return (
    <div className="bg-black rounded-lg overflow-hidden">
      {/* Video Area */}
      <div className="relative">
        {video.url ? (
          <video
            ref={videoRef}
            src={video.url}
            className="w-full h-auto max-h-96"
            onClick={togglePlay}
          />
        ) : (
          <div className="w-full h-96 flex items-center justify-center bg-gray-800 text-gray-400">
            <div className="text-center">
              <CloudArrowUpIcon className="h-16 w-16 mx-auto mb-4" />
              <p>Upload a video to get started</p>
            </div>
          </div>
        )}

        {/* Current Subtitle Overlay */}
        {currentSubtitle && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg max-w-xs text-center">
            {currentSubtitle.text}
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-gray-900 p-4 space-y-3">
        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          <span className="text-white text-sm min-w-12">
            {formatTime(video.currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={video.duration || 100}
            value={video.currentTime}
            onChange={handleSeek}
            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-white text-sm min-w-12">
            {formatTime(video.duration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-blue-400 transition-colors"
              disabled={!video.url}
            >
              {video.isPlaying ? (
                <PauseIcon className="h-8 w-8" />
              ) : (
                <PlayIcon className="h-8 w-8" />
              )}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleVolumeChange({
                    target: { value: video.volume > 0 ? "0" : "1" },
                  } as any)
                }
                className="text-white hover:text-blue-400 transition-colors"
              >
                {video.volume > 0 ? (
                  <SpeakerWaveIcon className="h-6 w-6" />
                ) : (
                  <SpeakerXMarkIcon className="h-6 w-6" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={video.volume}
                onChange={handleVolumeChange}
                className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Current Time Display */}
          <div className="text-white text-sm">
            {video.duration > 0 && (
              <span>
                {Math.round((video.currentTime / video.duration) * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// CloudArrowUpIcon을 위한 임시 import (실제로는 heroicons에서 가져와야 함)
function CloudArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-4.5-4.5 0 014.5-4.5h.75a8.25 8.25 0 0116.5 0h.75a4.5 4.5 0 014.5 4.5 4.5 4.5 0 01-4.5 4.5H6.75z"
      />
    </svg>
  );
}
