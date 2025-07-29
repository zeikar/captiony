"use client";

import { useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import type { SubtitleItem } from "@/lib/stores/subtitle-store";

export function SubtitleEditor() {
  const {
    subtitles,
    selectedSubtitleId,
    updateSubtitle,
    deleteSubtitle,
    selectSubtitle,
    setCurrentTime,
  } = useSubtitleStore();

  const [editingId, setEditingId] = useState<string | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms
      .toString()
      .padStart(2, "0")}`;
  };

  const handleEdit = (subtitle: SubtitleItem) => {
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

  const handleSubtitleClick = (subtitle: SubtitleItem) => {
    selectSubtitle(subtitle.id);
    setCurrentTime(subtitle.startTime);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Subtitle List
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {subtitles.length} items
        </span>
      </div>

      {subtitles.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <p>No subtitles yet.</p>
          <p className="text-sm mt-2">
            Click "Add Subtitle" in the toolbar to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {subtitles
            .sort((a, b) => a.startTime - b.startTime)
            .map((subtitle) => (
              <SubtitleItem
                key={subtitle.id}
                subtitle={subtitle}
                isSelected={selectedSubtitleId === subtitle.id}
                isEditing={editingId === subtitle.id}
                onEdit={handleEdit}
                onSave={handleSave}
                onCancel={handleCancel}
                onDelete={() => deleteSubtitle(subtitle.id)}
                onClick={() => handleSubtitleClick(subtitle)}
                onTimeChange={handleTimeChange}
                formatTime={formatTime}
              />
            ))}
        </div>
      )}
    </div>
  );
}

interface SubtitleItemProps {
  subtitle: SubtitleItem;
  isSelected: boolean;
  isEditing: boolean;
  onEdit: (subtitle: SubtitleItem) => void;
  onSave: (id: string, text: string) => void;
  onCancel: () => void;
  onDelete: () => void;
  onClick: () => void;
  onTimeChange: (
    id: string,
    field: "startTime" | "endTime",
    value: string
  ) => void;
  formatTime: (seconds: number) => string;
}

function SubtitleItem({
  subtitle,
  isSelected,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onClick,
  onTimeChange,
  formatTime,
}: SubtitleItemProps) {
  const [editText, setEditText] = useState(subtitle.text);

  const handleSaveClick = () => {
    onSave(subtitle.id, editText);
  };

  return (
    <div
      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
      }`}
      onClick={!isEditing ? onClick : undefined}
    >
      {/* Time Information */}
      <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
        <input
          type="number"
          value={subtitle.startTime.toFixed(2)}
          onChange={(e) =>
            onTimeChange(subtitle.id, "startTime", e.target.value)
          }
          className="w-16 px-1 py-0.5 text-xs border rounded"
          step="0.1"
          onClick={(e) => e.stopPropagation()}
        />
        <span>~</span>
        <input
          type="number"
          value={subtitle.endTime.toFixed(2)}
          onChange={(e) => onTimeChange(subtitle.id, "endTime", e.target.value)}
          className="w-16 px-1 py-0.5 text-xs border rounded"
          step="0.1"
          onClick={(e) => e.stopPropagation()}
        />
        <span className="text-xs">
          ({formatTime(subtitle.startTime)} - {formatTime(subtitle.endTime)})
        </span>
      </div>

      {/* Subtitle Text */}
      <div className="mb-2">
        {isEditing ? (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full p-2 border rounded resize-none"
            rows={2}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p className="text-gray-900 dark:text-white">{subtitle.text}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div
        className="flex items-center justify-end gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {isEditing ? (
          <>
            <button
              onClick={handleSaveClick}
              className="p-1 text-green-600 hover:text-green-700"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onCancel}
              className="p-1 text-gray-600 hover:text-gray-700"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onEdit(subtitle)}
              className="p-1 text-blue-600 hover:text-blue-700"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-red-600 hover:text-red-700"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
