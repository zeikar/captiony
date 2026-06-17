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
import { findCurrentSubtitleId } from "./utils/subtitleUtils";
import type { SubtitleItem as SubtitleItemType } from "@/lib/stores/subtitle-store";

// Virtual scroll constants
const VIRTUAL_SCROLL_CONFIG = {
  BASE_ITEM_HEIGHT: 180, // default height
  EDITING_ITEM_HEIGHT: 240, // editing mode height (reduced from 280 to 240)
  LONG_TEXT_ADDITIONAL_HEIGHT: 40, // extra height for long text (reduced from 60 to 40)
  MARGIN_BOTTOM: 12,
  VISIBLE_ITEMS: 10,
  BUFFER_SIZE: 5,
} as const;

// Height calculation function
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

  // Extra height based on text length
  if (subtitle.text && subtitle.text.length > 100) {
    const additionalLines = Math.floor((subtitle.text.length - 100) / 50);
    height += Math.min(additionalLines * 20, LONG_TEXT_ADDITIONAL_HEIGHT);
  }

  return height + MARGIN_BOTTOM;
};

// Utility functions
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, "0")}.${ms
    .toString()
    .padStart(2, "0")}`;
};

export function SubtitleEditor() {
  // Store hooks
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

  // Local state
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

  // Derived values
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

    // Skip sort if already sorted
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

  // Dynamic height calculation
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

  // Virtual scroll calculation (supports dynamic heights)
  const visibleRange = useMemo(() => {
    const { VISIBLE_ITEMS, BUFFER_SIZE } = VIRTUAL_SCROLL_CONFIG;

    if (cumulativeHeights.length <= 1) {
      return { startIndex: 0, endIndex: 0 };
    }

    // Find start index (binary search)
    let startIndex = 0;
    for (let i = 0; i < cumulativeHeights.length - 1; i++) {
      if (cumulativeHeights[i + 1] > scrollTop) {
        startIndex = Math.max(0, i - BUFFER_SIZE);
        break;
      }
    }

    // Find end index
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

  // Event handlers
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

      // Calculate the target subtitle's position
      const itemTop = cumulativeHeights[subtitleIndex];
      const itemBottom = cumulativeHeights[subtitleIndex + 1];
      const itemHeight = itemBottom - itemTop;

      const currentScrollTop = container.scrollTop;
      const visibleTop = currentScrollTop;
      const visibleBottom = currentScrollTop + containerHeight;

      // Visibility check accounting for buffer zone
      const buffer = 50;
      if (
        itemTop >= visibleTop + buffer &&
        itemBottom <= visibleBottom - buffer
      ) {
        return; // already fully visible, no scroll needed
      }

      // Scroll to center the item
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
      // Small delay to let virtual scroll finish rendering before scrolling
      const timeoutId = setTimeout(() => {
        autoScrollToSubtitle(selectedSubtitleId);
      }, 100); // increased from 50ms to 100ms

      return () => clearTimeout(timeoutId);
    }
  }, [selectedSubtitleId, autoScrollToSubtitle]);

  // Scroll on keyboard navigation even when auto-scroll is off
  useEffect(() => {
    // Force scroll when a subtitle is selected via keyboard navigation
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

      {/* Subtitle List - virtual scroll */}
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
