import { useRef, useEffect, useCallback } from "react";
import { useVideoStore } from "@/lib/stores/video-store";

const SYNC_THRESHOLD = 0.1; // 0.1초 이상 차이날 때만 동기화

export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isSeekingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  const {
    video,
    setCurrentTime,
    setCurrentTimeSmooth,
    setIsPlaying,
    setVideoDuration,
    setVolume,
    setVideoRef,
  } = useVideoStore();

  // videoRef를 store에 등록
  useEffect(() => {
    setVideoRef(videoRef);
  }, [setVideoRef]);

  // 부드러운 시간 업데이트를 위한 애니메이션 프레임 기반 업데이트
  const updateCurrentTime = useCallback(() => {
    if (!isSeekingRef.current && videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      setCurrentTimeSmooth(currentTime); // 부드러운 업데이트 사용

      // 비디오가 재생 중일 때만 연속 업데이트
      if (!videoRef.current.paused) {
        animationFrameRef.current = requestAnimationFrame(updateCurrentTime);
      }
    }
  }, [setCurrentTimeSmooth]);

  // 비디오 이벤트 핸들러들
  const handleTimeUpdate = useCallback(() => {
    // timeupdate 이벤트는 애니메이션 프레임 기반 업데이트를 시작하는 트리거로만 사용
    if (!isSeekingRef.current && videoRef.current && !videoRef.current.paused) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      updateCurrentTime();
    } else if (isSeekingRef.current && videoRef.current) {
      // seeking 중일 때는 즉시 업데이트 (부드러운 업데이트 아님)
      setCurrentTime(videoRef.current.currentTime);
    }
  }, [setCurrentTime, updateCurrentTime]);

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

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    // 재생 시작 시 애니메이션 프레임 기반 업데이트 시작
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    updateCurrentTime();
  }, [setIsPlaying, updateCurrentTime]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    // 일시정지 시 애니메이션 프레임 취소
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [setIsPlaying]);

  const handleSeeked = useCallback(() => {
    isSeekingRef.current = false;
    // seek 완료 후 재생 중이면 애니메이션 재시작
    if (videoRef.current && !videoRef.current.paused) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      updateCurrentTime();
    }
  }, [updateCurrentTime]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    // 비디오 끝날 때 정확히 duration으로 설정
    if (videoRef.current) {
      setCurrentTime(videoRef.current.duration);
    }
    // 애니메이션 프레임 취소
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [setIsPlaying, setCurrentTime]);

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
      ["ended", handleEnded],
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
    handleEnded,
  ]);

  // 컴포넌트 언마운트 시 애니메이션 프레임 정리
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
