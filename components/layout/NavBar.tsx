"use client";

import { ToolBar } from "../editor/ToolBar";
import { DarkModeToggle } from "../ui/DarkModeToggle";
import GitHubIcon from "../icons/GitHubIcon";

export function NavBar() {
  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 로고 */}
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Captiony
          </h1>
        </div>

        {/* 중앙 툴바 */}
        <div className="flex-1 flex justify-center max-w-4xl mx-8">
          <ToolBar />
        </div>

        {/* 오른쪽 GitHub 링크 + 다크모드 토글 */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/zeikar/captiony"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="View source on GitHub"
          >
            <GitHubIcon className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">GitHub</span>
          </a>
          <DarkModeToggle />
        </div>
      </div>
    </nav>
  );
}
