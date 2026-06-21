"use client";

import ReactPlayer from "react-player";
import type { SubtitleItem } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { useYouTubePlayer } from "../hooks/useYouTubePlayer";

interface YouTubeSurfaceProps {
  videoUrl: string;
  currentSubtitle: SubtitleItem | null;
}

export function YouTubeSurface({
  videoUrl,
  currentSubtitle,
}: YouTubeSurfaceProps) {
  const { video } = useVideoStore();
  const {
    playerRef,
    onReady,
    onDurationChange,
    onTimeUpdate,
    onPlay,
    onPause,
    onEnded,
    onSeeked,
    onError,
  } = useYouTubePlayer();

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800 rounded-t-xl">
      <div className="flex-1 min-h-0">
        <ReactPlayer
          ref={playerRef}
          src={videoUrl}
          playing={video.isPlaying}
          volume={video.volume}
          muted={video.volume === 0}
          controls={false}
          playsInline
          width="100%"
          height="100%"
          onReady={onReady}
          onDurationChange={onDurationChange}
          onTimeUpdate={onTimeUpdate}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          onSeeked={onSeeked}
          onError={onError}
        />
      </div>

      {/* Subtitle strip rendered below the embed (not an overlay) to respect
          YouTube ToS: the iframe, its controls, attribution and ads stay clear. */}
      {currentSubtitle && (
        <div className="flex-shrink-0 px-4 py-3 bg-black/80 text-white text-center font-medium">
          {currentSubtitle.text}
        </div>
      )}
    </div>
  );
}
