import type { SubtitleItem } from "@/lib/stores/subtitle-store";

// 시간 포맷팅 (mm:ss.ms)
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
};

// 타임라인 포맷팅 (m:ss)
export const formatTimelineTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// X 좌표에서 시간 계산
export const getTimeFromX = (
  x: number,
  timelineOffset: number,
  pixelsPerSecond: number
): number => {
  return timelineOffset + x / pixelsPerSecond;
};

// 시간에서 X 좌표 계산
export const getXFromTime = (
  time: number,
  timelineOffset: number,
  pixelsPerSecond: number
): number => {
  return (time - timelineOffset) * pixelsPerSecond;
};

// 시간 눈금 생성
export const generateTimeMarkers = (
  timelineOffset: number,
  pixelsPerSecond: number,
  timelineScale: number,
  timelineWidth: number
) => {
  const startTime = timelineOffset;
  const endTime = startTime + timelineWidth / pixelsPerSecond;
  const majorMarkers = [];
  const minorMarkers = [];

  // 주요 눈금 (1초 간격)
  for (let time = Math.floor(startTime); time <= Math.ceil(endTime); time++) {
    const x = (time - startTime) * pixelsPerSecond;
    if (x >= -50 && x <= timelineWidth + 50) {
      majorMarkers.push({ time, x });
    }
  }

  // 보조 눈금 (0.5초 간격, 줌이 클 때만)
  if (timelineScale >= 1) {
    for (
      let time = Math.floor(startTime * 2) / 2;
      time <= Math.ceil(endTime * 2) / 2;
      time += 0.5
    ) {
      if (time % 1 !== 0) {
        const x = (time - startTime) * pixelsPerSecond;
        if (x >= -50 && x <= timelineWidth + 50) {
          minorMarkers.push({ time, x });
        }
      }
    }
  }

  return { major: majorMarkers, minor: minorMarkers };
};

// 자막을 레이어별로 배치
export const arrangeSubtitlesInLayers = (
  subtitles: SubtitleItem[]
): SubtitleItem[][] => {
  const layers: SubtitleItem[][] = [];
  const sortedSubtitles = [...subtitles].sort(
    (a, b) => a.startTime - b.startTime
  );

  sortedSubtitles.forEach((subtitle) => {
    let placed = false;

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const lastSubtitle = layer[layer.length - 1];

      if (!lastSubtitle || lastSubtitle.endTime <= subtitle.startTime) {
        layer.push(subtitle);
        placed = true;
        break;
      }
    }

    if (!placed) {
      layers.push([subtitle]);
    }
  });

  return layers;
};

// 화면에 보이는 자막만 필터링 (가상화)
export const getVisibleSubtitles = (
  layers: SubtitleItem[][],
  timelineOffset: number,
  pixelsPerSecond: number,
  timelineWidth: number
) => {
  const visibleStartTime = timelineOffset - 1; // 1초 여유분
  const visibleEndTime = timelineOffset + timelineWidth / pixelsPerSecond + 1; // 1초 여유분

  return layers.map((layer) =>
    layer.filter(
      (subtitle) =>
        subtitle.endTime >= visibleStartTime &&
        subtitle.startTime <= visibleEndTime
    )
  );
};
