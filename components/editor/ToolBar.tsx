"use client";

import { useRef } from "react";
import {
  PlusIcon,
  DocumentArrowDownIcon,
  FolderOpenIcon,
} from "@heroicons/react/24/outline";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { saveAs } from "file-saver";

export function ToolBar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);

  const { exportSRT, exportVTT, importSubtitles } = useSubtitleStore();
  const { setVideoUrl } = useVideoStore();

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };

  const handleSubtitleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        importSubtitles(content, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleExportSRT = () => {
    const srtContent = exportSRT();
    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "subtitles.srt");
  };

  const handleExportVTT = () => {
    const vttContent = exportVTT();
    const blob = new Blob([vttContent], { type: "text/vtt;charset=utf-8" });
    saveAs(blob, "subtitles.vtt");
  };

  return (
    <div className="flex items-center gap-3">
      {/* Select Video */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
      >
        <PlusIcon className="h-4 w-4" />
        Select Video
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        className="hidden"
      />

      {/* Load Subtitles */}
      <button
        onClick={() => srtInputRef.current?.click()}
        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
      >
        <FolderOpenIcon className="h-4 w-4" />
        Load Subtitles
      </button>
      <input
        ref={srtInputRef}
        type="file"
        accept=".srt,.vtt"
        onChange={handleSubtitleUpload}
        className="hidden"
      />

      {/* Export SRT */}
      <button
        onClick={handleExportSRT}
        className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm"
      >
        <DocumentArrowDownIcon className="h-4 w-4" />
        Export SRT
      </button>

      {/* Export VTT */}
      <button
        onClick={handleExportVTT}
        className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
      >
        <DocumentArrowDownIcon className="h-4 w-4" />
        Export VTT
      </button>
    </div>
  );
}
