"use client";

import React from "react";
import { TimelineMode } from "@/lib/stores/subtitle-store";

interface TimelineControlsProps {
  timelineScale: number;
  timelineMode: TimelineMode;
  onScaleChange: (scale: number) => void;
  onModeChange: (mode: TimelineMode) => void;
  onFitToView: () => void;
  onResetZoom: () => void;
}

export const TimelineControls = React.memo<TimelineControlsProps>(
  ({
    timelineScale,
    timelineMode,
    onScaleChange,
    onModeChange,
    onFitToView,
    onResetZoom,
  }) => {
    const handleZoomIn = () => {
      onScaleChange(Math.min(5, timelineScale * 1.2));
    };

    const handleZoomOut = () => {
      onScaleChange(Math.max(0.5, timelineScale * 0.8));
    };

    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
        {/* Timeline Mode Toggle */}
        <div className="flex items-center bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-0.5 border border-gray-200/50 dark:border-gray-700/50">
          <button
            onClick={() => onModeChange("free")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              timelineMode === "free"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Free
          </button>
          <button
            onClick={() => onModeChange("centered")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              timelineMode === "centered"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Centered
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1 border border-gray-200/50 dark:border-gray-700/50">
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-base"
              disabled={timelineScale <= 0.5}
            >
              −
            </button>

            <span className="min-w-[60px] text-center text-xs text-gray-600 dark:text-gray-400 font-mono px-2 py-1">
              {Math.round(timelineScale * 100)}%
            </span>

            <button
              onClick={handleZoomIn}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-base"
              disabled={timelineScale >= 5}
            >
              +
            </button>
          </div>

          <button
            onClick={onResetZoom}
            className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200 font-medium"
          >
            Reset
          </button>

          <button
            onClick={onFitToView}
            className="px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 text-xs font-medium transition-all duration-200 shadow-sm"
          >
            Fit to View
          </button>
        </div>
      </div>
    );
  }
);
