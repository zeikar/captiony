"use client";

import { useRef } from "react";
import {
  PlusIcon,
  DocumentArrowDownIcon,
  FolderOpenIcon,
  DocumentPlusIcon,
} from "@heroicons/react/24/outline";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { saveAs } from "file-saver";

export function ToolBar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);

  const { exportSRT, exportVTT, importSubtitles, clearAllSubtitles } =
    useSubtitleStore();
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

  const handleNewProject = () => {
    const confirmed = window.confirm(
      "Are you sure you want to start a new project? All current subtitles will be cleared."
    );
    if (confirmed) {
      clearAllSubtitles();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleNewProject}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-800/30 dark:hover:to-teal-800/30 text-emerald-700 dark:text-emerald-300 rounded-lg transition-all duration-200 text-sm font-medium border border-emerald-200/50 dark:border-emerald-700/50 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-sm group"
      >
        <DocumentPlusIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
        New Project
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600/50 text-gray-700 dark:text-gray-200 rounded-lg transition-all duration-200 text-sm font-medium border border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm group"
      >
        <PlusIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
        Select Video
      </button>
      
      <button
        onClick={() => srtInputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600/50 text-gray-700 dark:text-gray-200 rounded-lg transition-all duration-200 text-sm font-medium border border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm group"
      >
        <FolderOpenIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
        Load Subtitles
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      <button
        onClick={handleExportSRT}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30 text-blue-700 dark:text-blue-300 rounded-lg transition-all duration-200 text-sm font-medium border border-blue-200/50 dark:border-blue-700/50 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm group"
      >
        <DocumentArrowDownIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
        Export SRT
      </button>
      
      <button
        onClick={handleExportVTT}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/30 dark:hover:to-pink-800/30 text-purple-700 dark:text-purple-300 rounded-lg transition-all duration-200 text-sm font-medium border border-purple-200/50 dark:border-purple-700/50 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-sm group"
      >
        <DocumentArrowDownIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
        Export VTT
      </button>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        className="hidden"
      />
      <input
        ref={srtInputRef}
        type="file"
        accept=".srt,.vtt"
        onChange={handleSubtitleUpload}
        className="hidden"
      />
    </div>
  );
}
