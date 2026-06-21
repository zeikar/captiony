"use client";

import type { SubtitleItem } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { useVideoPlayer } from "../hooks/useVideoPlayer";

interface LocalVideoSurfaceProps {
  videoUrl: string;
  currentSubtitle: SubtitleItem | null;
}

export function LocalVideoSurface({
  videoUrl,
  currentSubtitle,
}: LocalVideoSurfaceProps) {
  // Keeps its ref/RAF/listeners/setVideoRef; we only consume the ref here.
  const { videoRef } = useVideoPlayer();
  const { togglePlayPause } = useVideoStore();

  return (
    <div className="relative bg-gray-100 dark:bg-gray-800 h-full rounded-t-xl">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full max-h-full object-contain rounded-t-xl"
        onClick={togglePlayPause}
      />

      {/* Subtitle overlay */}
      {currentSubtitle && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg max-w-xs text-center font-medium shadow-lg border border-white/20">
          {currentSubtitle.text}
        </div>
      )}
    </div>
  );
}
