"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  MagnifyingGlassIcon,
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
  BASE_ITEM_HEIGHT: 180, // 기본 높이
  EDITING_ITEM_HEIGHT: 240, // 편집 모드 높이 (280 → 240으로 감소)
  LONG_TEXT_ADDITIONAL_HEIGHT: 40, // 긴 텍스트 추가 높이 (60 → 40으로 감소)
  MARGIN_BOTTOM: 12,
  VISIBLE_ITEMS: 10,
  BUFFER_SIZE: 5,
} as const;

// 높이 계산 함수
const calculateItemHeight = (
  subtitle: SubtitleItemType,
  isEditing: boolean
): number => {
  const {
    BASE_ITEM_HEIGHT,
    EDITING_ITEM_HEIGHT,
    LONG_TEXT_ADDITIONAL_HEIGHT,
    MARGIN_BOTTOM,
  } = VIRTUAL_SCROLL_CONFIG;

  let height = isEditing ? EDITING_ITEM_HEIGHT : BASE_ITEM_HEIGHT;

  // 텍스트 길이에 따른 추가 높이 계산
  if (subtitle.text && subtitle.text.length > 100) {
    const additionalLines = Math.floor((subtitle.text.length - 100) / 50);
    height += Math.min(additionalLines * 20, LONG_TEXT_ADDITIONAL_HEIGHT);
  }

  return height + MARGIN_BOTTOM;
};

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

  // 동적 높이 계산
  const itemHeights = useMemo(() => {
    return sortedFilteredSubtitles.map((subtitle) =>
      calculateItemHeight(subtitle, editingSubtitleId === subtitle.id)
    );
  }, [sortedFilteredSubtitles, editingSubtitleId]);

  const cumulativeHeights = useMemo(() => {
    const cumulative = [0];
    itemHeights.forEach((height, index) => {
      cumulative[index + 1] = cumulative[index] + height;
    });
    return cumulative;
  }, [itemHeights]);

  const totalHeight = cumulativeHeights[cumulativeHeights.length - 1];

  // 가상 스크롤 계산 (동적 높이 지원)
  const visibleRange = useMemo(() => {
    const { VISIBLE_ITEMS, BUFFER_SIZE } = VIRTUAL_SCROLL_CONFIG;

    if (cumulativeHeights.length <= 1) {
      return { startIndex: 0, endIndex: 0 };
    }

    // 시작 인덱스 찾기 (binary search)
    let startIndex = 0;
    for (let i = 0; i < cumulativeHeights.length - 1; i++) {
      if (cumulativeHeights[i + 1] > scrollTop) {
        startIndex = Math.max(0, i - BUFFER_SIZE);
        break;
      }
    }

    // 끝 인덱스 찾기
    const containerHeight =
      VISIBLE_ITEMS * VIRTUAL_SCROLL_CONFIG.BASE_ITEM_HEIGHT;
    const targetBottom = scrollTop + containerHeight;
    let endIndex = sortedFilteredSubtitles.length - 1;

    for (let i = startIndex; i < cumulativeHeights.length - 1; i++) {
      if (cumulativeHeights[i] > targetBottom) {
        endIndex = Math.min(
          sortedFilteredSubtitles.length - 1,
          i + BUFFER_SIZE
        );
        break;
      }
    }

    return { startIndex, endIndex };
  }, [scrollTop, cumulativeHeights, sortedFilteredSubtitles.length]);

  const visibleSubtitles = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return sortedFilteredSubtitles
      .slice(startIndex, endIndex + 1)
      .map((subtitle, index) => ({
        subtitle,
        actualIndex: startIndex + index + 1,
      }));
  }, [sortedFilteredSubtitles, visibleRange]);

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

      const subtitleIndex = sortedFilteredSubtitles.findIndex(
        (sub) => sub.id === subtitleId
      );

      if (subtitleIndex === -1) return;

      const container = scrollContainerRef.current;
      const containerHeight = container.clientHeight;

      // 해당 자막의 위치 계산
      const itemTop = cumulativeHeights[subtitleIndex];
      const itemBottom = cumulativeHeights[subtitleIndex + 1];
      const itemHeight = itemBottom - itemTop;

      const currentScrollTop = container.scrollTop;
      const visibleTop = currentScrollTop;
      const visibleBottom = currentScrollTop + containerHeight;

      // 버퍼 영역을 고려한 가시성 판단
      const buffer = 50;
      if (
        itemTop >= visibleTop + buffer &&
        itemBottom <= visibleBottom - buffer
      ) {
        return; // 이미 충분히 보이므로 스크롤하지 않음
      }

      // 중앙에 위치하도록 스크롤
      const centeredScrollTop = itemTop - containerHeight / 2 + itemHeight / 2;

      container.scrollTo({
        top: Math.max(0, centeredScrollTop),
        behavior: "smooth",
      });
    },
    [sortedFilteredSubtitles, cumulativeHeights]
  );

  // Effects
  useEffect(() => {
    if (selectedSubtitleId) {
      // 약간의 지연을 두어 가상 스크롤 렌더링이 완료된 후 스크롤
      const timeoutId = setTimeout(() => {
        autoScrollToSubtitle(selectedSubtitleId);
      }, 100); // 50ms에서 100ms로 증가

      return () => clearTimeout(timeoutId);
    }
  }, [selectedSubtitleId, autoScrollToSubtitle]);

  // Auto-scroll이 꺼져있을 때도 키보드 네비게이션 시에는 스크롤 되도록 개선
  useEffect(() => {
    // 키보드 네비게이션으로 자막이 선택되었을 때 강제로 스크롤
    if (selectedSubtitleId && !isPlaying) {
      const timeoutId = setTimeout(() => {
        autoScrollToSubtitle(selectedSubtitleId);
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedSubtitleId, isPlaying, autoScrollToSubtitle]);

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
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Subtitles
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredSubtitles.length} of {subtitles.length} items
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleAutoScrollToggle}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
              autoScroll
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50"
                : "bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            }`}
            title={autoScroll ? "Auto-scroll enabled" : "Auto-scroll disabled"}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                autoScroll ? "bg-blue-500" : "bg-gray-400"
              }`}
            />
            Auto
          </button>

          <KeyboardShortcutsHelp />

          <button
            onClick={handleAddSubtitle}
            className="flex items-center gap-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search subtitles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-200/50 dark:border-gray-700/50 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-gray-300 dark:focus:border-gray-600 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200 text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none"
            >
              ×
            </button>
          )}
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
                transform: `translateY(${cumulativeHeights[startIndex]}px)`,
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
              }}
            >
              {visibleSubtitles.map(
                (
                  {
                    subtitle,
                    actualIndex,
                  }: {
                    subtitle: SubtitleItemType;
                    actualIndex: number;
                  },
                  index
                ) => {
                  const currentIndex = startIndex + index;
                  const itemHeight = itemHeights[currentIndex];
                  return (
                    <div
                      key={subtitle.id}
                      style={{
                        height: `${itemHeight}px`,
                        paddingBottom: `${VIRTUAL_SCROLL_CONFIG.MARGIN_BOTTOM}px`,
                        boxSizing: "border-box",
                      }}
                      ref={(el) => {
                        if (el) {
                          subtitleRefs.current.set(subtitle.id, el);
                        } else {
                          subtitleRefs.current.delete(subtitle.id);
                        }
                      }}
                    >
                      <div
                        style={{
                          height: `${
                            itemHeight - VIRTUAL_SCROLL_CONFIG.MARGIN_BOTTOM
                          }px`,
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
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
