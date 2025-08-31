"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { QuestionMarkCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface Shortcut {
  key: string;
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Playback Control
  { key: "Space", description: "Play/Pause", category: "Playback Control" },
  {
    key: "K",
    description: "Play/Pause (alternative)",
    category: "Playback Control",
  },
  {
    key: "←",
    description: "Jump back 5 seconds",
    category: "Playback Control",
  },
  {
    key: "→",
    description: "Jump forward 5 seconds",
    category: "Playback Control",
  },
  {
    key: "J",
    description: "Jump back 1 second",
    category: "Playback Control",
  },
  {
    key: "L",
    description: "Jump forward 1 second",
    category: "Playback Control",
  },

  // Subtitle Creation
  {
    key: "N",
    description: "Add new subtitle at current time",
    category: "Subtitle Creation",
  },
  {
    key: "Cmd/Ctrl + Enter",
    description: "Add new subtitle (alternative)",
    category: "Subtitle Creation",
  },

  // Subtitle Navigation
  {
    key: "↑",
    description: "Select previous subtitle",
    category: "Subtitle Navigation",
  },
  {
    key: "↓",
    description: "Select next subtitle",
    category: "Subtitle Navigation",
  },
  {
    key: "M",
    description: "Jump to nearest subtitle",
    category: "Subtitle Navigation",
  },
  {
    key: "Esc",
    description: "Deselect subtitle",
    category: "Subtitle Navigation",
  },

  // Subtitle Editing
  {
    key: "Enter",
    description: "Edit selected subtitle",
    category: "Subtitle Editing",
  },
  {
    key: "Delete / Backspace",
    description: "Delete selected subtitle",
    category: "Subtitle Editing",
  },
  {
    key: "I",
    description: "Set In point (start time) to current time",
    category: "Subtitle Editing",
  },
  {
    key: "O",
    description: "Set Out point (end time) to current time",
    category: "Subtitle Editing",
  },
  {
    key: "S",
    description: "Split subtitle at current time",
    category: "Subtitle Editing",
  },

  // Subtitle Movement
  {
    key: "Shift + ←",
    description: "Move subtitle left (0.1s)",
    category: "Subtitle Movement",
  },
  {
    key: "Shift + →",
    description: "Move subtitle right (0.1s)",
    category: "Subtitle Movement",
  },
];

const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Keyboard shortcuts help"
      >
        <QuestionMarkCircleIcon className="h-4 w-4" />
        Shortcuts
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <Dialog.Title
                      as="h2"
                      className="text-xl font-semibold text-gray-900 dark:text-white"
                    >
                      Keyboard Shortcuts
                    </Dialog.Title>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category} className="mb-6 last:mb-0">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                          {category}
                        </h3>
                        <div className="space-y-2">
                          {shortcuts
                            .filter(
                              (shortcut) => shortcut.category === category
                            )
                            .map((shortcut, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                              >
                                <span className="text-gray-700 dark:text-gray-300">
                                  {shortcut.description}
                                </span>
                                <kbd className="px-2 py-1 text-xs font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-gray-900 dark:text-gray-100">
                                  {shortcut.key}
                                </kbd>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      💡 Tip: Only Escape key works while editing in input
                      fields.
                    </p>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
