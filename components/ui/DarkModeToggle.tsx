"use client";

import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "@/components/providers/ThemeProvider";

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <SunIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />;
      case "dark":
        return (
          <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        );
      case "system":
        return (
          <ComputerDesktopIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        );
    }
  };

  const getLabel = () => {
    switch (theme) {
      case "light":
        return "Light mode";
      case "dark":
        return "Dark mode";
      case "system":
        return "System mode";
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      aria-label={`Switch to next theme (current: ${getLabel()})`}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  );
}
