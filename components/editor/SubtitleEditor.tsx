"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { SubtitleItem } from "./components/SubtitleItem";
import { EmptyState } from "./components/EmptyState";
import { KeyboardShortcutsHelp } from "./components/KeyboardShortcutsHelp";
import type { SubtitleItem as SubtitleItemType } from "@/lib/stores/subtitle-store";

// 가상 스크롤 상수
const VIRTUAL_SCROLL_CONFIG = {
  ITEM_HEIGHT: 180,
  VISIBLE_ITEMS: 10,
  BUFFER_SIZE: 5,
} as const;

// 유틸리티 함수들
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, "0")}.${ms
    .toString()
    .padStart(2, "0")}`;
};

const findCurrentSubtitleId = (
  subtitles: SubtitleItemType[],
  currentTime: number
): string | null => {
  if (subtitles.length === 0) return null;

  // Binary search for better performance
  let left = 0;
  let right = subtitles.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const sub = subtitles[mid];

    if (currentTime >= sub.startTime && currentTime <= sub.endTime) {
      return sub.id;
    } else if (currentTime < sub.startTime) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  // Fallback to linear search if binary search fails
  const foundSub = subtitles.find(
    (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
  );
  return foundSub?.id || null;
};

export function SubtitleEditor() {
  // Store 훅들
  const subtitles = useSubtitleStore((s) => s.subtitles);
  const selectedSubtitleId = useSubtitleStore((s) => s.selectedSubtitleId);
  const editingSubtitleId = useSubtitleStore((s) => s.editingSubtitleId);
  const updateSubtitle = useSubtitleStore((s) => s.updateSubtitle);
  const deleteSubtitle = useSubtitleStore((s) => s.deleteSubtitle);
  const selectSubtitle = useSubtitleStore((s) => s.selectSubtitle);
  const addSubtitle = useSubtitleStore((s) => s.addSubtitle);
  const setEditingSubtitle = useSubtitleStore((s) => s.setEditingSubtitle);

  const currentTime = useVideoStore((s) => s.video.currentTime);
  const isPlaying = useVideoStore((s) => s.video.isPlaying);
  const setCurrentTime = useVideoStore((s) => s.setCurrentTime);

  // 상태들
  const [searchTerm, setSearchTerm] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [scrollTop, setScrollTop] = useState(0);

  // Refs
  const subtitleRefs = useRef(new Map<string, HTMLDivElement>());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef({
    lastProcessedSubtitleId: null as string | null,
    isProcessing: false,
  });

  // 계산된 값들
  const currentSubtitleId = useMemo(
    () => findCurrentSubtitleId(subtitles, currentTime),
    [subtitles, currentTime]
  );

  const currentSubtitle = useMemo(() => {
    if (!currentSubtitleId) return null;
    return subtitles.find((sub) => sub.id === currentSubtitleId) || null;
  }, [subtitles, currentSubtitleId]);

  const { filteredSubtitles, sortedFilteredSubtitles } = useMemo(() => {
    let filtered = subtitles;

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = subtitles.filter((subtitle) =>
        subtitle.text.toLowerCase().includes(query)
      );
    }

    // 이미 정렬되어 있다면 정렬 건너뛰기
    const isAlreadySorted =
      filtered.length <= 1 ||
      filtered.every(
        (sub, i) => i === 0 || sub.startTime >= filtered[i - 1].startTime
      );

    const sorted = isAlreadySorted
      ? filtered
      : [...filtered].sort((a, b) => a.startTime - b.startTime);

    return { filteredSubtitles: filtered, sortedFilteredSubtitles: sorted };
  }, [subtitles, searchTerm]);

  // 가상 스크롤 계산
  const visibleRange = useMemo(() => {
    const { ITEM_HEIGHT, VISIBLE_ITEMS, BUFFER_SIZE } = VIRTUAL_SCROLL_CONFIG;
    const containerHeight = VISIBLE_ITEMS * ITEM_HEIGHT;
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE
    );
    const endIndex = Math.min(
      sortedFilteredSubtitles.length - 1,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
    );

    return { startIndex, endIndex };
  }, [scrollTop, sortedFilteredSubtitles.length]);

  const visibleSubtitles = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return sortedFilteredSubtitles
      .slice(startIndex, endIndex + 1)
      .map((subtitle, index) => ({
        subtitle,
        actualIndex: startIndex + index + 1,
      }));
  }, [sortedFilteredSubtitles, visibleRange]);

  const totalHeight =
    sortedFilteredSubtitles.length * VIRTUAL_SCROLL_CONFIG.ITEM_HEIGHT;
  const { startIndex } = visibleRange;

  // 이벤트 핸들러들
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const handleSubtitleSelect = useCallback(
    (subtitle: SubtitleItemType) => {
      selectSubtitle(subtitle.id);
      setCurrentTime(subtitle.startTime);
    },
    [selectSubtitle, setCurrentTime]
  );

  const handleEdit = useCallback(
    (subtitle: SubtitleItemType) => {
      handleSubtitleSelect(subtitle);
      setEditingSubtitle(subtitle.id);
    },
    [handleSubtitleSelect, setEditingSubtitle]
  );

  const handleSave = useCallback(
    (id: string, newText: string) => {
      updateSubtitle(id, { text: newText });
      setEditingSubtitle(null);
    },
    [updateSubtitle, setEditingSubtitle]
  );

  const handleCancel = useCallback(() => {
    setEditingSubtitle(null);
  }, [setEditingSubtitle]);

  const handleTimeChange = useCallback(
    (id: string, field: "startTime" | "endTime", value: string) => {
      const timeValue = parseFloat(value) || 0;
      updateSubtitle(id, { [field]: timeValue });
    },
    [updateSubtitle]
  );

  const handleAddSubtitle = useCallback(() => {
    const newSubtitle = {
      text: "",
      startTime: 0,
      endTime: 2,
    };
    const newSubtitleId = addSubtitle(newSubtitle);

    if (newSubtitleId) {
      selectSubtitle(newSubtitleId);
      setEditingSubtitle(newSubtitleId);
    }
  }, [addSubtitle, selectSubtitle, setEditingSubtitle]);

  const handleAutoScrollToggle = useCallback(() => {
    setAutoScroll((prev) => {
      autoScrollRef.current = {
        lastProcessedSubtitleId: null,
        isProcessing: false,
      };
      return !prev;
    });
  }, []);

  const autoScrollToSubtitle = useCallback(
    (subtitleId: string) => {
      if (!scrollContainerRef.current) return;

      // 가상 스크롤 환경에서는 인덱스를 찾아서 직접 스크롤 위치 계산
      const subtitleIndex = sortedFilteredSubtitles.findIndex(
        (sub) => sub.id === subtitleId
      );

      if (subtitleIndex === -1) return;

      const { ITEM_HEIGHT } = VIRTUAL_SCROLL_CONFIG;
      const container = scrollContainerRef.current;
      const currentScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      // 현재 보이는 범위 계산
      const visibleStartIndex = Math.floor(currentScrollTop / ITEM_HEIGHT);
      const visibleEndIndex = Math.ceil(
        (currentScrollTop + containerHeight) / ITEM_HEIGHT
      );

      // 선택된 자막이 이미 보이는 범위에 있는지 확인
      if (
        subtitleIndex >= visibleStartIndex &&
        subtitleIndex <= visibleEndIndex
      ) {
        return; // 이미 보이므로 스크롤하지 않음
      }

      const targetScrollTop = subtitleIndex * ITEM_HEIGHT;
      // 선택된 항목이 화면 중앙에 오도록 스크롤 위치 조정
      const centeredScrollTop =
        targetScrollTop - containerHeight / 2 + ITEM_HEIGHT / 2;

      container.scrollTo({
        top: Math.max(0, centeredScrollTop),
        behavior: "smooth",
      });
    },
    [sortedFilteredSubtitles]
  );

  // Effects
  useEffect(() => {
    if (selectedSubtitleId) {
      // 약간의 지연을 두어 가상 스크롤 렌더링이 완료된 후 스크롤
      const timeoutId = setTimeout(() => {
        autoScrollToSubtitle(selectedSubtitleId);
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedSubtitleId, autoScrollToSubtitle]);

  useEffect(() => {
    if (!autoScroll || !isPlaying || !currentSubtitleId) {
      return;
    }

    if (
      autoScrollRef.current.lastProcessedSubtitleId === currentSubtitleId ||
      selectedSubtitleId === currentSubtitleId ||
      autoScrollRef.current.isProcessing
    ) {
      if (selectedSubtitleId === currentSubtitleId) {
        autoScrollRef.current.lastProcessedSubtitleId = currentSubtitleId;
      }
      return;
    }

    autoScrollRef.current.isProcessing = true;
    autoScrollRef.current.lastProcessedSubtitleId = currentSubtitleId;

    requestAnimationFrame(() => {
      selectSubtitle(currentSubtitleId);
      autoScrollRef.current.isProcessing = false;
    });
  }, [
    currentSubtitleId,
    autoScroll,
    isPlaying,
    selectedSubtitleId,
    selectSubtitle,
  ]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-xl">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Subtitles
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredSubtitles.length} of {subtitles.length} items
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 자동 스크롤 토글 */}
          <button
            onClick={handleAutoScrollToggle}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              autoScroll
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title={autoScroll ? "Auto-scroll enabled" : "Auto-scroll disabled"}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                autoScroll ? "bg-blue-500" : "bg-gray-400"
              }`}
            />
            Auto-scroll
          </button>

          {/* 키보드 단축키 도움말 */}
          <KeyboardShortcutsHelp />

          <button
            onClick={handleAddSubtitle}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
          >
            <PlusIcon className="h-4 w-4" />
            Add Subtitle
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search subtitles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            )}
          </div>
          <button className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
            <FunnelIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Subtitle List - 가상 스크롤 적용 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4"
        onScroll={handleScroll}
      >
        {filteredSubtitles.length === 0 ? (
          <EmptyState
            type={subtitles.length === 0 ? "no-subtitles" : "no-results"}
            onAddSubtitle={
              subtitles.length === 0 ? handleAddSubtitle : undefined
            }
          />
        ) : (
          <div style={{ height: `${totalHeight}px`, position: "relative" }}>
            <div
              style={{
                transform: `translateY(${
                  startIndex * VIRTUAL_SCROLL_CONFIG.ITEM_HEIGHT
                }px)`,
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
              }}
            >
              {visibleSubtitles.map(
                ({
                  subtitle,
                  actualIndex,
                }: {
                  subtitle: SubtitleItemType;
                  actualIndex: number;
                }) => (
                  <div
                    key={subtitle.id}
                    style={{
                      height: `${VIRTUAL_SCROLL_CONFIG.ITEM_HEIGHT}px`,
                      marginBottom: "12px",
                    }}
                    ref={(el) => {
                      if (el) {
                        subtitleRefs.current.set(subtitle.id, el);
                      } else {
                        subtitleRefs.current.delete(subtitle.id);
                      }
                    }}
                  >
                    <SubtitleItem
                      subtitle={subtitle}
                      index={actualIndex}
                      isSelected={selectedSubtitleId === subtitle.id}
                      isCurrent={currentSubtitleId === subtitle.id}
                      isEditing={editingSubtitleId === subtitle.id}
                      onEdit={handleEdit}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      onDelete={() => deleteSubtitle(subtitle.id)}
                      onSelect={() => handleSubtitleSelect(subtitle)}
                      onTimeChange={handleTimeChange}
                      formatTime={formatTime}
                    />
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
