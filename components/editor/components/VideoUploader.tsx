import { useState, useRef, useCallback } from "react";
import { ArrowUpTrayIcon, PlayCircleIcon } from "@heroicons/react/24/outline";

interface VideoUploaderProps {
  onVideoSelect: (file: File) => void;
  onYouTubeSelect: (url: string) => void;
}

export function VideoUploader({
  onVideoSelect,
  onYouTubeSelect,
}: VideoUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [youtubeInput, setYoutubeInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const videoFile = files.find((file) => file.type.startsWith("video/"));

      if (videoFile) {
        onVideoSelect(videoFile);
      }
    },
    [onVideoSelect]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith("video/")) {
        onVideoSelect(file);
      }
    },
    [onVideoSelect]
  );

  const handleYouTubeSubmit = useCallback(() => {
    const trimmed = youtubeInput.trim();
    if (!trimmed) return;
    // Validation happens in VideoPlayer; just pass the value up.
    onYouTubeSelect(trimmed);
  }, [youtubeInput, onYouTubeSelect]);

  const handleYouTubeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleYouTubeSubmit();
      }
    },
    [handleYouTubeSubmit]
  );

  return (
    <div className="w-full h-full flex flex-col sm:flex-row bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-t-xl">
      {/* Left half — local file (drag & drop / click to select) */}
      <div
        className={`flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 cursor-pointer transition-all duration-200 rounded-lg m-3 ${
          isDragOver
            ? "border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-900/20"
            : "border-2 border-dashed border-gray-300/70 dark:border-gray-600/70 hover:border-gray-400 dark:hover:border-gray-500"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="text-center pointer-events-none px-4">
          <div className="bg-white dark:bg-gray-700 rounded-full p-5 mb-4 shadow-lg border border-gray-200 dark:border-gray-600 inline-block">
            <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-base font-medium text-gray-600 dark:text-gray-300">
            Drag &amp; drop a video
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            or click to select a file
          </p>
          <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-3">
            Local file
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Divider */}
      <div className="self-stretch flex items-center justify-center">
        <div className="hidden sm:block w-px h-2/3 bg-gray-300 dark:bg-gray-600" />
        <div className="sm:hidden h-px w-2/3 bg-gray-300 dark:bg-gray-600" />
      </div>

      {/* Right half — YouTube link */}
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 px-6 py-6">
        <div className="bg-white dark:bg-gray-700 rounded-full p-5 mb-4 shadow-lg border border-gray-200 dark:border-gray-600">
          <PlayCircleIcon className="h-10 w-10 text-red-500/80" />
        </div>
        <p className="text-base font-medium text-gray-600 dark:text-gray-300 mb-3">
          Paste a YouTube link
        </p>
        <div className="flex gap-2 w-full max-w-sm">
          <input
            type="text"
            value={youtubeInput}
            onChange={(e) => setYoutubeInput(e.target.value)}
            onKeyDown={handleYouTubeKeyDown}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 min-w-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
          />
          <button
            onClick={handleYouTubeSubmit}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!youtubeInput.trim()}
          >
            Load
          </button>
        </div>
        <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-3">
          YouTube link
        </p>
      </div>
    </div>
  );
}
