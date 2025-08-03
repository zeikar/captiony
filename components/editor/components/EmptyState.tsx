"use client";

import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";

interface EmptyStateProps {
  type: "no-subtitles" | "no-results";
  onAddSubtitle?: () => void;
}

export function EmptyState({ type, onAddSubtitle }: EmptyStateProps) {
  if (type === "no-subtitles") {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-16">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <PlusIcon className="h-10 w-10 text-blue-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No subtitles yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          Start creating subtitles for your video. You can add, edit, and time
          them perfectly.
        </p>
        {onAddSubtitle && (
          <button
            onClick={onAddSubtitle}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            <PlusIcon className="h-4 w-4" />
            Create First Subtitle
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center text-gray-500 dark:text-gray-400 py-16">
      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
        <MagnifyingGlassIcon className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No results found
      </h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
        Try adjusting your search terms or clear the search to see all
        subtitles.
      </p>
    </div>
  );
}
