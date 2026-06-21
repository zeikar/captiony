// Runs before every test file. jsdom (configured in vitest.config.ts) supplies the
// DOM for React component tests; we still provide a deterministic in-memory
// localStorage (jsdom's varies across versions) that the persisted subtitle store
// reads/writes on load.
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

Object.defineProperty(globalThis, "localStorage", {
  value: new MemoryStorage(),
  configurable: true,
  writable: true,
});

afterEach(() => {
  // Unmount React trees rendered via Testing Library.
  cleanup();
  // Reset persisted store writes between tests.
  localStorage.clear();
});
