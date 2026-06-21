import type { SubtitleItem } from "@/lib/stores/subtitle-store";
import { VideoUploader } from "./VideoUploader";
import { LocalVideoSurface } from "./LocalVideoSurface";
import { YouTubeSurface } from "./YouTubeSurface";

interface VideoAreaProps {
  videoUrl: string | null;
  source: "local" | "youtube";
  currentSubtitle: SubtitleItem | null;
  onVideoSelect: (file: File) => void;
  onYouTubeSelect: (url: string) => void;
}

export function VideoArea({
  videoUrl,
  source,
  currentSubtitle,
  onVideoSelect,
  onYouTubeSelect,
}: VideoAreaProps) {
  // Branch on source so only the active surface mounts and registers a
  // controller — keeps the Rules of Hooks intact across backends.
  if (videoUrl && source === "youtube") {
    return (
      <YouTubeSurface videoUrl={videoUrl} currentSubtitle={currentSubtitle} />
    );
  }

  if (videoUrl && source === "local") {
    return (
      <LocalVideoSurface videoUrl={videoUrl} currentSubtitle={currentSubtitle} />
    );
  }

  return <VideoUploader onVideoSelect={onVideoSelect} onYouTubeSelect={onYouTubeSelect} />;
}
