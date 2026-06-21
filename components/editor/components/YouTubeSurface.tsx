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
    <div className="relative bg-gray-100 dark:bg-gray-800 h-full rounded-t-xl">
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

      {/* Subtitle overlay — same placement/style as the local surface so both
          backends look consistent. `pointer-events-none` keeps the embed and
          its controls clickable underneath. */}
      {currentSubtitle && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg max-w-xs text-center font-medium shadow-lg border border-white/20 pointer-events-none">
          {currentSubtitle.text}
        </div>
      )}
    </div>
  );
}
