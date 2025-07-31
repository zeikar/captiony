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
      <div className="flex items-center gap-2 p-2 bg-gray-100 border-b">
        <button
          onClick={handleZoomOut}
          className="px-2 py-1 bg-white border rounded hover:bg-gray-50"
          disabled={timelineScale <= 0.5}
        >
          -
        </button>

        <span className="min-w-[60px] text-center text-sm">
          {Math.round(timelineScale * 100)}%
        </span>

        <button
          onClick={handleZoomIn}
          className="px-2 py-1 bg-white border rounded hover:bg-gray-50"
          disabled={timelineScale >= 5}
        >
          +
        </button>

        <button
          onClick={onResetZoom}
          className="px-2 py-1 bg-white border rounded hover:bg-gray-50 text-sm"
        >
          1:1
        </button>

        <button
          onClick={onFitToView}
          className="px-2 py-1 bg-white border rounded hover:bg-gray-50 text-sm"
        >
          Fit
        </button>
      </div>
    );
  }
);
