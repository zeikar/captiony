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
    <div className="relative bg-gray-100 dark:bg-gray-800 h-full rounded-t-xl">
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full max-h-full object-contain rounded-t-xl"
          onClick={onVideoClick}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 text-gray-500 dark:text-gray-400 rounded-t-xl">
          <div className="text-center">
            <div className="bg-white dark:bg-gray-700 rounded-full p-6 mb-4 shadow-lg border border-gray-200 dark:border-gray-600 inline-block">
              <CloudArrowUpIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
              Upload a video to get started
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Drag and drop or click to upload your video file
            </p>
          </div>
        </div>
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
