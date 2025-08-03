"use client";

import { ToolBar } from "../editor/ToolBar";
import { DarkModeToggle } from "../ui/DarkModeToggle";

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

        {/* 오른쪽 다크모드 토글 */}
        <div className="flex items-center">
          <DarkModeToggle />
        </div>
      </div>
    </nav>
  );
}
