"use client";

import { useEffect } from "react";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";

export function useKeyboardShortcuts() {
  const {
    selectedSubtitleId,
    selectedIds,
    subtitles,
    selectSubtitle,
    selectAllSubtitles,
    clearSelection,
    updateSubtitle,
    deleteSelectedSubtitles,
    addSubtitle,
    setEditingSubtitle,
    nudgeSelectedSubtitles,
  } = useSubtitleStore();

  const { video, setCurrentTime, togglePlayPause, seekTo } = useVideoStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events from input fields, except for some keys
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        // Allow Escape even inside input fields
        if (e.key !== "Escape") {
          return;
        }
      }

      // Cmd/Ctrl+Z: undo; Cmd/Ctrl+Shift+Z: redo
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          useSubtitleStore.temporal.getState().redo();
        } else {
          useSubtitleStore.temporal.getState().undo();
        }
        e.preventDefault();
        return;
      }

      // Cmd/Ctrl+A: 전체 자막 선택
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "a") {
        selectAllSubtitles();
        e.preventDefault();
        return;
      }

      switch (e.key) {
        case " ": // Spacebar — play/pause
          e.preventDefault();
          togglePlayPause();
          break;
        case "Delete":
        case "Backspace":
          if (selectedIds.length > 0) {
            deleteSelectedSubtitles();
            e.preventDefault();
          }
          break;
        case "Escape":
          clearSelection();
          break;
        case "ArrowUp":
          // Select previous subtitle
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
          // Select next subtitle
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
          if (e.shiftKey && selectedIds.length > 0) {
            // Shift + Left: 선택된 모든 자막을 0.1초 앞으로 이동
            nudgeSelectedSubtitles(-0.1);
            e.preventDefault();
          } else {
            // Left arrow: seek back 5 seconds
            const newTime = Math.max(0, video.currentTime - 5);
            seekTo(newTime);
            e.preventDefault();
          }
          break;
        case "ArrowRight":
          if (e.shiftKey && selectedIds.length > 0) {
            // Shift + Right: 선택된 모든 자막을 0.1초 뒤로 이동
            nudgeSelectedSubtitles(0.1);
            e.preventDefault();
          } else {
            // Right arrow: seek forward 5 seconds
            const maxTime = video.duration || video.currentTime + 5;
            const newTime = Math.min(maxTime, video.currentTime + 5);
            seekTo(newTime);
            e.preventDefault();
          }
          break;
        case "Enter":
          if (e.metaKey || e.ctrlKey) {
            // Cmd/Ctrl + Enter: add new subtitle
            const currentTime = video.currentTime;
            const newSubtitle = {
              text: "",
              startTime: currentTime,
              endTime: currentTime + 2,
            };
            const newSubtitleId = addSubtitle(newSubtitle);
            if (newSubtitleId) {
              selectSubtitle(newSubtitleId);
              // Automatically enter edit mode for the newly created subtitle
              setTimeout(() => setEditingSubtitle(newSubtitleId), 0);
            }
            e.preventDefault();
          } else if (selectedSubtitleId && !e.shiftKey && !e.altKey) {
            // Enter: open the selected subtitle in edit mode
            setEditingSubtitle(selectedSubtitleId);
            e.preventDefault();
          }
          break;
        case "n":
        case "N":
          // N key: add new subtitle at the current playback position
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
              // Automatically enter edit mode for the newly created subtitle
              setTimeout(() => setEditingSubtitle(newSubtitleId), 0);
            }
            e.preventDefault();
          }
          break;
        case "i":
        case "I":
          // I key: In point — set selected subtitle's start time to current playback position
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
              // Clamp to not exceed end time
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
          // O key: Out point — set selected subtitle's end time to current playback position
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
              // Clamp to not precede start time
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
          // S key: split selected subtitle at the current playback position
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
              // Only split when current time falls within the subtitle's range
              if (
                currentTime > subtitle.startTime &&
                currentTime < subtitle.endTime
              ) {
                // Trim the existing subtitle's end to the current time
                updateSubtitle(selectedSubtitleId, {
                  endTime: currentTime,
                });

                // Add the new subtitle for the second half
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
          // M key: navigate to and select the subtitle nearest to the current playback position
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

            // Find the closest subtitle by start time
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
          // J key: seek back 1 second (finer control)
          if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            const newTime = Math.max(0, video.currentTime - 1);
            seekTo(newTime);
            e.preventDefault();
          }
          break;
        case "k":
        case "K":
          // K key: play/pause (alternative to spacebar)
          if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            togglePlayPause();
            e.preventDefault();
          }
          break;
        case "l":
        case "L":
          // L key: seek forward 1 second (finer control)
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
    selectedIds,
    subtitles,
    selectSubtitle,
    selectAllSubtitles,
    clearSelection,
    updateSubtitle,
    deleteSelectedSubtitles,
    addSubtitle,
    setEditingSubtitle,
    nudgeSelectedSubtitles,
    video,
    setCurrentTime,
    togglePlayPause,
    seekTo,
  ]);
}
