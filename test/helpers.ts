import type { SubtitleItem } from "@/lib/stores/subtitle-store";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";

// Reset the subtitle store to a known set of cues (no selection/editing) and
// empty the undo/redo history. Note: the seeding `setState` itself fires the
// coalescer's leading edge, so history-sensitive tests must also advance fake
// timers past the throttle window before asserting — see the store tests.
export function seedSubtitleStore(subtitles: SubtitleItem[]) {
  useSubtitleStore.setState({
    subtitles: subtitles.map((s) => ({ ...s })),
    selectedSubtitleId: null,
    editingSubtitleId: null,
  });
  useSubtitleStore.temporal.getState().clear();
}

// Reset the (non-persisted) video store to its initial playback state.
export function resetVideoStore() {
  useVideoStore.setState({
    video: {
      url: null,
      source: "local",
      duration: 30,
      currentTime: 0,
      isPlaying: false,
      volume: 1,
    },
    videoRef: null,
  });
}
