import { useRef, useEffect, useCallback } from "react";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";

const SYNC_THRESHOLD = 0.1; // 0.1초 이상 차이날 때만 동기화

export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isSeekingRef = useRef(false);

  const { video, setCurrentTime, setIsPlaying, setVideoDuration, setVolume } =
    useSubtitleStore();

  // 비디오 이벤트 핸들러들
  const handleTimeUpdate = useCallback(() => {
    if (!isSeekingRef.current && videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, [setCurrentTime]);

  const handleLoadedMetadata = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    setVideoDuration(videoElement.duration);

    // 초기 시간 동기화
    if (video.currentTime !== videoElement.currentTime) {
      videoElement.currentTime = video.currentTime;
    }
  }, [setVideoDuration, video.currentTime]);

  const handleLoadedData = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // 데이터 로드 완료 후 초기 동기화
    if (
      Math.abs(video.currentTime - videoElement.currentTime) > SYNC_THRESHOLD
    ) {
      videoElement.currentTime = video.currentTime;
    }
  }, [video.currentTime]);

  const handlePlay = useCallback(() => setIsPlaying(true), [setIsPlaying]);
  const handlePause = useCallback(() => setIsPlaying(false), [setIsPlaying]);
  const handleSeeked = useCallback(() => {
    isSeekingRef.current = false;
  }, []);

  // 비디오 이벤트 리스너 설정
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !video.url) return;

    const events = [
      ["timeupdate", handleTimeUpdate],
      ["loadedmetadata", handleLoadedMetadata],
      ["loadeddata", handleLoadedData],
      ["play", handlePlay],
      ["pause", handlePause],
      ["seeked", handleSeeked],
    ] as const;

    // 이벤트 리스너 등록
    events.forEach(([event, handler]) => {
      videoElement.addEventListener(event, handler);
    });

    // 클린업
    return () => {
      events.forEach(([event, handler]) => {
        videoElement.removeEventListener(event, handler);
      });
    };
  }, [
    video.url,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleLoadedData,
    handlePlay,
    handlePause,
    handleSeeked,
  ]);

  // 외부에서 currentTime 변경 시 동기화
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !video.url) return;

    if (
      Math.abs(videoElement.currentTime - video.currentTime) > SYNC_THRESHOLD
    ) {
      isSeekingRef.current = true;
      videoElement.currentTime = video.currentTime;
    }
  }, [video.currentTime, video.url]);

  // 플레이어 컨트롤 함수들
  const togglePlay = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (video.isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play().catch(console.error);
    }
  }, [video.isPlaying]);

  const handleSeek = useCallback(
    (time: number) => {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      isSeekingRef.current = true;
      setCurrentTime(time);
      videoElement.currentTime = time;
    },
    [setCurrentTime]
  );

  const handleVolumeChange = useCallback(
    (volume: number) => {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      setVolume(volume);
      videoElement.volume = volume;
    },
    [setVolume]
  );

  const toggleMute = useCallback(() => {
    handleVolumeChange(video.volume > 0 ? 0 : 1);
  }, [video.volume, handleVolumeChange]);

  return {
    videoRef,
    video,
    togglePlay,
    handleSeek,
    handleVolumeChange,
    toggleMute,
  };
}
