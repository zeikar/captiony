"use client";

import React from "react";

interface TimelineControlsProps {
  timelineScale: number;
  onScaleChange: (scale: number) => void;
  onFitToView: () => void;
  onResetZoom: () => void;
}

export const TimelineControls = React.memo<TimelineControlsProps>(
  ({ timelineScale, onScaleChange, onFitToView, onResetZoom }) => {
    const handleZoomIn = () => {
      onScaleChange(Math.min(5, timelineScale * 1.2));
    };

    const handleZoomOut = () => {
      onScaleChange(Math.max(0.5, timelineScale * 0.8));
    };

    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 font-medium"
            disabled={timelineScale <= 0.5}
          >
            −
          </button>

          <span className="min-w-[70px] text-center text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border">
            {Math.round(timelineScale * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 font-medium"
            disabled={timelineScale >= 5}
          >
            +
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetZoom}
            className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 text-sm text-gray-900 dark:text-gray-100 transition-colors duration-150"
          >
            1:1
          </button>

          <button
            onClick={onFitToView}
            className="px-3 py-1.5 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 text-sm transition-colors duration-150"
          >
            Fit to View
          </button>
        </div>
      </div>
    );
  }
);
