"use client";

import { useState, useRef, useEffect, memo } from "react";
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
  isCurrent?: boolean; // 현재 재생 중인 자막인지
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

function SubtitleItemComponent({
  subtitle,
  index,
  isSelected,
  isEditing,
  isCurrent = false,
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

  const duration = subtitle.endTime - subtitle.startTime;

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

  // Event handlers
  const handleSave = () => onSave(subtitle.id, editText);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const handleSelectClick = () => {
    if (!isEditing) onSelect();
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(subtitle);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleSave();
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancel();
  };

  // Style helpers
  const getDurationBadgeStyle = () => {
    if (duration < 1)
      return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
    if (duration > 5)
      return "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400";
    return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
  };

  const getContainerStyle = () => {
    const baseStyle =
      "group relative rounded-xl p-4 cursor-pointer transition-all duration-200 border-2";

    if (isCurrent) {
      return `${baseStyle} border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 shadow-lg scale-[1.02] ring-2 ring-green-200 dark:ring-green-800`;
    }

    const selectedStyle =
      "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-lg scale-[1.02]";
    const defaultStyle =
      "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 hover:shadow-md hover:scale-[1.01]";

    return `${baseStyle} ${isSelected ? selectedStyle : defaultStyle}`;
  };

  return (
    <div
      className={getContainerStyle()}
      onClick={handleSelectClick}
      style={{
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header
        subtitle={subtitle}
        index={index}
        duration={duration}
        formatTime={formatTime}
        getDurationBadgeStyle={getDurationBadgeStyle}
        isSelected={isSelected}
        isCurrent={isCurrent}
        onClick={handleSelectClick}
      />
      <TimeInputs
        subtitle={subtitle}
        onTimeChange={onTimeChange}
        onSelect={handleSelectClick}
        isEditing={isEditing}
      />
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <SubtitleText
          isEditing={isEditing}
          subtitle={subtitle}
          editText={editText}
          setEditText={setEditText}
          textareaRef={textareaRef}
          handleKeyDown={handleKeyDown}
          onSelect={handleSelectClick}
        />
      </div>
      <ActionButtons
        isEditing={isEditing}
        onSave={handleSaveClick}
        onCancel={handleCancelClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onSelect={handleSelectClick}
      />
      {isSelected && <SelectionIndicator />}
    </div>
  );
}

// Avoid re-rendering unchanged items during playback/scroll/other updates
function areSubtitleItemPropsEqual(
  prev: Readonly<SubtitleItemProps>,
  next: Readonly<SubtitleItemProps>
) {
  return (
    prev.subtitle === next.subtitle &&
    prev.index === next.index &&
    prev.isSelected === next.isSelected &&
    prev.isEditing === next.isEditing &&
    (prev.isCurrent ?? false) === (next.isCurrent ?? false) &&
    // ignore function identity changes; they are typically stable via useCallback,
    // but we won't force re-render based solely on handler identity
    true
  );
}

export const SubtitleItem = memo(
  SubtitleItemComponent,
  areSubtitleItemPropsEqual
);

// Sub-components

function Header({
  subtitle,
  index,
  duration,
  formatTime,
  getDurationBadgeStyle,
  isSelected,
  isCurrent,
  onClick,
}: {
  subtitle: SubtitleItemType;
  index: number;
  duration: number;
  formatTime: (seconds: number) => string;
  getDurationBadgeStyle: () => string;
  isSelected: boolean;
  isCurrent: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between mb-3 pt-1 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {/* Index Number */}
        <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-medium flex items-center justify-center">
          {index}
        </div>

        <div className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
          <ClockIcon className="h-4 w-4" />
          <span>{formatTime(subtitle.startTime)}</span>
          <span className="text-gray-400">→</span>
          <span>{formatTime(subtitle.endTime)}</span>
        </div>
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium ${getDurationBadgeStyle()}`}
        >
          {duration.toFixed(1)}s
        </div>
      </div>

      <div className="flex items-center gap-2">
        {subtitle.text && subtitle.text.length > 50 && (
          <div className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full">
            {subtitle.text.length}
          </div>
        )}

        {isCurrent && (
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium animate-pulse">
            <PlayIcon className="h-3 w-3" />
            <span>Now Playing</span>
          </div>
        )}

        {isSelected && !isCurrent && (
          <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
            <PlayIcon className="h-3 w-3" />
            <span>Selected</span>
          </div>
        )}
      </div>
    </div>
  );
}

function TimeInputs({
  subtitle,
  onTimeChange,
  onSelect,
  isEditing,
}: {
  subtitle: SubtitleItemType;
  onTimeChange: (
    id: string,
    field: "startTime" | "endTime",
    value: string
  ) => void;
  onSelect: () => void;
  isEditing: boolean;
}) {
  const handleContainerClick = (e: React.MouseEvent) => {
    if (!isEditing && e.target === e.currentTarget) {
      onSelect();
    }
  };

  const inputClass =
    "w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

  return (
    <div
      className="flex items-center gap-2 mb-3"
      onClick={handleContainerClick}
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
          className={inputClass}
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
          onChange={(e) => onTimeChange(subtitle.id, "endTime", e.target.value)}
          className={inputClass}
          step="0.1"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

function SubtitleText({
  isEditing,
  subtitle,
  editText,
  setEditText,
  textareaRef,
  handleKeyDown,
  onSelect,
}: {
  isEditing: boolean;
  subtitle: SubtitleItemType;
  editText: string;
  setEditText: (text: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSelect: () => void;
}) {
  if (isEditing) {
    return (
      <div className="mb-2 flex-1 flex flex-col" style={{ minHeight: 0 }}>
        <div className="relative flex-1" style={{ minHeight: 0 }}>
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors text-sm"
            placeholder="Enter subtitle text..."
            onClick={(e) => e.stopPropagation()}
            style={{ minHeight: "90px" }} // 120px → 90px로 감소
          />
          <div className="text-xs text-gray-400 mt-1 absolute bottom-1 right-2 bg-white dark:bg-gray-700 px-1 rounded opacity-75">
            Cmd+Enter: save, Esc: cancel
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-2 flex-1" style={{ minHeight: 0, overflow: "hidden" }}>
      <p
        className="text-gray-900 dark:text-white leading-relaxed min-h-[1.5rem] cursor-pointer"
        onClick={onSelect}
        style={{
          wordWrap: "break-word",
          whiteSpace: "pre-wrap",
          overflow: "visible",
        }}
      >
        {subtitle.text || <span className="text-gray-400 italic">No text</span>}
      </p>
    </div>
  );
}

function ActionButtons({
  isEditing,
  onSave,
  onCancel,
  onEdit,
  onDelete,
  onSelect,
}: {
  isEditing: boolean;
  onSave: (e: React.MouseEvent) => void;
  onCancel: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onSelect: () => void;
}) {
  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isEditing) {
      onSelect();
    }
  };

  return (
    <div
      className="flex items-center justify-end gap-1 min-h-[2rem] flex-shrink-0"
      onClick={handleContainerClick}
    >
      {isEditing ? (
        <>
          <button
            onClick={onSave}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
          >
            <CheckIcon className="h-3 w-3" />
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="h-3 w-3" />
            Cancel
          </button>
        </>
      ) : (
        <>
          <button
            onClick={onEdit}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all"
          >
            <PencilIcon className="h-3 w-3" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
          >
            <TrashIcon className="h-3 w-3" />
            Delete
          </button>
        </>
      )}
    </div>
  );
}

function SelectionIndicator() {
  return (
    <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full shadow-lg" />
  );
}
