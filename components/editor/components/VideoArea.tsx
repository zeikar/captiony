import type { SubtitleItem } from "@/lib/stores/subtitle-store";
import { VideoUploader } from "./VideoUploader";

interface VideoAreaProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoUrl: string | null;
  currentSubtitle: SubtitleItem | null;
  onVideoClick: () => void;
  onVideoSelect: (file: File) => void;
}

export function VideoArea({
  videoRef,
  videoUrl,
  currentSubtitle,
  onVideoClick,
  onVideoSelect,
}: VideoAreaProps) {
  return (
    <div className="relative bg-gray-100 dark:bg-gray-800 h-full rounded-t-xl">
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full max-h-full object-contain rounded-t-xl"
          onClick={onVideoClick}
        />
      ) : (
        <VideoUploader onVideoSelect={onVideoSelect} />
      )}

      {/* 자막 오버레이 */}
      {currentSubtitle && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg max-w-xs text-center font-medium shadow-lg border border-white/20">
          {currentSubtitle.text}
        </div>
      )}
    </div>
  );
}
