"use client";

import { useEffect } from "react";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";

export function useKeyboardShortcuts() {
  const {
    selectedSubtitleId,
    subtitles,
    selectSubtitle,
    updateSubtitle,
    deleteSubtitle,
    addSubtitle,
    setEditingSubtitle,
  } = useSubtitleStore();

  const { video, setCurrentTime, togglePlayPause, seekTo } = useVideoStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서는 무시 (단, 일부 키는 허용)
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        // 입력 필드에서도 Escape는 허용
        if (e.key !== "Escape") {
          return;
        }
      }

      switch (e.key) {
        case " ": // 스페이스바 - 재생/일시정지
          e.preventDefault();
          togglePlayPause();
          break;
        case "Delete":
        case "Backspace":
          if (selectedSubtitleId) {
            deleteSubtitle(selectedSubtitleId);
            e.preventDefault();
          }
          break;
        case "Escape":
          selectSubtitle(null);
          break;
        case "ArrowUp":
          // 이전 자막 선택
          if (subtitles.length > 0) {
            const sortedSubtitles = [...subtitles].sort(
              (a, b) => a.startTime - b.startTime
            );
            if (selectedSubtitleId) {
              const currentIndex = sortedSubtitles.findIndex(
                (s) => s.id === selectedSubtitleId
              );
              if (currentIndex > 0) {
                const prevSubtitle = sortedSubtitles[currentIndex - 1];
                selectSubtitle(prevSubtitle.id);
                setCurrentTime(prevSubtitle.startTime);
              }
            } else if (sortedSubtitles.length > 0) {
              const firstSubtitle = sortedSubtitles[0];
              selectSubtitle(firstSubtitle.id);
              setCurrentTime(firstSubtitle.startTime);
            }
            e.preventDefault();
          }
          break;
        case "ArrowDown":
          // 다음 자막 선택
          if (subtitles.length > 0) {
            const sortedSubtitles = [...subtitles].sort(
              (a, b) => a.startTime - b.startTime
            );
            if (selectedSubtitleId) {
              const currentIndex = sortedSubtitles.findIndex(
                (s) => s.id === selectedSubtitleId
              );
              if (currentIndex < sortedSubtitles.length - 1) {
                const nextSubtitle = sortedSubtitles[currentIndex + 1];
                selectSubtitle(nextSubtitle.id);
                setCurrentTime(nextSubtitle.startTime);
              }
            } else if (sortedSubtitles.length > 0) {
              const firstSubtitle = sortedSubtitles[0];
              selectSubtitle(firstSubtitle.id);
              setCurrentTime(firstSubtitle.startTime);
            }
            e.preventDefault();
          }
          break;
        case "ArrowLeft":
          if (e.shiftKey && selectedSubtitleId) {
            // Shift + 왼쪽 화살표: 자막을 왼쪽으로 이동 (시간 단축)
            const subtitle = subtitles.find((s) => s.id === selectedSubtitleId);
            if (subtitle) {
              const duration = subtitle.endTime - subtitle.startTime;
              const newStartTime = Math.max(0, subtitle.startTime - 0.1);
              updateSubtitle(selectedSubtitleId, {
                startTime: newStartTime,
                endTime: newStartTime + duration,
              });
            }
            e.preventDefault();
          } else {
            // 왼쪽 화살표: 5초 뒤로
            const newTime = Math.max(0, video.currentTime - 5);
            seekTo(newTime);
            e.preventDefault();
          }
          break;
        case "ArrowRight":
          if (e.shiftKey && selectedSubtitleId) {
            // Shift + 오른쪽 화살표: 자막을 오른쪽으로 이동 (시간 증가)
            const subtitle = subtitles.find((s) => s.id === selectedSubtitleId);
            if (subtitle) {
              const duration = subtitle.endTime - subtitle.startTime;
              const newStartTime = subtitle.startTime + 0.1;
              updateSubtitle(selectedSubtitleId, {
                startTime: newStartTime,
                endTime: newStartTime + duration,
              });
            }
            e.preventDefault();
          } else {
            // 오른쪽 화살표: 5초 앞으로
            const maxTime = video.duration || video.currentTime + 5;
            const newTime = Math.min(maxTime, video.currentTime + 5);
            seekTo(newTime);
            e.preventDefault();
          }
          break;
        case "Enter":
          if (e.metaKey || e.ctrlKey) {
            // Cmd/Ctrl + Enter: 새 자막 추가
            const currentTime = video.currentTime;
            const newSubtitle = {
              text: "",
              startTime: currentTime,
              endTime: currentTime + 2,
            };
            const newSubtitleId = addSubtitle(newSubtitle);
            if (newSubtitleId) {
              selectSubtitle(newSubtitleId);
              // 새로 생성된 자막을 자동으로 편집 모드로 설정
              setTimeout(() => setEditingSubtitle(newSubtitleId), 0);
            }
            e.preventDefault();
          } else if (selectedSubtitleId && !e.shiftKey && !e.altKey) {
            // Enter: 선택된 자막을 편집 모드로 설정
            setEditingSubtitle(selectedSubtitleId);
            e.preventDefault();
          }
          break;
        case "n":
        case "N":
          // N 키: 현재 재생 위치에 새 자막 추가
          if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            const currentTime = video.currentTime;
            const newSubtitle = {
              text: "",
              startTime: currentTime,
              endTime: currentTime + 2,
            };
            const newSubtitleId = addSubtitle(newSubtitle);
            if (newSubtitleId) {
              selectSubtitle(newSubtitleId);
              // 새로 생성된 자막을 자동으로 편집 모드로 설정
              setTimeout(() => setEditingSubtitle(newSubtitleId), 0);
            }
            e.preventDefault();
          }
          break;
        case "i":
        case "I":
          // I 키: In point - 선택된 자막의 시작 시간을 현재 재생 위치로 설정
          if (
            !e.metaKey &&
            !e.ctrlKey &&
            !e.shiftKey &&
            !e.altKey &&
            selectedSubtitleId
          ) {
            const subtitle = subtitles.find((s) => s.id === selectedSubtitleId);
            if (subtitle) {
              const currentTime = video.currentTime;
              // 끝 시간보다 늦지 않도록 제한
              const newStartTime = Math.min(
                currentTime,
                subtitle.endTime - 0.1
              );
              updateSubtitle(selectedSubtitleId, {
                startTime: Math.max(0, newStartTime),
              });
            }
            e.preventDefault();
          }
          break;
        case "o":
        case "O":
          // O 키: Out point - 선택된 자막의 끝 시간을 현재 재생 위치로 설정
          if (
            !e.metaKey &&
            !e.ctrlKey &&
            !e.shiftKey &&
            !e.altKey &&
            selectedSubtitleId
          ) {
            const subtitle = subtitles.find((s) => s.id === selectedSubtitleId);
            if (subtitle) {
              const currentTime = video.currentTime;
              // 시작 시간보다 빠르지 않도록 제한
              const newEndTime = Math.max(
                currentTime,
                subtitle.startTime + 0.1
              );
              updateSubtitle(selectedSubtitleId, {
                endTime: newEndTime,
              });
            }
            e.preventDefault();
          }
          break;
        case "s":
        case "S":
          // S 키: 자막 분할 - 현재 재생 위치에서 선택된 자막을 두 개로 분할
          if (
            !e.metaKey &&
            !e.ctrlKey &&
            !e.shiftKey &&
            !e.altKey &&
            selectedSubtitleId
          ) {
            const subtitle = subtitles.find((s) => s.id === selectedSubtitleId);
            if (subtitle) {
              const currentTime = video.currentTime;
              // 현재 시간이 자막 범위 내에 있을 때만 분할
              if (
                currentTime > subtitle.startTime &&
                currentTime < subtitle.endTime
              ) {
                // 기존 자막의 끝 시간을 현재 시간으로 변경
                updateSubtitle(selectedSubtitleId, {
                  endTime: currentTime,
                });

                // 새로운 자막 추가
                const newSubtitle = {
                  text: subtitle.text,
                  startTime: currentTime,
                  endTime: subtitle.endTime,
                };
                const newSubtitleId = addSubtitle(newSubtitle);
                if (newSubtitleId) {
                  selectSubtitle(newSubtitleId);
                }
              }
            }
            e.preventDefault();
          }
          break;
        case "m":
        case "M":
          // M 키: 현재 재생 위치에서 가장 가까운 자막으로 이동 및 선택
          if (
            !e.metaKey &&
            !e.ctrlKey &&
            !e.shiftKey &&
            !e.altKey &&
            subtitles.length > 0
          ) {
            const currentTime = video.currentTime;
            let closestSubtitle = subtitles[0];
            let minDistance = Math.abs(closestSubtitle.startTime - currentTime);

            // 가장 가까운 자막 찾기 (시작 시간 기준)
            subtitles.forEach((subtitle) => {
              const distance = Math.abs(subtitle.startTime - currentTime);
              if (distance < minDistance) {
                minDistance = distance;
                closestSubtitle = subtitle;
              }
            });

            selectSubtitle(closestSubtitle.id);
            setCurrentTime(closestSubtitle.startTime);
            e.preventDefault();
          }
          break;
        case "j":
        case "J":
          // J 키: 1초 뒤로 (더 정밀한 탐색)
          if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            const newTime = Math.max(0, video.currentTime - 1);
            seekTo(newTime);
            e.preventDefault();
          }
          break;
        case "k":
        case "K":
          // K 키: 재생/일시정지 (스페이스바 대안)
          if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            togglePlayPause();
            e.preventDefault();
          }
          break;
        case "l":
        case "L":
          // L 키: 1초 앞으로 (더 정밀한 탐색)
          if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            const maxTime = video.duration || video.currentTime + 1;
            const newTime = Math.min(maxTime, video.currentTime + 1);
            seekTo(newTime);
            e.preventDefault();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedSubtitleId,
    subtitles,
    selectSubtitle,
    updateSubtitle,
    deleteSubtitle,
    addSubtitle,
    setEditingSubtitle,
    video,
    setCurrentTime,
    togglePlayPause,
    seekTo,
  ]);
}
