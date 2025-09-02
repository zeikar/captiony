import { useState, useRef, useCallback } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";

interface VideoUploaderProps {
  onVideoSelect: (file: File) => void;
}

export function VideoUploader({ onVideoSelect }: VideoUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      onVideoSelect(videoFile);
    }
  }, [onVideoSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      onVideoSelect(file);
    }
  }, [onVideoSelect]);

  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 text-gray-500 dark:text-gray-400 rounded-t-xl cursor-pointer transition-all duration-200 ${
        isDragOver
          ? 'border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-900/20'
          : 'border-2 border-dashed border-transparent hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="text-center pointer-events-none">
        <div className="bg-white dark:bg-gray-700 rounded-full p-6 mb-4 shadow-lg border border-gray-200 dark:border-gray-600 inline-block">
          <PlusIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
          Select a video to get started
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Drag and drop or click to select your video file
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
  );
}