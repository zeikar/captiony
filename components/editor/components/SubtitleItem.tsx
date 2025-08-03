"use client";

import { useState, useRef, useEffect } from "react";
import {
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import type { SubtitleItem as SubtitleItemType } from "@/lib/stores/subtitle-store";

interface SubtitleItemProps {
  subtitle: SubtitleItemType;
  index: number;
  isSelected: boolean;
  isEditing: boolean;
  onEdit: (subtitle: SubtitleItemType) => void;
  onSave: (id: string, text: string) => void;
  onCancel: () => void;
  onDelete: () => void;
  onSelect: () => void;
  onTimeChange: (
    id: string,
    field: "startTime" | "endTime",
    value: string
  ) => void;
  formatTime: (seconds: number) => string;
}

export function SubtitleItem({
  subtitle,
  index,
  isSelected,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onSelect,
  onTimeChange,
  formatTime,
}: SubtitleItemProps) {
  const [editText, setEditText] = useState(subtitle.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus and select text when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Update edit text when subtitle text changes
  useEffect(() => {
    if (!isEditing) {
      setEditText(subtitle.text);
    }
  }, [subtitle.text, isEditing]);

  const handleSaveClick = () => {
    onSave(subtitle.id, editText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveClick();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const duration = subtitle.endTime - subtitle.startTime;

  const handleContainerClick = (e: React.MouseEvent) => {
    // 편집 모드가 아닐 때만 선택 가능
    if (!isEditing) {
      onSelect();
    }
  };

  return (
    <div
      className={`group relative rounded-xl p-4 cursor-pointer transition-all duration-200 border-2 ${
        isSelected
          ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-lg scale-[1.02]"
          : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 hover:shadow-md hover:scale-[1.01]"
      }`}
      onClick={handleContainerClick}
    >
      {/* Index badge - now inside the item */}
      <div
        className="absolute -top-2 -left-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg z-10 cursor-pointer"
        onClick={() => !isEditing && onSelect()}
      >
        {index}
      </div>

      {/* Header with timing info */}
      <div
        className="flex items-center justify-between mb-3 pt-1 cursor-pointer"
        onClick={() => !isEditing && onSelect()}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
            <ClockIcon className="h-4 w-4" />
            <span>{formatTime(subtitle.startTime)}</span>
            <span className="text-gray-400">→</span>
            <span>{formatTime(subtitle.endTime)}</span>
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              duration < 1
                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                : duration > 5
                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            }`}
          >
            {duration.toFixed(1)}s
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Character count indicator for long texts - moved here to avoid overlap */}
          {subtitle.text && subtitle.text.length > 50 && (
            <div className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full">
              {subtitle.text.length}
            </div>
          )}

          {isSelected && (
            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium animate-pulse">
              <PlayIcon className="h-3 w-3" />
              <span>Playing</span>
            </div>
          )}
        </div>
      </div>

      {/* Time inputs for editing */}
      <div
        className="flex items-center gap-2 mb-3"
        onClick={(e) => {
          // input이 아닌 영역을 클릭했을 때만 선택
          if (!isEditing && e.target === e.currentTarget) {
            onSelect();
          }
        }}
      >
        <div className="flex items-center gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Start:
          </label>
          <input
            type="number"
            value={subtitle.startTime.toFixed(2)}
            onChange={(e) =>
              onTimeChange(subtitle.id, "startTime", e.target.value)
            }
            className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            step="0.1"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            End:
          </label>
          <input
            type="number"
            value={subtitle.endTime.toFixed(2)}
            onChange={(e) =>
              onTimeChange(subtitle.id, "endTime", e.target.value)
            }
            className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            step="0.1"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* Subtitle Text */}
      <div className="mb-3">
        {isEditing ? (
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
              rows={3}
              placeholder="Enter subtitle text..."
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-xs text-gray-400 mt-1">
              Press Cmd+Enter to save, Esc to cancel
            </div>
          </div>
        ) : (
          <p
            className="text-gray-900 dark:text-white leading-relaxed min-h-[1.5rem] cursor-pointer"
            onClick={() => !isEditing && onSelect()}
          >
            {subtitle.text || (
              <span className="text-gray-400 italic">No text</span>
            )}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div
        className="flex items-center justify-end gap-1 min-h-[2rem]"
        onClick={(e) => {
          // 버튼이 아닌 빈 공간을 클릭했을 때만 선택
          if (e.target === e.currentTarget && !isEditing) {
            onSelect();
          }
        }}
      >
        {isEditing ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSaveClick();
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              <CheckIcon className="h-4 w-4" />
              Save
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(subtitle);
              }}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          </>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full shadow-lg"></div>
      )}
    </div>
  );
}
