"use client";

import { useRef } from "react";
import {
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  FolderOpenIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { saveAs } from "file-saver";

export function ToolBar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);

  const { setVideoUrl, addSubtitle, exportSRT, importSRT, video } =
    useSubtitleStore();

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };

  const handleSRTUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        importSRT(content);
      };
      reader.readAsText(file);
    }
  };

  const handleExportSRT = () => {
    const srtContent = exportSRT();
    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "subtitles.srt");
  };

  const handleAddSubtitle = () => {
    const currentTime = video.currentTime;
    addSubtitle({
      startTime: currentTime,
      endTime: currentTime + 3, // 3초 길이
      text: "Enter new subtitle text",
    });
  };

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      {/* Upload Video */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <CloudArrowUpIcon className="h-5 w-5" />
        Upload Video
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
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <FolderOpenIcon className="h-5 w-5" />
        Load Subtitles
      </button>
      <input
        ref={srtInputRef}
        type="file"
        accept=".srt,.vtt"
        onChange={handleSRTUpload}
        className="hidden"
      />

      {/* Add Subtitle */}
      <button
        onClick={handleAddSubtitle}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        <PlusIcon className="h-5 w-5" />
        Add Subtitle
      </button>

      {/* Export SRT */}
      <button
        onClick={handleExportSRT}
        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
      >
        <DocumentArrowDownIcon className="h-5 w-5" />
        Export SRT
      </button>
    </div>
  );
}
