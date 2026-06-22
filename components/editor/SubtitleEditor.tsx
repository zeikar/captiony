"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from "@heroicons/react/24/outline";
import { useStore } from "zustand";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { SubtitleItem } from "./components/SubtitleItem";
import { EmptyState } from "./components/EmptyState";
import { KeyboardShortcutsHelp } from "./components/KeyboardShortcutsHelp";
import { findCurrentSubtitleId } from "./utils/subtitleUtils";
import { formatTime } from "./utils/timeUtils";
import type { SubtitleItem as SubtitleItemType } from "@/lib/stores/subtitle-store";

// Spacing between subtitle cards in the virtual list (px)
const ITEM_GAP = 12;

export function SubtitleEditor() {
  // Store hooks
  const subtitles = useSubtitleStore((s) => s.subtitles);
  const selectedSubtitleId = useSubtitleStore((s) => s.selectedSubtitleId);
  const editingSubtitleId = useSubtitleStore((s) => s.editingSubtitleId);
  const updateSubtitle = useSubtitleStore((s) => s.updateSubtitle);
  const deleteSubtitle = useSubtitleStore((s) => s.deleteSubtitle);
  const selectSubtitle = useSubtitleStore((s) => s.selectSubtitle);
  const selectedIds = useSubtitleStore((s) => s.selectedIds);
  const toggleSubtitleSelection = useSubtitleStore((s) => s.toggleSubtitleSelection);
  const rangeSelectSubtitle = useSubtitleStore((s) => s.rangeSelectSubtitle);
  const addSubtitle = useSubtitleStore((s) => s.addSubtitle);
  const setEditingSubtitle = useSubtitleStore((s) => s.setEditingSubtitle);

  // Undo/redo history (zundo temporal store) — reactive button state + imperative actions
  const canUndo = useStore(
    useSubtitleStore.temporal,
    (state) => state.pastStates.length > 0
  );
  const canRedo = useStore(
    useSubtitleStore.temporal,
    (state) => state.futureStates.length > 0
  );
  const handleUndo = () => useSubtitleStore.temporal.getState().undo();
  const handleRedo = () => useSubtitleStore.temporal.getState().redo();

  const currentTime = useVideoStore((s) => s.video.currentTime);
  const isPlaying = useVideoStore((s) => s.video.isPlaying);
  const setCurrentTime = useVideoStore((s) => s.setCurrentTime);

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);

  // Refs
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  // Latest range of rendered items, used to skip redundant scrolls.
  const visibleRangeRef = useRef({ startIndex: 0, endIndex: 0 });

  // Derived values
  const currentSubtitleId = useMemo(
    () => findCurrentSubtitleId(subtitles, currentTime),
    [subtitles, currentTime]
  );

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

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

  // Event handlers
  const handleSubtitleSelect = useCallback(
    (e: React.MouseEvent, subtitle: SubtitleItemType) => {
      // Modifier clicks manage selection only — they intentionally do NOT seek the playhead.
      if (e.metaKey || e.ctrlKey) {
        toggleSubtitleSelection(subtitle.id);
      } else if (e.shiftKey) {
        rangeSelectSubtitle(subtitle.id);
      } else {
        selectSubtitle(subtitle.id);
        setCurrentTime(subtitle.startTime);
      }
    },
    [selectSubtitle, setCurrentTime, toggleSubtitleSelection, rangeSelectSubtitle]
  );

  const handleEdit = useCallback(
    (subtitle: SubtitleItemType) => {
      selectSubtitle(subtitle.id);
      setCurrentTime(subtitle.startTime);
      setEditingSubtitle(subtitle.id);
    },
    [selectSubtitle, setCurrentTime, setEditingSubtitle]
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
    setAutoScroll((prev) => !prev);
  }, []);

  // Center a subtitle in the list, skipping the scroll if it's already visible.
  const scrollToSubtitle = useCallback(
    (subtitleId: string) => {
      const index = sortedFilteredSubtitles.findIndex(
        (sub) => sub.id === subtitleId
      );
      if (index === -1) return;

      const { startIndex, endIndex } = visibleRangeRef.current;
      if (index > startIndex && index < endIndex) return;

      virtuosoRef.current?.scrollToIndex({
        index,
        align: "center",
        behavior: "smooth",
      });
    },
    [sortedFilteredSubtitles]
  );

  // Effects

  // Scroll to the selected subtitle (manual click, keyboard nav, or playback follow).
  useEffect(() => {
    if (!selectedSubtitleId) return;

    // Defer so Virtuoso has the latest data/range before scrolling.
    const timeoutId = setTimeout(() => {
      scrollToSubtitle(selectedSubtitleId);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [selectedSubtitleId, scrollToSubtitle]);

  // Follow the playing subtitle: selecting it drives the scroll effect above.
  useEffect(() => {
    if (!autoScroll || !isPlaying || !currentSubtitleId) return;
    if (currentSubtitleId === selectedSubtitleId) return;
    // Multi-selection is active — don't collapse it while playback advances.
    if (selectedIds.length > 1) return;

    selectSubtitle(currentSubtitleId);
  }, [currentSubtitleId, autoScroll, isPlaying, selectedSubtitleId, selectSubtitle, selectedIds]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-y-3 px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
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

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

          <button
            onClick={handleUndo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo"
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            <ArrowUturnLeftIcon className="h-5 w-5" />
          </button>

          <button
            onClick={handleRedo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo"
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            <ArrowUturnRightIcon className="h-5 w-5" />
          </button>

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

      {/* Subtitle List — horizontal padding lives on each item (inside the scroller),
          so the scrollbar sits at the panel edge and the gutter gives each card's
          hover scale/shadow and selection indicator room instead of clipping them. */}
      <div className="flex-1 min-h-0 py-4">
        {filteredSubtitles.length === 0 ? (
          <EmptyState
            type={subtitles.length === 0 ? "no-subtitles" : "no-results"}
            onAddSubtitle={
              subtitles.length === 0 ? handleAddSubtitle : undefined
            }
          />
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            style={{ height: "100%" }}
            data={sortedFilteredSubtitles}
            computeItemKey={(_, subtitle) => subtitle.id}
            rangeChanged={(range) => {
              visibleRangeRef.current = range;
            }}
            itemContent={(index, subtitle) => (
              <div className="px-4" style={{ paddingBottom: ITEM_GAP }}>
                <SubtitleItem
                  subtitle={subtitle}
                  index={index + 1}
                  isSelected={selectedIdSet.has(subtitle.id)}
                  isCurrent={currentSubtitleId === subtitle.id}
                  isEditing={editingSubtitleId === subtitle.id}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  onDelete={() => deleteSubtitle(subtitle.id)}
                  onSelect={(e) => handleSubtitleSelect(e, subtitle)}
                  onTimeChange={handleTimeChange}
                  formatTime={formatTime}
                />
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
