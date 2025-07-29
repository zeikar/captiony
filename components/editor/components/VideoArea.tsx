import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import type { SubtitleItem } from "@/lib/stores/subtitle-store";

interface VideoAreaProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoUrl: string | null;
  currentSubtitle: SubtitleItem | null;
  onVideoClick: () => void;
}

export function VideoArea({
  videoRef,
  videoUrl,
  currentSubtitle,
  onVideoClick,
}: VideoAreaProps) {
  return (
    <div className="relative">
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-auto max-h-96"
          onClick={onVideoClick}
        />
      ) : (
        <div className="w-full h-96 flex items-center justify-center bg-gray-800 text-gray-400">
          <div className="text-center">
            <CloudArrowUpIcon className="h-16 w-16 mx-auto mb-4" />
            <p>Upload a video to get started</p>
          </div>
        </div>
      )}

      {/* 자막 오버레이 */}
      {currentSubtitle && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg max-w-xs text-center">
          {currentSubtitle.text}
        </div>
      )}
    </div>
  );
}
