import type { SubtitleItem } from "@/lib/stores/subtitle-store";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";

// Reset the subtitle store to a known set of cues with no selection/editing.
// Pass `clearHistory` to also empty the undo/redo history (note: the seeding
// `setState` fires the coalescer's leading edge, so history-sensitive tests
// must also advance fake timers past the throttle window — see the store tests).
export function seedSubtitleStore(
  subtitles: SubtitleItem[],
  { clearHistory = true }: { clearHistory?: boolean } = {}
) {
  useSubtitleStore.setState({
    subtitles: subtitles.map((s) => ({ ...s })),
    selectedSubtitleId: null,
    editingSubtitleId: null,
  });
  if (clearHistory) {
    useSubtitleStore.temporal.getState().clear();
  }
}

// Reset the (non-persisted) video store to its initial playback state.
export function resetVideoStore() {
  useVideoStore.setState({
    video: {
      url: null,
      duration: 30,
      currentTime: 0,
      isPlaying: false,
      volume: 1,
    },
    videoRef: null,
  });
}
