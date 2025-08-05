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

export function SubtitleEditor() {
  const {
    subtitles,
    selectedSubtitleId,
    updateSubtitle,
    deleteSubtitle,
    selectSubtitle,
    addSubtitle,
  } = useSubtitleStore();

  const { setCurrentTime, video } = useVideoStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const subtitleRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // 현재 재생 중인 자막 계산
  const currentSubtitle = useMemo(() => {
    return (
      subtitles.find(
        (sub) =>
          video.currentTime >= sub.startTime && video.currentTime <= sub.endTime
      ) || null
    );
  }, [subtitles, video.currentTime]);

  // 선택된 자막으로 스크롤
  useEffect(() => {
    if (selectedSubtitleId && subtitleRefs.current[selectedSubtitleId]) {
      const selectedElement = subtitleRefs.current[selectedSubtitleId];
      selectedElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedSubtitleId]);

  // 자동 스크롤 로직 - 가장 최적화된 버전
  const autoScrollRef = useRef(autoScroll);
  const isPlayingRef = useRef(video.isPlaying);
  const selectedSubtitleIdRef = useRef(selectedSubtitleId);

  // refs 업데이트
  autoScrollRef.current = autoScroll;
  isPlayingRef.current = video.isPlaying;
  selectedSubtitleIdRef.current = selectedSubtitleId;

  useEffect(() => {
    if (
      autoScrollRef.current &&
      isPlayingRef.current &&
      currentSubtitle &&
      currentSubtitle.id !== selectedSubtitleIdRef.current
    ) {
      selectSubtitle(currentSubtitle.id);
    }
  }, [currentSubtitle?.id]); // 오직 현재 자막 ID 변경에만 의존

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSubtitleSelect = (subtitle: SubtitleItemType) => {
    selectSubtitle(subtitle.id);
    setCurrentTime(subtitle.startTime);
  };

  const handleEdit = (subtitle: SubtitleItemType) => {
    // 편집 시 자동으로 선택되도록 함
    handleSubtitleSelect(subtitle);
    setEditingId(subtitle.id);
  };

  const handleSave = (id: string, newText: string) => {
    updateSubtitle(id, { text: newText });
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleTimeChange = (
    id: string,
    field: "startTime" | "endTime",
    value: string
  ) => {
    const timeValue = parseFloat(value) || 0;
    updateSubtitle(id, { [field]: timeValue });
  };

  const handleAddSubtitle = () => {
    const newSubtitle = {
      text: "",
      startTime: 0,
      endTime: 2,
    };
    addSubtitle(newSubtitle);
    // Store에서 자동으로 생성된 ID로 편집 모드 설정
    setTimeout(() => {
      const newestSubtitle = subtitles[subtitles.length - 1];
      if (newestSubtitle) {
        selectSubtitle(newestSubtitle.id);
        setEditingId(newestSubtitle.id);
      }
    }, 0);
  };

  // Filter subtitles based on search term
  const filteredSubtitles = subtitles.filter((subtitle) =>
    subtitle.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            onClick={() => setAutoScroll(!autoScroll)}
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

      {/* Subtitle List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredSubtitles.length === 0 ? (
          <EmptyState
            type={subtitles.length === 0 ? "no-subtitles" : "no-results"}
            onAddSubtitle={
              subtitles.length === 0 ? handleAddSubtitle : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredSubtitles
              .sort((a, b) => a.startTime - b.startTime)
              .map((subtitle, index) => (
                <div
                  key={subtitle.id}
                  ref={(el) => {
                    subtitleRefs.current[subtitle.id] = el;
                  }}
                >
                  <SubtitleItem
                    subtitle={subtitle}
                    index={index + 1}
                    isSelected={selectedSubtitleId === subtitle.id}
                    isCurrent={currentSubtitle?.id === subtitle.id}
                    isEditing={editingId === subtitle.id}
                    onEdit={handleEdit}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onDelete={() => deleteSubtitle(subtitle.id)}
                    onSelect={() => handleSubtitleSelect(subtitle)}
                    onTimeChange={handleTimeChange}
                    formatTime={formatTime}
                  />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
